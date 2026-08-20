export function imageDataToGrayscale(imageData: ImageData): Float32Array {
  const { width, height, data } = imageData
  const gray = new Float32Array(width * height)

  for (let i = 0; i < width * height; i += 1) {
    const offset = i * 4
    gray[i] =
      0.299 * data[offset] + 0.587 * data[offset + 1] + 0.114 * data[offset + 2]
  }

  return gray
}

export function cropImageData(
  imageData: ImageData,
  rect: { x: number; y: number; width: number; height: number },
): ImageData {
  const x = Math.max(0, Math.floor(rect.x))
  const y = Math.max(0, Math.floor(rect.y))
  const width = Math.min(Math.floor(rect.width), imageData.width - x)
  const height = Math.min(Math.floor(rect.height), imageData.height - y)

  if (width <= 0 || height <= 0) {
    return new ImageData(1, 1)
  }

  const cropped = new ImageData(width, height)
  for (let row = 0; row < height; row += 1) {
    for (let col = 0; col < width; col += 1) {
      const sourceIndex = ((y + row) * imageData.width + (x + col)) * 4
      const targetIndex = (row * width + col) * 4
      cropped.data[targetIndex] = imageData.data[sourceIndex]
      cropped.data[targetIndex + 1] = imageData.data[sourceIndex + 1]
      cropped.data[targetIndex + 2] = imageData.data[sourceIndex + 2]
      cropped.data[targetIndex + 3] = imageData.data[sourceIndex + 3]
    }
  }

  return cropped
}

export interface NormalizedRect {
  x: number
  y: number
  width: number
  height: number
}

export function cropNormalizedRect(
  imageData: ImageData,
  rect: NormalizedRect,
): ImageData {
  return cropImageData(imageData, {
    x: rect.x * imageData.width,
    y: rect.y * imageData.height,
    width: rect.width * imageData.width,
    height: rect.height * imageData.height,
  })
}

export function downscaleImageData(
  imageData: ImageData,
  maxWidth: number,
): ImageData {
  if (imageData.width <= maxWidth) {
    return imageData
  }

  const scale = maxWidth / imageData.width
  const width = Math.max(1, Math.floor(imageData.width * scale))
  const height = Math.max(1, Math.floor(imageData.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return imageData
  }

  const sourceCanvas = document.createElement('canvas')
  sourceCanvas.width = imageData.width
  sourceCanvas.height = imageData.height
  const sourceCtx = sourceCanvas.getContext('2d')
  if (!sourceCtx) {
    return imageData
  }

  sourceCtx.putImageData(imageData, 0, 0)
  ctx.drawImage(sourceCanvas, 0, 0, width, height)
  return ctx.getImageData(0, 0, width, height)
}

export async function loadImageDataFromUrl(url: string): Promise<ImageData | null> {
  return new Promise((resolve) => {
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(null)
        return
      }

      ctx.drawImage(image, 0, 0)
      resolve(ctx.getImageData(0, 0, canvas.width, canvas.height))
    }
    image.onerror = () => resolve(null)
    image.src = url
  })
}
