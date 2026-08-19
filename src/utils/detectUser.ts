import type { Coordinates } from '../types/coordinates'
import type { User } from '../types/user'
import { USER_NOT_FOUND } from '../types/user'

// Calibrated from the MapleStory Worlds player marker reference image.
// 9x9 cross/diamond shape — each cell is one pixel in the reference grid.
const MARKER_TEMPLATE: readonly (readonly number[])[] = [
  [0, 0, 0, 1, 1, 1, 0, 0, 0],
  [0, 0, 1, 1, 1, 1, 0, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 0, 0],
  [1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 0, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 1, 1, 1, 1, 1, 1, 0, 0],
  [0, 0, 0, 1, 1, 1, 0, 0, 0],
  [0, 0, 0, 1, 1, 1, 0, 0, 0],
]

const TEMPLATE_SIZE = MARKER_TEMPLATE.length
const MIN_CLUSTER_SIZE = 8
const MAX_CLUSTER_SIZE = 500
const IDEAL_CLUSTER_SIZE = 50
/** Top band of the MSW mini-map crop — title, location text, and map thumbnail. */
const MINIMAP_CHROME_TOP_FRACTION = 0.26
/** Top-left thumbnail sits below the title but above the playable map area. */
const MINIMAP_THUMBNAIL_MAX_X_FRACTION = 0.42
const MINIMAP_THUMBNAIL_MAX_Y_FRACTION = 0.38
/** Ignore implausible jumps between frames (minimap pixels). */
const MAX_TRACK_JUMP_FRACTION = 0.35
/** Reject a new detection when it jumps farther than this from the last good lock. */
const MAX_STABLE_JUMP_FRACTION = 0.18
const MIN_BLUE_CLUSTER_SIZE = 6
const MAX_BLUE_CLUSTER_SIZE = 140
const IDEAL_BLUE_CLUSTER_SIZE = 28

export interface DetectUserOptions {
  lastLocation?: Coordinates | null
}

function isInMinimapChrome(
  centroid: Coordinates,
  width: number,
  height: number,
): boolean {
  if (width <= 0 || height <= 0) return false

  const xFrac = centroid.x / width
  const yFrac = centroid.y / height

  if (yFrac < MINIMAP_CHROME_TOP_FRACTION) return true
  if (
    yFrac < MINIMAP_THUMBNAIL_MAX_Y_FRACTION &&
    xFrac < MINIMAP_THUMBNAIL_MAX_X_FRACTION
  ) {
    return true
  }

  return false
}

function isDarkBackground(r: number, g: number, b: number): boolean {
  const brightness = Math.max(r, g, b)
  if (brightness < 95) return true
  if (b > r + 15 && b > g + 5 && r < 120) return true
  return false
}

function isBrownGround(r: number, g: number, b: number): boolean {
  if (isDarkBackground(r, g, b)) return false
  if (r >= 195 && g >= 195) return false

  return (
    r >= 70 &&
    r <= 165 &&
    g >= 30 &&
    g <= 135 &&
    b >= 25 &&
    b <= 90 &&
    g <= r + 25
  )
}

function isMarkerYellow(r: number, g: number, b: number): boolean {
  if (isDarkBackground(r, g, b) || isBrownGround(r, g, b)) return false
  if (r < 195 || g < 195) return false
  if (b < 70 || b > 130) return false
  if (Math.abs(r - g) > 25) return false
  if (g > r + 10) return false

  return true
}

function isMarkerCore(r: number, g: number, b: number): boolean {
  return r >= 235 && g >= 235 && b >= 70 && b <= 130 && Math.abs(r - g) <= 20
}

function isPlayerBlue(r: number, g: number, b: number): boolean {
  if (isDarkBackground(r, g, b) || isBrownGround(r, g, b)) return false
  // MSW minimap player icon — bright blue circle (not teal water/sharks).
  return (
    b >= 155 &&
    r <= 115 &&
    g <= 185 &&
    b > r + 45 &&
    b > g + 12 &&
    r + g > 90
  )
}

function findClusters(
  width: number,
  height: number,
  mask: boolean[],
  minSize = MIN_CLUSTER_SIZE,
  maxSize = MAX_CLUSTER_SIZE,
): Coordinates[][] {
  const visited = new Array(width * height).fill(false)
  const clusters: Coordinates[][] = []
  const index = (x: number, y: number) => y * width + x

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = index(x, y)
      if (visited[i] || !mask[i]) continue

      const cluster: Coordinates[] = []
      const stack: Coordinates[] = [{ x, y }]

      while (stack.length > 0) {
        const point = stack.pop()
        if (!point) continue

        const pointIndex = index(point.x, point.y)
        if (visited[pointIndex] || !mask[pointIndex]) continue

        visited[pointIndex] = true
        cluster.push(point)

        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue

            const nx = point.x + dx
            const ny = point.y + dy
            if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue

            stack.push({ x: nx, y: ny })
          }
        }
      }

      if (cluster.length >= minSize && cluster.length <= maxSize) {
        clusters.push(cluster)
      }
    }
  }

  return clusters
}

function clusterBounds(cluster: Coordinates[]) {
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity

  for (const point of cluster) {
    minX = Math.min(minX, point.x)
    maxX = Math.max(maxX, point.x)
    minY = Math.min(minY, point.y)
    maxY = Math.max(maxY, point.y)
  }

  return { minX, maxX, minY, maxY }
}

function clusterCentroid(cluster: Coordinates[]): Coordinates {
  const total = cluster.reduce(
    (acc, point) => ({
      x: acc.x + point.x,
      y: acc.y + point.y,
    }),
    { x: 0, y: 0 },
  )

  return {
    x: total.x / cluster.length,
    y: total.y / cluster.length,
  }
}

function clusterRadius(cluster: Coordinates[], center: Coordinates): number {
  let maxDistance = 0

  for (const point of cluster) {
    const distance = Math.hypot(point.x - center.x, point.y - center.y)
    if (distance > maxDistance) maxDistance = distance
  }

  return Math.max(5, maxDistance + 2)
}

function clusterToTemplateGrid(cluster: Coordinates[]): boolean[][] {
  const { minX, maxX, minY, maxY } = clusterBounds(cluster)
  const width = maxX - minX + 1
  const height = maxY - minY + 1
  const grid = Array.from({ length: TEMPLATE_SIZE }, () =>
    Array(TEMPLATE_SIZE).fill(false),
  )

  for (const point of cluster) {
    const gx = Math.min(
      TEMPLATE_SIZE - 1,
      Math.floor(((point.x - minX) / width) * TEMPLATE_SIZE),
    )
    const gy = Math.min(
      TEMPLATE_SIZE - 1,
      Math.floor(((point.y - minY) / height) * TEMPLATE_SIZE),
    )
    grid[gy][gx] = true
  }

  return grid
}

function templateMatchScore(grid: boolean[][]): number {
  let matches = 0
  let templateFilled = 0
  let gridFilled = 0

  for (let y = 0; y < TEMPLATE_SIZE; y++) {
    for (let x = 0; x < TEMPLATE_SIZE; x++) {
      const templatePixel = MARKER_TEMPLATE[y][x] === 1
      const gridPixel = grid[y][x]

      if (templatePixel) templateFilled++
      if (gridPixel) gridFilled++
      if (templatePixel && gridPixel) matches++
    }
  }

  const union = templateFilled + gridFilled - matches
  if (union === 0) return 0

  return matches / union
}

function clusterScore(
  cluster: Coordinates[],
  width: number,
  data: Uint8ClampedArray,
): number {
  let colorScore = 0
  let corePixels = 0

  for (const point of cluster) {
    const offset = (point.y * width + point.x) * 4
    const r = data[offset]
    const g = data[offset + 1]
    const b = data[offset + 2]

    colorScore += Math.min(r, g) - b * 0.35
    if (isMarkerCore(r, g, b)) corePixels++
  }

  if (corePixels === 0) return -Infinity

  const averageColorScore = colorScore / cluster.length
  const templateScore = templateMatchScore(clusterToTemplateGrid(cluster)) * 120
  const sizePenalty = Math.abs(cluster.length - IDEAL_CLUSTER_SIZE) * 0.8
  const { minX, maxX, minY, maxY } = clusterBounds(cluster)
  const boxWidth = maxX - minX + 1
  const boxHeight = maxY - minY + 1
  const aspectRatio = boxWidth / boxHeight
  const aspectPenalty =
    aspectRatio < 0.55 || aspectRatio > 1.8 ? 40 : Math.abs(aspectRatio - 1) * 10

  return (
    averageColorScore + templateScore + corePixels * 3 - sizePenalty - aspectPenalty
  )
}

function clusterBlueScore(
  cluster: Coordinates[],
  width: number,
  data: Uint8ClampedArray,
): number {
  let blueScore = 0
  let bluePixels = 0

  for (const point of cluster) {
    const offset = (point.y * width + point.x) * 4
    const r = data[offset]
    const g = data[offset + 1]
    const b = data[offset + 2]

    if (!isPlayerBlue(r, g, b)) continue

    bluePixels += 1
    blueScore += b - r * 0.45
  }

  if (bluePixels < 5) return -Infinity

  const fillRatio = bluePixels / cluster.length
  if (fillRatio < 0.55) return -Infinity

  const sizePenalty = Math.abs(cluster.length - IDEAL_BLUE_CLUSTER_SIZE) * 1.1
  return blueScore / cluster.length + fillRatio * 45 - sizePenalty
}

function pickBestCluster(
  clusters: Coordinates[][],
  width: number,
  height: number,
  scoreCluster: (cluster: Coordinates[]) => number,
  lastLocation: Coordinates | null | undefined,
): Coordinates[] | null {
  const eligible = clusters.filter((cluster) => {
    const center = clusterCentroid(cluster)
    return !isInMinimapChrome(center, width, height)
  })

  if (eligible.length === 0) return null

  const scored = eligible
    .map((cluster) => ({
      cluster,
      center: clusterCentroid(cluster),
      score: scoreCluster(cluster),
    }))
    .filter((entry) => entry.score > -Infinity)

  if (scored.length === 0) return null

  if (lastLocation) {
    const maxJump = Math.max(width, height) * MAX_TRACK_JUMP_FRACTION
    const nearLast = scored
      .filter(
        (entry) =>
          Math.hypot(
            entry.center.x - lastLocation.x,
            entry.center.y - lastLocation.y,
          ) <= maxJump,
      )
      .sort((a, b) => {
        const distA = Math.hypot(
          a.center.x - lastLocation.x,
          a.center.y - lastLocation.y,
        )
        const distB = Math.hypot(
          b.center.x - lastLocation.x,
          b.center.y - lastLocation.y,
        )
        if (Math.abs(distA - distB) > 5) return distA - distB
        return b.score - a.score
      })

    if (nearLast.length > 0) return nearLast[0].cluster
  }

  return scored.reduce((best, entry) =>
    entry.score > best.score ? entry : best,
  ).cluster
}

export function stabilizeUserDetection(
  detected: User,
  last: User,
  cropWidth: number,
  cropHeight: number,
): User {
  if (!detected.isUserFound) return detected
  if (!last.isUserFound) return detected

  const jump = Math.hypot(
    detected.location.x - last.location.x,
    detected.location.y - last.location.y,
  )
  const maxJump =
    Math.max(cropWidth, cropHeight) * MAX_STABLE_JUMP_FRACTION

  if (jump > maxJump) return last
  return detected
}

function detectFromMask(
  imageData: ImageData,
  mask: boolean[],
  minClusterSize: number,
  maxClusterSize: number,
  scoreCluster: (cluster: Coordinates[]) => number,
  lastLocation: Coordinates | null | undefined,
): User {
  const { width, height } = imageData
  const clusters = findClusters(
    width,
    height,
    mask,
    minClusterSize,
    maxClusterSize,
  )

  if (clusters.length === 0) return USER_NOT_FOUND

  const bestCluster = pickBestCluster(
    clusters,
    width,
    height,
    scoreCluster,
    lastLocation,
  )
  if (!bestCluster) return USER_NOT_FOUND

  if (scoreCluster(bestCluster) === -Infinity) return USER_NOT_FOUND

  const center = clusterCentroid(bestCluster)

  return {
    isUserFound: true,
    location: center,
    radius: clusterRadius(bestCluster, center),
  }
}

export function detectUser(
  imageData: ImageData,
  options: DetectUserOptions = {},
): User {
  const { width, height, data } = imageData
  const lastLocation = options.lastLocation

  const isBlue = new Array(width * height).fill(false)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4
      isBlue[y * width + x] = isPlayerBlue(
        data[offset],
        data[offset + 1],
        data[offset + 2],
      )
    }
  }

  const blueUser = detectFromMask(
    imageData,
    isBlue,
    MIN_BLUE_CLUSTER_SIZE,
    MAX_BLUE_CLUSTER_SIZE,
    (cluster) => clusterBlueScore(cluster, width, data),
    lastLocation,
  )
  if (blueUser.isUserFound) return blueUser

  const isYellow = new Array(width * height).fill(false)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4
      isYellow[y * width + x] = isMarkerYellow(
        data[offset],
        data[offset + 1],
        data[offset + 2],
      )
    }
  }

  const clusters = findClusters(width, height, isYellow)
  if (clusters.length === 0) return USER_NOT_FOUND

  const bestCluster = pickBestCluster(
    clusters,
    width,
    height,
    (cluster) => clusterScore(cluster, width, data),
    lastLocation,
  )
  if (!bestCluster) return USER_NOT_FOUND

  if (clusterScore(bestCluster, width, data) === -Infinity) return USER_NOT_FOUND

  const center = clusterCentroid(bestCluster)

  return {
    isUserFound: true,
    location: {
      x: center.x,
      y: center.y,
    },
    radius: clusterRadius(bestCluster, center),
  }
}

const USER_COORD_EQUAL_EPSILON = 0.05

export function usersEqual(a: User, b: User): boolean {
  return (
    a.isUserFound === b.isUserFound &&
    Math.abs(a.location.x - b.location.x) < USER_COORD_EQUAL_EPSILON &&
    Math.abs(a.location.y - b.location.y) < USER_COORD_EQUAL_EPSILON &&
    Math.abs((a.radius ?? 0) - (b.radius ?? 0)) < USER_COORD_EQUAL_EPSILON
  )
}
