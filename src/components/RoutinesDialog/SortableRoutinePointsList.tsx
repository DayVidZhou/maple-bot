import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { RoutinePoint } from '../../types/routine'

interface SortableRoutinePointsListProps {
  points: RoutinePoint[]
  selectedPointId: string | null
  onSelectPoint: (pointId: string) => void
  onReorderPoints: (activeId: string, overId: string) => void
  formatPointLabel: (point: RoutinePoint) => string
}

interface SortablePointRowProps {
  point: RoutinePoint
  index: number
  selected: boolean
  onSelect: () => void
  formatPointLabel: (point: RoutinePoint) => string
}

function SortablePointRow({
  point,
  index,
  selected,
  onSelect,
  formatPointLabel,
}: SortablePointRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: point.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'routines-sortable-item-dragging' : undefined}
    >
      <div
        className={`routines-list-item routines-sortable-item ${
          selected ? 'selected' : ''
        }`}
      >
        <button
          type="button"
          className="routines-drag-handle"
          aria-label={`Drag to reorder ${point.name}`}
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
        >
          ⋮⋮
        </button>
        <button
          type="button"
          className="routines-sortable-item-button"
          onClick={onSelect}
        >
          <span className="routines-list-index">{index + 1}</span>
          <span className="routines-list-label">{point.name}</span>
          <span className="routines-list-meta">{formatPointLabel(point)}</span>
          <span className="routines-list-meta">
            {point.moves.length} move
            {point.moves.length === 1 ? '' : 's'}
          </span>
        </button>
      </div>
    </li>
  )
}

export function SortableRoutinePointsList({
  points,
  selectedPointId,
  onSelectPoint,
  onReorderPoints,
  formatPointLabel,
}: SortableRoutinePointsListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    onReorderPoints(String(active.id), String(over.id))
  }

  if (points.length === 0) {
    return <li className="routines-list-empty">No points yet</li>
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={points.map((point) => point.id)}
        strategy={verticalListSortingStrategy}
      >
        {points.map((point, index) => (
          <SortablePointRow
            key={point.id}
            point={point}
            index={index}
            selected={point.id === selectedPointId}
            onSelect={() => onSelectPoint(point.id)}
            formatPointLabel={formatPointLabel}
          />
        ))}
      </SortableContext>
    </DndContext>
  )
}
