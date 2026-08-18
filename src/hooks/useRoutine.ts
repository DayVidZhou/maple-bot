import { useCallback, useState } from 'react'
import type { Coordinates } from '../types/coordinates'
import type { RoutineListItem } from '../types/registry'
import {
  createId,
  defaultPointName,
  normalizeRoutineListItem,
  type Move,
  type MoveDefaults,
  type Routine,
  type RoutinePoint,
} from '../types/routine'
import type { HotkeyMoveOption } from '../utils/hotkeyMoveOptions'

function createEmptyRoutine(): Routine {
  return {
    id: createId(),
    name: 'Untitled Routine',
    hotkeyProfileId: null,
    points: [],
  }
}

export function useRoutine() {
  const [routine, setRoutine] = useState<Routine>(createEmptyRoutine)
  const [selectedPointId, setSelectedPointIdState] = useState<string | null>(
    null,
  )
  const [selectedMoveId, setSelectedMoveId] = useState<string | null>(null)

  const selectedPoint =
    routine.points.find((point) => point.id === selectedPointId) ?? null
  const selectedMove =
    selectedPoint?.moves.find((move) => move.id === selectedMoveId) ?? null

  const setSelectedPointId = useCallback((pointId: string | null) => {
    setSelectedPointIdState(pointId)
    setSelectedMoveId(null)
  }, [])

  const addPoint = useCallback((coord: Coordinates) => {
    let newPointId: string | undefined

    setRoutine((current) => {
      const point: RoutinePoint = {
        id: createId(),
        x: coord.x,
        y: coord.y,
        name: defaultPointName(current.points.length),
        moves: [],
      }
      newPointId = point.id

      return {
        ...current,
        points: [...current.points, point],
      }
    })

    if (newPointId) {
      setSelectedPointIdState(newPointId)
      setSelectedMoveId(null)
    }
  }, [])

  const deleteSelectedPoint = useCallback(() => {
    setRoutine((current) => {
      if (!selectedPointId) return current

      return {
        ...current,
        points: current.points.filter((point) => point.id !== selectedPointId),
      }
    })
    setSelectedPointIdState(null)
    setSelectedMoveId(null)
  }, [selectedPointId])

  const addMove = useCallback(
    (option: HotkeyMoveOption, defaults: MoveDefaults) => {
      if (!selectedPointId) return

      let newMoveId: string | undefined

      setRoutine((current) => ({
        ...current,
        points: current.points.map((point) => {
          if (point.id !== selectedPointId) return point

          const move: Move = {
            id: createId(),
            name: option.action.name,
            hotkeyId: option.hotkeyId,
            hotkeyActionId: option.action.id,
            category: option.category,
            holdDurationSeconds: defaults.holdDurationSeconds,
            direction: defaults.direction,
          }
          newMoveId = move.id

          return {
            ...point,
            moves: [...point.moves, move],
          }
        }),
      }))

      if (newMoveId) setSelectedMoveId(newMoveId)
    },
    [selectedPointId],
  )

  const deleteSelectedMove = useCallback(() => {
    if (!selectedPointId || !selectedMoveId) return

    setRoutine((current) => ({
      ...current,
      points: current.points.map((point) =>
        point.id === selectedPointId
          ? {
              ...point,
              moves: point.moves.filter((move) => move.id !== selectedMoveId),
            }
          : point,
      ),
    }))
    setSelectedMoveId(null)
  }, [selectedMoveId, selectedPointId])

  const resetRoutine = useCallback(() => {
    setRoutine(createEmptyRoutine())
    setSelectedPointIdState(null)
    setSelectedMoveId(null)
  }, [])

  const startNewRoutine = useCallback((name: string) => {
    const trimmed = name.trim() || 'Untitled Routine'
    setRoutine({
      ...createEmptyRoutine(),
      name: trimmed,
    })
    setSelectedPointIdState(null)
    setSelectedMoveId(null)
  }, [])

  const loadRoutine = useCallback(
    (item: RoutineListItem & { moves?: Move[] }) => {
      const normalized = normalizeRoutineListItem(item)
      setRoutine({
        id: normalized.id,
        name: normalized.name,
        hotkeyProfileId: normalized.hotkeyProfileId,
        points: normalized.points,
      })
      setSelectedPointIdState(null)
      setSelectedMoveId(null)
    },
    [],
  )

  const setRoutineName = useCallback((name: string) => {
    setRoutine((current) => ({
      ...current,
      name: name.trim() || current.name,
    }))
  }, [])

  const setSelectedPointName = useCallback(
    (name: string) => {
      setRoutine((current) => {
        if (!selectedPointId) return current

        return {
          ...current,
          points: current.points.map((point) =>
            point.id === selectedPointId
              ? { ...point, name: name.trim() || point.name }
              : point,
          ),
        }
      })
    },
    [selectedPointId],
  )

  const setHotkeyProfileId = useCallback((hotkeyProfileId: string | null) => {
    setRoutine((current) => ({
      ...current,
      hotkeyProfileId,
    }))
    setSelectedMoveId(null)
  }, [])

  const updatePointPosition = useCallback(
    (pointId: string, coord: Coordinates) => {
      setRoutine((current) => ({
        ...current,
        points: current.points.map((point) =>
          point.id === pointId
            ? {
                ...point,
                x: Math.min(1, Math.max(0, coord.x)),
                y: Math.min(1, Math.max(0, coord.y)),
              }
            : point,
        ),
      }))
    },
    [],
  )

  const updateSelectedMove = useCallback(
    (patch: Partial<Omit<Move, 'id'>>) => {
      if (!selectedPointId || !selectedMoveId) return

      setRoutine((current) => ({
        ...current,
        points: current.points.map((point) =>
          point.id === selectedPointId
            ? {
                ...point,
                moves: point.moves.map((move) =>
                  move.id === selectedMoveId ? { ...move, ...patch } : move,
                ),
              }
            : point,
        ),
      }))
    },
    [selectedMoveId, selectedPointId],
  )

  return {
    routine,
    selectedPointId,
    selectedMoveId,
    selectedPoint,
    selectedMove,
    setSelectedPointId,
    setSelectedMoveId,
    addPoint,
    deleteSelectedPoint,
    addMove,
    deleteSelectedMove,
    resetRoutine,
    startNewRoutine,
    loadRoutine,
    setRoutineName,
    setSelectedPointName,
    setHotkeyProfileId,
    updatePointPosition,
    updateSelectedMove,
  }
}

export function toRegistryRoutine(routine: Routine) {
  return {
    name: routine.name,
    hotkeyProfileId: routine.hotkeyProfileId,
    points: routine.points,
  }
}
