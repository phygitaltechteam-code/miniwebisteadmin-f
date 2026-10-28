import React, { useState } from 'react';

/** Move the item at `from` to position `to`, returning a new array */
export const moveItem = <T,>(list: T[], from: number, to: number): T[] => {
  const next = [...list];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
};

/**
 * HTML5 drag & drop reordering for a list.
 * Spread `dragProps(index)` on each item and add `dragClass(index)` to its className;
 * `onReorder(from, to)` is called when an item is dropped on another position.
 */
export const useDragReorder = (onReorder: (from: number, to: number) => void) => {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const reset = () => {
    setDragIndex(null);
    setOverIndex(null);
  };

  const dragProps = (index: number) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      e.dataTransfer.effectAllowed = 'move';
      setDragIndex(index);
    },
    onDragOver: (e: React.DragEvent) => {
      if (dragIndex === null) return;
      e.preventDefault();
      if (overIndex !== index) setOverIndex(index);
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      const from = dragIndex;
      reset();
      if (from !== null && from !== index) onReorder(from, index);
    },
    onDragEnd: reset,
  });

  const dragClass = (index: number) =>
    dragIndex === index
      ? 'opacity-40'
      : dragIndex !== null && overIndex === index
        ? 'ring-2 ring-[#2196F3] ring-offset-1'
        : '';

  return { dragProps, dragClass, isDragging: dragIndex !== null };
};
