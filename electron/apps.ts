import { desktopCapturer } from 'electron'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

export const MAPLESTORY_WORLDS_APP_NAME = 'MapleStory Worlds'

function escapeAppleScriptString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

function escapePowerShellSingleQuotedString(value: string): string {
  return value.replace(/'/g, "''")
}

async function runPowerShell(script: string): Promise<string> {
  const { stdout } = await execFileAsync('powershell.exe', [
    '-NoProfile',
    '-NonInteractive',
    '-Command',
    script,
  ])
  return stdout.trim()
}

const WIN32_FOCUS_SCRIPT = `
Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;
public class MapleBotWin32 {
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);
}
"@ | Out-Null
`.trim()

function buildFocusApplicationWindowsScript(name: string): string {
  const target = escapePowerShellSingleQuotedString(name)
  return `
${WIN32_FOCUS_SCRIPT}
$ErrorActionPreference = 'Stop'
$target = '${target}'
$targetCompact = ($target -replace '\\s', '').ToLower()
$proc = Get-Process | Where-Object {
  $_.MainWindowHandle -ne [IntPtr]::Zero -and (
    $_.MainWindowTitle -like "*$target*" -or
    $_.ProcessName.ToLower() -like "*$targetCompact*"
  )
} | Select-Object -First 1
if ($null -eq $proc) {
  throw "Application not found: $target"
}
[void][MapleBotWin32]::ShowWindowAsync($proc.MainWindowHandle, 9)
if (-not [MapleBotWin32]::SetForegroundWindow($proc.MainWindowHandle)) {
  throw "Failed to focus: $target"
}
`.trim()
}

function buildGetFrontmostWindowTitleScript(): string {
  return `
${WIN32_FOCUS_SCRIPT}
$hwnd = [MapleBotWin32]::GetForegroundWindow()
if ($hwnd -eq [IntPtr]::Zero) { return }
$sb = New-Object System.Text.StringBuilder 512
[void][MapleBotWin32]::GetWindowText($hwnd, $sb, 512)
Write-Output $sb.ToString()
`.trim()
}

function applicationNamesMatch(focused: string, expected: string): boolean {
  const focusedNormalized = focused.trim().toLowerCase()
  const expectedNormalized = expected.trim().toLowerCase()
  if (!focusedNormalized || !expectedNormalized) return false

  return (
    focusedNormalized === expectedNormalized ||
    focusedNormalized.includes(expectedNormalized) ||
    expectedNormalized.includes(focusedNormalized)
  )
}

export async function getOpenApplicationNames(): Promise<string[]> {
  if (process.platform === 'darwin') {
    const { stdout } = await execFileAsync('osascript', [
      '-e',
      'tell application "System Events" to get name of every application process whose visible is true',
    ])
    return stdout.trim().split(', ').filter(Boolean)
  }

  const sources = await desktopCapturer.getSources({
    types: ['window'],
    fetchWindowIcons: false,
  })
  return sources.map((source) => source.name).filter(Boolean)
}

export async function focusApplication(name: string): Promise<void> {
  if (process.platform === 'darwin') {
    const escapedName = escapeAppleScriptString(name)
    await execFileAsync('osascript', [
      '-e',
      `tell application "${escapedName}" to activate`,
    ])
    return
  }

  if (process.platform === 'win32') {
    await runPowerShell(buildFocusApplicationWindowsScript(name))
    return
  }

  throw new Error(
    `Focusing applications is not supported on ${process.platform}`,
  )
}

export async function getFrontmostApplicationName(): Promise<string | null> {
  if (process.platform === 'darwin') {
    const { stdout } = await execFileAsync('osascript', [
      '-e',
      'tell application "System Events" to get name of first application process whose frontmost is true',
    ])

    const name = stdout.trim()
    return name || null
  }

  if (process.platform === 'win32') {
    const name = await runPowerShell(buildGetFrontmostWindowTitleScript())
    return name || null
  }

  return null
}

export async function isApplicationFocused(name: string): Promise<boolean> {
  const frontmost = await getFrontmostApplicationName()
  if (!frontmost) return false

  if (process.platform === 'darwin') {
    return frontmost === name
  }

  return applicationNamesMatch(frontmost, name)
}
