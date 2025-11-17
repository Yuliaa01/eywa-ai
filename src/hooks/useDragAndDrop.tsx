import { useState, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, horizontalListSortingStrategy } from '@dnd-kit/sortable';

interface UseDragAndDropProps<T> {
  items: T[];
  storageKey: string;
  idExtractor: (item: T) => string | number;
  direction?: 'vertical' | 'horizontal';
}

export function useDragAndDrop<T>({ items, storageKey, idExtractor, direction = 'vertical' }: UseDragAndDropProps<T>) {
  const [orderedItems, setOrderedItems] = useState<T[]>(items);

  // Load saved order from localStorage
  useEffect(() => {
    const savedOrder = localStorage.getItem(storageKey);
    if (savedOrder) {
      try {
        const orderIds = JSON.parse(savedOrder);
        const orderedMap = new Map(items.map(item => [String(idExtractor(item)), item]));
        const reordered = orderIds
          .map((id: string) => orderedMap.get(String(id)))
          .filter(Boolean) as T[];
        
        // Add any new items that weren't in saved order
        const existingIds = new Set(orderIds);
        const newItems = items.filter(item => !existingIds.has(String(idExtractor(item))));
        
        setOrderedItems([...reordered, ...newItems]);
      } catch (e) {
        setOrderedItems(items);
      }
    } else {
      setOrderedItems(items);
    }
  }, [items, storageKey, idExtractor]);

  // Save order to localStorage
  const saveOrder = (newOrder: T[]) => {
    const orderIds = newOrder.map(item => String(idExtractor(item)));
    localStorage.setItem(storageKey, JSON.stringify(orderIds));
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setOrderedItems((items) => {
        const oldIndex = items.findIndex(item => String(idExtractor(item)) === active.id);
        const newIndex = items.findIndex(item => String(idExtractor(item)) === over.id);
        
        const newOrder = arrayMove(items, oldIndex, newIndex);
        saveOrder(newOrder);
        return newOrder;
      });
    }
  };

  const sortingStrategy = direction === 'horizontal' ? horizontalListSortingStrategy : verticalListSortingStrategy;

  return {
    orderedItems,
    sensors,
    handleDragEnd,
    sortingStrategy,
    itemIds: orderedItems.map(item => String(idExtractor(item))),
  };
}
