import React from 'react';
import { GripVertical } from 'lucide-react';
import { AboutBlockKey } from '@/types/profile';
import { Step2Model } from './useStep2Model';

/** Grip that drags a whole About block (only the grip starts a drag, so typing inside the block still works) */
export const BlockHandle: React.FC<{ m: Step2Model; block: AboutBlockKey }> = ({ m, block }) => (
  <span
    {...m.aboutBlockHandleProps(block)}
    className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-[#2563EB] -ml-1"
    title="Drag to move this block"
  >
    <GripVertical className="w-4 h-4" />
  </span>
);
