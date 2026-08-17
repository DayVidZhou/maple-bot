import { useCallback, useState } from 'react'
import {
  createId,
  type Move,
  type NormalizedCoord,
  type Routine,
  type RoutinePoint,
} from '../types/routine'
import type { HotkeyMoveOption } from '../utils/hotkeyMoveOptions'

function createEmptyRoutine(): Routine {
  return {
    id: createId(),
    name: 'Untitled Routine',
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

  const addPoint = useCallback((coord: NormalizedCoord) => {
    const point: RoutinePoint = {
      id: createId(),
      x: coord.x,
      y: coord.y,
      moveIds: [],
    }

    setRoutine((current) => ({
      ...current,
      points: [...current.points, point],
    }))
    setSelectedPointId(point.id)
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
      const alreadyAdded = current.moves.some(
        (move) =>
          move.hotkeyId === option.hotkeyId &&
          move.hotkeyActionId === option.action.id,
      )
      if (alreadyAdded) return current

      const move: Move = {
        id: createId(),
        name: option.action.name,
        hotkeyId: option.hotkeyId,
        hotkeyActionId: option.action.id,
        category: option.category,
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
      points: RoutinePoint[]
      moves: Move[]
    }) => {
      setRoutine({
        id: item.id,
        name: item.name,
        points: item.points,
        moves: item.moves,
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
  }
}

export function toRegistryRoutine(routine: Routine) {
  return {
    name: routine.name,
    points: routine.points,
    moves: routine.moves,
  }
}
