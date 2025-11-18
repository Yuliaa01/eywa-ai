import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { GripHorizontal } from 'lucide-react';

interface SortableItemProps {
  id: string;
  children: ReactNode;
  className?: string;
  showHandle?: boolean;
}

export function SortableItem({ id, children, className, showHandle = true }: SortableItemProps) {
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
      {/* Drag Handle - positioned at bottom center */}
      {showHandle && (
        <button
          className={cn(
            "absolute bottom-2 left-1/2 -translate-x-1/2 z-10 p-1 rounded-md transition-all duration-200",
            "text-[#D1D5DB] hover:text-[#9CA3AF] hover:bg-black/5",
            isDragging ? "cursor-grabbing" : "cursor-grab"
          )}
          {...listeners}
          aria-label="Drag to reorder"
        >
          <GripHorizontal className="w-5 h-5" />
        </button>
      )}
      
      {children}
    </div>
  );
}
