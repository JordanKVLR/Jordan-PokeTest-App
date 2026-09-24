/**
 * The arithmetic behind dragging a party card into a new slot, kept apart from the gesture code
 * so it can be tested on its own.
 */

/** A copy of `list` with the item at `from` taken out and put back in at `to`. */
export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  const next = [...list];
  if (from < 0 || from >= next.length) return next;
  const target = Math.max(0, Math.min(next.length - 1, to));
  const [item] = next.splice(from, 1);
  next.splice(target, 0, item);
  return next;
}

/** Where one card sits in the list: its top edge and height, from layout. */
export interface Slot {
  y: number;
  height: number;
}

/**
 * Which slot a dragged card would drop into. The card has been moved `dy` from its resting
 * place; it takes over the slot whose middle its own middle has passed.
 */
export function dropIndex(slots: readonly Slot[], from: number, dy: number): number {
  const dragged = slots[from];
  if (!dragged) return from;
  const middle = dragged.y + dy + dragged.height / 2;
  let target = from;
  for (let i = 0; i < slots.length; i++) {
    const slotMiddle = slots[i].y + slots[i].height / 2;
    if (i < from && middle < slotMiddle) return i;
    if (i > from && middle > slotMiddle) target = i;
  }
  return target;
}

/**
 * How far a card that is not being dragged moves aside to open a gap at `to`: up by the dragged
 * card's height when the card passes it going down, down by it when the card passes it going up.
 */
export function shiftFor(index: number, from: number, to: number, draggedHeight: number): number {
  if (from < to && index > from && index <= to) return -draggedHeight;
  if (from > to && index >= to && index < from) return draggedHeight;
  return 0;
}
