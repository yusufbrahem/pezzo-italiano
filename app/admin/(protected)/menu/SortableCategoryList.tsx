"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { MenuItem } from "@/data/menu";
import DeleteButton from "./DeleteButton";
import { reorderMenuItems } from "./actions";

// `items` seeds local state once on mount for optimistic drag reordering.
// The caller must pass a `key` derived from the category's item-id set (not
// order) so this remounts — and re-seeds — whenever an item is added or
// removed elsewhere, without remounting on every successful reorder (which
// would just replace the already-correct optimistic state with itself).
export default function SortableCategoryList({ category, items }: { category: string; items: MenuItem[] }) {
  const [ordered, setOrdered] = useState(items);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = ordered.findIndex((i) => i.id === active.id);
    const newIndex = ordered.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const next = arrayMove(ordered, oldIndex, newIndex);
    setOrdered(next); // optimistic — reflects instantly, no wait on the network
    startTransition(() => reorderMenuItems(category, next.map((i) => i.id)));
  };

  return (
    <DndContext
      id={`sortable-${category}`}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={ordered.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="bg-white rounded-xl border border-brand-green/10 divide-y divide-brand-green/8">
          {ordered.map((item) => (
            <SortableRow key={item.id} item={item} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({ item }: { item: MenuItem }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-3 px-4 py-3 bg-white ${isDragging ? "relative z-10 shadow-lg" : ""}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Réorganiser (glisser-déposer)"
        className="text-brand-charcoal/25 hover:text-brand-green cursor-grab active:cursor-grabbing touch-none flex-shrink-0 p-1 -ml-1"
      >
        <GripVertical size={16} />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-brand-charcoal text-sm">{item.name}</span>
          {item.isComingSoon && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand-charcoal/10 text-brand-charcoal/50 font-semibold uppercase">
              Bientôt
            </span>
          )}
          {item.isNew && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand-gold/20 text-brand-gold font-semibold uppercase">
              Nouveau
            </span>
          )}
        </div>
        <p className="text-xs text-brand-charcoal/45 truncate max-w-md">{item.description}</p>
      </div>
      <span className="text-sm font-semibold text-brand-charcoal/70 flex-shrink-0 whitespace-nowrap">
        {typeof item.price === "number" ? `${item.price} DT` : item.price}
      </span>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Link
          href={`/admin/menu/${item.id}/edit`}
          className="text-xs font-semibold text-brand-green hover:text-brand-gold px-2 py-1"
        >
          Modifier
        </Link>
        <DeleteButton id={item.id} name={item.name} />
      </div>
    </div>
  );
}
