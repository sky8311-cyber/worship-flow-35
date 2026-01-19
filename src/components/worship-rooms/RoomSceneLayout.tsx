// Predefined slot positions for posts in the room scene

export interface SlotPosition {
  id: string;
  x: string;
  y: string;
  zone: 'wall' | 'middle' | 'floor';
  zIndex: number;
  rotation: number;
}

export const SLOT_POSITIONS: SlotPosition[] = [
  // Wall positions (for pinned/important posts)
  { id: 'wall-center', x: '50%', y: '22%', zone: 'wall', zIndex: 10, rotation: 0 },
  { id: 'wall-left', x: '22%', y: '28%', zone: 'wall', zIndex: 9, rotation: -3 },
  { id: 'wall-right', x: '78%', y: '26%', zone: 'wall', zIndex: 9, rotation: 2 },
  
  // Desk/table area (middle zone)
  { id: 'desk-1', x: '35%', y: '52%', zone: 'middle', zIndex: 20, rotation: -2 },
  { id: 'desk-2', x: '58%', y: '55%', zone: 'middle', zIndex: 21, rotation: 3 },
  { id: 'desk-3', x: '45%', y: '60%', zone: 'middle', zIndex: 22, rotation: -1 },
  
  // Floor area (front)
  { id: 'floor-left', x: '25%', y: '78%', zone: 'floor', zIndex: 30, rotation: 4 },
  { id: 'floor-center', x: '52%', y: '82%', zone: 'floor', zIndex: 31, rotation: -2 },
  { id: 'floor-right', x: '75%', y: '76%', zone: 'floor', zIndex: 30, rotation: 1 },
];

export function getSlotPosition(index: number, isPinned: boolean): SlotPosition {
  // Pinned posts always go to wall-center
  if (isPinned && index === 0) {
    return SLOT_POSITIONS[0];
  }
  
  // Others fill remaining slots sequentially
  const availableSlots = isPinned ? SLOT_POSITIONS.slice(1) : SLOT_POSITIONS;
  return availableSlots[index % availableSlots.length];
}

export function getScaleByZone(zone: 'wall' | 'middle' | 'floor'): number {
  switch (zone) {
    case 'wall': return 0.75;
    case 'middle': return 0.85;
    case 'floor': return 1.0;
  }
}
