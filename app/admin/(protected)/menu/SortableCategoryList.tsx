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
import { GripVertical, Pencil } from "lucide-react";
import type { MenuItem } from "@/data/menu";
import DeleteButton from "./DeleteButton";
import PublishToggle from "./PublishToggle";
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

  // Same optimistic pattern as drag reorder: `ordered` is seeded once (see
  // the key note above) and only updated locally, so a toggle needs to patch
  // it directly — otherwise the row would show the pre-toggle status until
  // something else happens to remount this list.
  const handleTogglePublished = (id: string, nextPublished: boolean) => {
    setOrdered((prev) => prev.map((i) => (i.id === id ? { ...i, isPublished: nextPublished } : i)));
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
            <SortableRow key={item.id} item={item} onTogglePublished={handleTogglePublished} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({
  item,
  onTogglePublished,
}: {
  item: MenuItem;
  onTogglePublished: (id: string, nextPublished: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  const published = item.isPublished !== false;
  const price = typeof item.price === "number" ? `${item.price} DT` : item.price;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-start sm:items-center gap-3 px-3 sm:px-4 py-3 bg-white ${isDragging ? "relative z-10 shadow-lg" : ""}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Réorganiser (glisser-déposer)"
        className="text-brand-charcoal/25 hover:text-brand-green cursor-grab active:cursor-grabbing touch-none flex-shrink-0 p-1 -ml-1 mt-2.5 sm:mt-0"
      >
        <GripVertical size={16} />
      </button>

      <div className={`w-11 h-11 rounded-lg bg-brand-cream overflow-hidden flex-shrink-0 ${!published ? "opacity-50" : ""}`}>
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- tiny admin thumbnail; next/image's optimizer adds nothing here
          <img src={item.image} alt="" loading="lazy" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-brand-charcoal/20 text-lg">🍕</div>
        )}
      </div>

      {/* Phones: name block on top, price + controls underneath. sm+: one line. */}
      <div className="flex-1 min-w-0 sm:flex sm:items-center sm:gap-3">
        <div className={`min-w-0 sm:flex-1 ${!published ? "opacity-50" : ""}`}>
          <div className="flex items-center gap-1.5 flex-wrap">
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
          <p className="text-xs text-brand-charcoal/45 truncate">{item.description}</p>
        </div>

        <div className="flex items-center gap-2 mt-2 sm:mt-0 flex-shrink-0">
          <span className="text-sm font-semibold text-brand-charcoal/70 whitespace-nowrap sm:order-2 sm:w-28 sm:text-right">
            {price}
          </span>
          <span className="sm:order-1">
            <PublishToggle id={item.id} published={published} onToggled={(next) => onTogglePublished(item.id, next)} />
          </span>
          <div className="flex items-center ml-auto sm:ml-0 sm:order-3">
            <Link
              href={`/admin/menu/${item.id}/edit`}
              aria-label={`Modifier ${item.name}`}
              className="text-xs font-semibold text-brand-green hover:text-brand-gold p-2 sm:px-2 sm:py-1"
            >
              <Pencil size={16} className="sm:hidden" aria-hidden />
              <span className="hidden sm:inline">Modifier</span>
            </Link>
            <DeleteButton id={item.id} name={item.name} />
          </div>
        </div>
      </div>
    </div>
  );
}
