import { useEffect, useState } from 'react';

/**
 * Auto-advancing carousel index. With pauseOnHover it stops while the mouse is over it.
 * The timer restarts after every move, so a manual arrow/dot click gets a full interval before the next slide.
 */
export const useAutoSlide = (count: number, visible: number, intervalMs = 3500, pauseOnHover = true) => {
  const [start, setStart] = useState(0);
  const [paused, setPaused] = useState(false);
  const canSlide = count > visible;

  useEffect(() => {
    if (!canSlide || (pauseOnHover && paused)) return;
    const t = setTimeout(() => setStart((s) => (s + 1) % count), intervalMs);
    return () => clearTimeout(t);
  }, [start, canSlide, paused, pauseOnHover, count, intervalMs]);

  useEffect(() => {
    if (start >= count) setStart(0);
  }, [count, start]);

  // Items currently on screen, wrapping around the end
  const indices = Array.from({ length: Math.min(visible, count) }, (_, i) => (start + i) % Math.max(count, 1));

  return {
    indices,
    start,
    canSlide,
    next: () => setStart((s) => (s + 1) % count),
    prev: () => setStart((s) => (s - 1 + count) % count),
    goTo: (i: number) => setStart(i),
    hoverProps: { onMouseEnter: () => setPaused(true), onMouseLeave: () => setPaused(false) },
  };
};
