import type { ActivityLogInput } from '../types/activityLog'
import type { HotkeyActionEntry } from '../types/hotkey'
import {
  buffStatusFromEntry,
  type BuffRuntimeState,
  type BuffStatusRow,
} from '../types/buffStatus'
import type { RoutineRunnerKeyboard } from './routineRunner'
import { RoutineRunAbortError } from './routineRunner'

const ROUTINE_POLL_INTERVAL_MS = 50

interface BuffRuntime {
  entry: HotkeyActionEntry
  state: BuffRuntimeState
  cooldownEndsAt: number | null
}

export interface BuffRunnerDeps {
  keyboard: RoutineRunnerKeyboard
  shouldAbort(): boolean
  onActivityLog?(entry: ActivityLogInput): void
  onStatus?(message: string): void
  onBuffStatusChange?(rows: BuffStatusRow[]): void
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function assertRunning(deps: BuffRunnerDeps): void {
  if (deps.shouldAbort()) {
    throw new RoutineRunAbortError()
  }
}

export class BuffRunner {
  private readonly runtimes: BuffRuntime[]

  private readonly queue: string[] = []

  private executing = false

  constructor(
    buffs: HotkeyActionEntry[],
    private readonly deps: BuffRunnerDeps,
  ) {
    this.runtimes = buffs.map((entry) => ({
      entry,
      state: entry.buttonKey?.trim() ? 'ready' : 'inactive',
      cooldownEndsAt: null,
    }))
    this.publishStatus()
  }

  get activeBuffCount(): number {
    return this.runtimes.filter((runtime) => runtime.state !== 'inactive').length
  }

  getSnapshot(now = Date.now()): BuffStatusRow[] {
    const queuePositions = new Map(
      this.queue.map((id, index) => [id, index + 1]),
    )

    return this.runtimes.map((runtime) => {
      const base = buffStatusFromEntry(runtime.entry, {
        state: runtime.state,
      })

      if (runtime.state === 'cooldown' && runtime.cooldownEndsAt != null) {
        const remainingMs = Math.max(0, runtime.cooldownEndsAt - now)
        return {
          ...base,
          cooldownRemainingSeconds: remainingMs / 1000,
        }
      }

      if (runtime.state === 'queued') {
        return {
          ...base,
          queuePosition: queuePositions.get(runtime.entry.id) ?? null,
        }
      }

      return base
    })
  }

  private publishStatus(now = Date.now()): void {
    this.deps.onBuffStatusChange?.(this.getSnapshot(now))
  }

  async runInitialSequence(): Promise<void> {
    const active = this.runtimes.filter((runtime) => runtime.state === 'ready')
    if (active.length === 0) return

    this.deps.onStatus?.('Applying buffs...')
    this.deps.onActivityLog?.({
      category: 'routine',
      event: 'Buff sequence',
      detail: `Applying ${active.length} buff${active.length === 1 ? '' : 's'}`,
    })

    for (const runtime of active) {
      assertRunning(this.deps)
      await this.executeBuff(runtime, 'initial')
    }
  }

  async tick(now = Date.now()): Promise<void> {
    this.enqueueExpiredCooldowns(now)

    if (this.executing || this.queue.length === 0) {
      this.publishStatus(now)
      return
    }

    const nextId = this.queue.shift()
    if (!nextId) {
      this.publishStatus(now)
      return
    }

    const runtime = this.runtimes.find((item) => item.entry.id === nextId)
    if (!runtime || runtime.state !== 'queued') {
      this.publishStatus(now)
      return
    }

    this.executing = true
    try {
      await this.executeBuff(runtime, 'queued')
    } finally {
      this.executing = false
      this.publishStatus()
    }
  }

  private enqueueExpiredCooldowns(now: number): void {
    for (const runtime of this.runtimes) {
      if (runtime.state !== 'cooldown' || runtime.cooldownEndsAt == null) {
        continue
      }

      if (now < runtime.cooldownEndsAt) continue

      runtime.state = 'queued'
      runtime.cooldownEndsAt = null
      if (!this.queue.includes(runtime.entry.id)) {
        this.queue.push(runtime.entry.id)
      }

      this.deps.onActivityLog?.({
        category: 'routine',
        event: 'Buff queued',
        key: runtime.entry.buttonKey,
        detail: `${runtime.entry.name} · cooldown finished`,
      })
    }
  }

  private async executeBuff(
    runtime: BuffRuntime,
    phase: 'initial' | 'queued',
  ): Promise<void> {
    const key = runtime.entry.buttonKey?.trim()
    if (!key) return

    assertRunning(this.deps)
    runtime.state = 'casting'
    this.publishStatus()

    const phaseLabel = phase === 'initial' ? 'Apply buff' : 'Use buff'
    this.deps.onStatus?.(`${phaseLabel}: ${runtime.entry.name}`)
    this.deps.onActivityLog?.({
      category: 'routine',
      event: phaseLabel,
      key,
      detail: `${runtime.entry.name} · cast ${runtime.entry.castTimeSeconds}s`,
    })

    await this.deps.keyboard.tapKey(key)

    const castMs = Math.max(0, runtime.entry.castTimeSeconds * 1000)
    if (castMs > 0) {
      const endTime = Date.now() + castMs
      while (Date.now() < endTime) {
        assertRunning(this.deps)
        this.publishStatus()
        const remaining = endTime - Date.now()
        if (remaining <= 0) break
        await sleep(Math.min(ROUTINE_POLL_INTERVAL_MS, remaining))
      }
    }

    const cooldownMs = Math.max(0, runtime.entry.cooldownSeconds * 1000)
    runtime.state = 'cooldown'
    runtime.cooldownEndsAt = Date.now() + cooldownMs
    this.publishStatus()

    this.deps.onActivityLog?.({
      category: 'routine',
      event: 'Buff cooldown',
      key,
      detail: `${runtime.entry.name} · ${runtime.entry.cooldownSeconds}s`,
    })
  }
}
