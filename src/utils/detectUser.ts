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
const MIN_CLUSTER_SIZE = 6
const MAX_YELLOW_CLUSTER_SIZE = 96
const IDEAL_CLUSTER_SIZE = 22
/** Player plus icon fits in a small box — platform outlines are larger/thinner. */
const MAX_PLAYER_MARKER_BOX = 22
const MIN_PLAYER_MARKER_DENSITY = 0.22
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
  // Bright yellow plus — stricter than platform tan/yellow.
  if (r < 210 || g < 210) return false
  if (b < 55 || b > 125) return false
  if (Math.abs(r - g) > 20) return false
  if (g > r + 8) return false

  return true
}

function isMarkerCore(r: number, g: number, b: number): boolean {
  return r >= 240 && g >= 240 && b >= 60 && b <= 120 && Math.abs(r - g) <= 15
}

function isPlayerBlue(r: number, g: number, b: number): boolean {
  if (isDarkBackground(r, g, b) || isBrownGround(r, g, b)) return false
  // Other players / map icons — compact filled blue circle only.
  return (
    b >= 170 &&
    r <= 95 &&
    g <= 165 &&
    b > r + 55 &&
    b > g + 18 &&
    r + g > 80
  )
}

function playerMarkerShapePenalty(cluster: Coordinates[]): number {
  const { minX, maxX, minY, maxY } = clusterBounds(cluster)
  const boxWidth = maxX - minX + 1
  const boxHeight = maxY - minY + 1
  const maxDim = Math.max(boxWidth, boxHeight)

  if (maxDim > MAX_PLAYER_MARKER_BOX) return Infinity

  const density = cluster.length / (boxWidth * boxHeight)
  if (density < MIN_PLAYER_MARKER_DENSITY) return Infinity

  const aspectRatio = boxWidth / boxHeight
  if (aspectRatio < 0.45 || aspectRatio > 2.2) return Infinity

  return Math.abs(maxDim - 12) * 2 + Math.abs(density - 0.45) * 20
}

function findClusters(
  width: number,
  height: number,
  mask: boolean[],
  minSize = MIN_CLUSTER_SIZE,
  maxSize = MAX_YELLOW_CLUSTER_SIZE,
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
  const shapePenalty = playerMarkerShapePenalty(cluster)
  if (!Number.isFinite(shapePenalty)) return -Infinity

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

  if (corePixels < 2) return -Infinity

  const averageColorScore = colorScore / cluster.length
  const templateScore = templateMatchScore(clusterToTemplateGrid(cluster)) * 120
  const sizePenalty = Math.abs(cluster.length - IDEAL_CLUSTER_SIZE) * 1.2
  const coreBonus = corePixels * 4

  return (
    averageColorScore +
    templateScore +
    coreBonus -
    sizePenalty -
    shapePenalty
  )
}

function clusterBlueScore(
  cluster: Coordinates[],
  width: number,
  data: Uint8ClampedArray,
): number {
  const shapePenalty = playerMarkerShapePenalty(cluster)
  if (!Number.isFinite(shapePenalty)) return -Infinity

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

  if (bluePixels < 6) return -Infinity

  const fillRatio = bluePixels / cluster.length
  if (fillRatio < 0.62) return -Infinity

  const sizePenalty = Math.abs(cluster.length - IDEAL_BLUE_CLUSTER_SIZE) * 1.1
  return blueScore / cluster.length + fillRatio * 45 - sizePenalty - shapePenalty
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
    const bestGlobal = scored.reduce((best, entry) =>
      entry.score > best.score ? entry : best,
    )

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

    if (nearLast.length > 0) {
      const bestNear = nearLast[0]
      // Recover from a bad lock when another marker scores much better.
      if (bestGlobal.score > bestNear.score + 20) {
        return bestGlobal.cluster
      }
      return bestNear.cluster
    }
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
): { user: User; score: number } {
  const { width, height } = imageData
  const clusters = findClusters(
    width,
    height,
    mask,
    minClusterSize,
    maxClusterSize,
  )

  if (clusters.length === 0) {
    return { user: USER_NOT_FOUND, score: -Infinity }
  }

  const bestCluster = pickBestCluster(
    clusters,
    width,
    height,
    scoreCluster,
    lastLocation,
  )
  if (!bestCluster) {
    return { user: USER_NOT_FOUND, score: -Infinity }
  }

  const score = scoreCluster(bestCluster)
  if (score === -Infinity) {
    return { user: USER_NOT_FOUND, score: -Infinity }
  }

  const center = clusterCentroid(bestCluster)

  return {
    user: {
      isUserFound: true,
      location: center,
      radius: clusterRadius(bestCluster, center),
    },
    score,
  }
}

export function detectUser(
  imageData: ImageData,
  options: DetectUserOptions = {},
): User {
  const { width, height, data } = imageData
  const lastLocation = options.lastLocation

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

  const yellowResult = detectFromMask(
    imageData,
    isYellow,
    MIN_CLUSTER_SIZE,
    MAX_YELLOW_CLUSTER_SIZE,
    (cluster) => clusterScore(cluster, width, data),
    lastLocation,
  )

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

  const blueResult = detectFromMask(
    imageData,
    isBlue,
    MIN_BLUE_CLUSTER_SIZE,
    MAX_BLUE_CLUSTER_SIZE,
    (cluster) => clusterBlueScore(cluster, width, data),
    lastLocation,
  )

  if (yellowResult.user.isUserFound && blueResult.user.isUserFound) {
    // MSW self marker is usually the bright yellow plus; blue dots are often other players.
    return yellowResult.score >= blueResult.score * 0.85
      ? yellowResult.user
      : blueResult.user
  }

  if (yellowResult.user.isUserFound) return yellowResult.user
  if (blueResult.user.isUserFound) return blueResult.user

  return USER_NOT_FOUND
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
