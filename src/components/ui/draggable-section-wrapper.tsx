import { ReactNode } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import { SortableItem } from './sortable-item';

interface Section {
  id: string;
  content: ReactNode;
}

interface DraggableSectionWrapperProps {
  sections: Section[];
  storageKey: string;
  className?: string;
}

export function DraggableSectionWrapper({ sections, storageKey, className }: DraggableSectionWrapperProps) {
  const dragAndDrop = useDragAndDrop({
    items: sections,
    storageKey,
    idExtractor: (item) => item.id,
  });

  return (
    <DndContext
      sensors={dragAndDrop.sensors}
      collisionDetection={closestCenter}
      onDragEnd={dragAndDrop.handleDragEnd}
    >
      <SortableContext
        items={dragAndDrop.itemIds}
        strategy={verticalListSortingStrategy}
      >
        <div className={className}>
          {dragAndDrop.orderedItems.map((section) => (
            <SortableItem key={section.id} id={section.id}>
              {section.content}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
