import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { GripVertical } from 'lucide-react';

interface SortableItemProps {
  id: string;
  children: ReactNode;
  className?: string;
}

export function SortableItem({ id, children, className }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative",
        isDragging && "opacity-50 z-50 shadow-2xl",
        className
      )}
      {...attributes}
    >
      {/* Drag Handle - positioned in top-right corner */}
      <button
        className={cn(
          "absolute top-2 right-2 z-10 p-1 rounded-md transition-all duration-200",
          "text-[#9CA3AF] hover:text-[#6B7280] hover:bg-black/5",
          isDragging ? "cursor-grabbing" : "cursor-grab"
        )}
        {...listeners}
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-5 h-5" />
      </button>
      
      {children}
    </div>
  );
}
