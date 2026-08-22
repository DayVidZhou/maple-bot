import {
  formatActivityLogTime,
  type ActivityLogEntry,
} from '../types/activityLog'

const EXPORT_COLUMNS = [
  'Time',
  'Category',
  'Event',
  'Key',
  'User (live)',
  'Target POI',
  'Details',
] as const

function escapeTsvCell(value: string): string {
  if (/[\t\r\n"]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function formatActivityLogRow(entry: ActivityLogEntry): string {
  return [
    formatActivityLogTime(entry.timestamp),
    entry.category,
    entry.event,
    entry.key ?? '',
    entry.userCoord ?? '',
    entry.pointCoord ?? '',
    entry.detail ?? '',
  ]
    .map(escapeTsvCell)
    .join('\t')
}

/** Tab-separated export — chronological order, oldest first. */
export function formatActivityLogExport(entries: ActivityLogEntry[]): string {
  const lines = [EXPORT_COLUMNS.join('\t'), ...entries.map(formatActivityLogRow)]
  return lines.join('\n')
}

export async function copyTextToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return
    } catch {
      // fall through to legacy copy
    }
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', 'true')
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()
  const copied = document.execCommand('copy')
  document.body.removeChild(textarea)

  if (!copied) {
    throw new Error('Clipboard copy is not available')
  }
}

export async function copyActivityLogToClipboard(
  entries: ActivityLogEntry[],
): Promise<void> {
  if (entries.length === 0) {
    throw new Error('No activity log entries to copy')
  }
  await copyTextToClipboard(formatActivityLogExport(entries))
}
