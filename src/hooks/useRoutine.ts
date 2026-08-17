import { useCallback, useState } from 'react'
import type { Coordinates } from '../types/coordinates'
import {
  createId,
  defaultPointName,
  DEFAULT_MOVE_HOLD_SECONDS,
  normalizeMove,
  type Move,
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
    moves: [],
  }
}

export function useRoutine() {
  const [routine, setRoutine] = useState<Routine>(createEmptyRoutine)
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null)
  const [selectedMoveId, setSelectedMoveId] = useState<string | null>(null)

  const selectedPoint =
    routine.points.find((point) => point.id === selectedPointId) ?? null
  const selectedMove =
    routine.moves.find((move) => move.id === selectedMoveId) ?? null

  const addPoint = useCallback((coord: Coordinates) => {
    let newPointId: string | undefined

    setRoutine((current) => {
      const point: RoutinePoint = {
        id: createId(),
        x: coord.x,
        y: coord.y,
        name: defaultPointName(current.points.length),
        moveIds: [],
      }
      newPointId = point.id

      return {
        ...current,
        points: [...current.points, point],
      }
    })

    if (newPointId) setSelectedPointId(newPointId)
  }, [])

  const deleteSelectedPoint = useCallback(() => {
    setRoutine((current) => {
      if (!selectedPointId) return current

      return {
        ...current,
        points: current.points.filter((point) => point.id !== selectedPointId),
      }
    })
    setSelectedPointId(null)
  }, [selectedPointId])

  const addMove = useCallback((option: HotkeyMoveOption) => {
    let newMoveId: string | undefined

    setRoutine((current) => {
      const move: Move = {
        id: createId(),
        name: option.action.name,
        hotkeyId: option.hotkeyId,
        hotkeyActionId: option.action.id,
        category: option.category,
        holdDurationSeconds: DEFAULT_MOVE_HOLD_SECONDS,
        direction: 'right',
      }
      newMoveId = move.id

      return {
        ...current,
        moves: [...current.moves, move],
      }
    })

    if (newMoveId) setSelectedMoveId(newMoveId)
  }, [])

  const deleteSelectedMove = useCallback(() => {
    setRoutine((current) => {
      if (!selectedMoveId) return current

      return {
        ...current,
        moves: current.moves.filter((move) => move.id !== selectedMoveId),
        points: current.points.map((point) => ({
          ...point,
          moveIds: point.moveIds.filter((moveId) => moveId !== selectedMoveId),
        })),
      }
    })
    setSelectedMoveId(null)
  }, [selectedMoveId])

  const togglePointMove = useCallback((pointId: string, moveId: string) => {
    setRoutine((current) => ({
      ...current,
      points: current.points.map((point) => {
        if (point.id !== pointId) return point

        const hasMove = point.moveIds.includes(moveId)
        return {
          ...point,
          moveIds: hasMove
            ? point.moveIds.filter((id) => id !== moveId)
            : [...point.moveIds, moveId],
        }
      }),
    }))
  }, [])

  const resetRoutine = useCallback(() => {
    setRoutine(createEmptyRoutine())
    setSelectedPointId(null)
    setSelectedMoveId(null)
  }, [])

  const startNewRoutine = useCallback((name: string) => {
    const trimmed = name.trim() || 'Untitled Routine'
    setRoutine({
      ...createEmptyRoutine(),
      name: trimmed,
    })
    setSelectedPointId(null)
    setSelectedMoveId(null)
  }, [])

  const loadRoutine = useCallback(
    (item: {
      id: string
      name: string
      hotkeyProfileId?: string | null
      points: RoutinePoint[]
      moves: Move[]
    }) => {
      setRoutine({
        id: item.id,
        name: item.name,
        hotkeyProfileId: item.hotkeyProfileId ?? null,
        points: item.points.map((point, index) => ({
          ...point,
          name: point.name ?? defaultPointName(index),
        })),
        moves: item.moves.map(normalizeMove),
      })
      setSelectedPointId(null)
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
      setRoutine((current) => {
        if (!selectedMoveId) return current

        return {
          ...current,
          moves: current.moves.map((move) =>
            move.id === selectedMoveId ? { ...move, ...patch } : move,
          ),
        }
      })
    },
    [selectedMoveId],
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
    togglePointMove,
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
    moves: routine.moves,
  }
}
