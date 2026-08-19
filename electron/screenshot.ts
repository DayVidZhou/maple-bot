import { desktopCapturer } from 'electron'
import { discordError, discordLog } from './discordLog'

const DEFAULT_THUMBNAIL = { width: 1920, height: 1080 }

export async function captureDesktopScreenshot(
  thumbnailSize = DEFAULT_THUMBNAIL,
): Promise<Buffer> {
  discordLog('Capturing desktop screenshot', { thumbnailSize })

  const sources = await desktopCapturer.getSources({
    types: ['screen', 'window'],
    fetchWindowIcons: false,
    thumbnailSize,
  })

  discordLog('Desktop capture sources found', {
    count: sources.length,
    names: sources.slice(0, 8).map((source) => source.name),
  })

  if (sources.length === 0) {
    throw new Error('No desktop capture sources available')
  }

  const mapleStory = sources.find((source) =>
    source.name.toLowerCase().includes('maplestory'),
  )
  const source =
    mapleStory ??
    sources.find((source) => source.id.startsWith('screen:')) ??
    sources[0]

  discordLog('Using capture source', {
    id: source.id,
    name: source.name,
    pickedMapleStory: Boolean(mapleStory),
  })

  const png = source.thumbnail.toPNG()
  if (png.length === 0) {
    discordError('Capture source returned empty PNG', undefined, {
      sourceName: source.name,
    })
    throw new Error(`Capture source "${source.name}" returned an empty image`)
  }

  discordLog('Screenshot captured', {
    sourceName: source.name,
    bytes: png.length,
  })

  return png
}
