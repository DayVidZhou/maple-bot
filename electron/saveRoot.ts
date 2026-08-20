import { app } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
)

/** Writable directory for user saves — project root in dev, app userData when packaged. */
export function getSaveRoot(): string {
  if (app.isPackaged) {
    return app.getPath('userData')
  }
  return projectRoot
}
