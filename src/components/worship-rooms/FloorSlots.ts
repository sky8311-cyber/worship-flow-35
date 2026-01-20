/**
 * Predefined floor slots for furniture placement.
 * Uses fixed pixel coordinates within the 800x500 canvas.
 * Z-index and scale create depth illusion (back = smaller, front = larger).
 */

export interface FloorSlot {
  id: string;
  x: number;      // X position (0-800)
  y: number;      // Y position (0-500)
  z: number;      // Z-index for layering
  scale: number;  // Size scale (0.6-1.0)
  layer: 'wall' | 'floor';
}

export const FLOOR_SLOTS: FloorSlot[] = [
  // Wall slots (for frames, clocks - attached to back wall)
  { id: 'wall-left', x: 180, y: 100, z: 5, scale: 0.8, layer: 'wall' },
  { id: 'wall-center', x: 400, y: 80, z: 5, scale: 0.9, layer: 'wall' },
  { id: 'wall-right', x: 620, y: 100, z: 5, scale: 0.8, layer: 'wall' },

  // Back row (near wall, smallest)
  { id: 'back-left', x: 140, y: 260, z: 10, scale: 0.65, layer: 'floor' },
  { id: 'back-center', x: 400, y: 250, z: 11, scale: 0.7, layer: 'floor' },
  { id: 'back-right', x: 660, y: 260, z: 10, scale: 0.65, layer: 'floor' },

  // Middle row
  { id: 'mid-left', x: 120, y: 340, z: 20, scale: 0.8, layer: 'floor' },
  { id: 'mid-center', x: 400, y: 350, z: 21, scale: 0.85, layer: 'floor' },
  { id: 'mid-right', x: 680, y: 340, z: 20, scale: 0.8, layer: 'floor' },

  // Front row (closest to viewer, largest)
  { id: 'front-left', x: 100, y: 430, z: 30, scale: 0.95, layer: 'floor' },
  { id: 'front-center', x: 400, y: 440, z: 31, scale: 1.0, layer: 'floor' },
  { id: 'front-right', x: 700, y: 430, z: 30, scale: 0.95, layer: 'floor' },
];

export const SLOT_MAP = FLOOR_SLOTS.reduce((acc, slot) => {
  acc[slot.id] = slot;
  return acc;
}, {} as Record<string, FloorSlot>);

/**
 * Get a slot by ID or return a default slot.
 */
export function getSlotById(slotId: string): FloorSlot {
  return SLOT_MAP[slotId] || SLOT_MAP['mid-center'];
}

/**
 * Get the appropriate slot for a furniture category.
 */
export function getDefaultSlotForCategory(category: string): FloorSlot {
  switch (category) {
    case 'bed':
      return SLOT_MAP['back-left'];
    case 'desk':
      return SLOT_MAP['back-center'];
    case 'bookshelf':
      return SLOT_MAP['back-right'];
    case 'chair':
      return SLOT_MAP['mid-right'];
    case 'plant':
      return SLOT_MAP['mid-left'];
    case 'rug':
      return SLOT_MAP['front-center'];
    case 'lamp':
      return SLOT_MAP['front-right'];
    case 'frame':
      return SLOT_MAP['wall-center'];
    case 'clock':
      return SLOT_MAP['wall-right'];
    case 'decoration':
    default:
      return SLOT_MAP['mid-center'];
  }
}

// Z-index layers for strict ordering
export const Z_LAYERS = {
  // Background
  BACK_WALL: 1,
  SIDE_WALL: 2,
  FLOOR: 3,

  // Wall decorations
  WALL_ITEMS: 5,

  // Floor furniture (back to front)
  FURNITURE_BACK: 10,
  FURNITURE_MID: 20,
  FURNITURE_FRONT: 30,

  // Characters
  AVATAR: 40,

  // Overlays
  TALK_BUBBLE: 50,
  STATUS_BUBBLE: 60,
  UI_OVERLAY: 70,
};

// Avatar fixed position
export const AVATAR_POSITION = { x: 400, y: 435, z: Z_LAYERS.AVATAR };

// Talk bubble anchor (above avatar head)
export const BUBBLE_ANCHOR = { x: 400, y: 330, z: Z_LAYERS.TALK_BUBBLE };
