"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { ChevronLeft, ChevronRight, Star, X } from "lucide-react";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 8 * 1024 * 1024; // 8 MB
const MAX_PHOTOS = 12; // same limit enforced in actions.ts

// Ordered photo list for one menu item. The first photo is the main one
// (menu card); the rest are shown in the card's photo viewer. Submitted as
// two hidden fields: `image` (main) and `extraImages` (JSON array).
export default function PhotosUpload({ initialUrls }: { initialUrls: string[] }) {
  const [urls, setUrls] = useState<string[]>(initialUrls);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: File[]) => {
    setError(null);
    const room = MAX_PHOTOS - urls.length;
    if (room <= 0) {
      setError(`${MAX_PHOTOS} photos maximum.`);
      return;
    }
    const valid = files.filter((f) => ALLOWED_TYPES.includes(f.type) && f.size <= MAX_SIZE);
    const problems: string[] = [];
    if (valid.length < files.length) problems.push("certains fichiers ignorés (JPEG, PNG ou WebP, 8 Mo max)");
    if (valid.length > room) problems.push(`seulement ${room} photo(s) de plus possible(s)`);
    const batch = valid.slice(0, room);

    setProgress({ done: 0, total: batch.length });
    let failed = 0;
    // One at a time: a phone on 3G uploading 5 photos in parallel mostly just times out.
    for (const file of batch) {
      try {
        const blob = await upload(`menu-items/${Date.now()}-${file.name}`, file, {
          access: "public",
          handleUploadUrl: "/api/admin/blob-upload",
        });
        setUrls((u) => [...u, blob.url]);
      } catch {
        failed++;
      }
      setProgress((p) => (p ? { ...p, done: p.done + 1 } : p));
    }
    setProgress(null);
    if (failed) problems.push(`${failed} envoi(s) échoué(s), réessayez`);
    if (problems.length) setError(problems.join(" · ") + ".");
  };

  const move = (from: number, to: number) =>
    setUrls((u) => {
      if (to < 0 || to >= u.length) return u;
      const next = [...u];
      const [x] = next.splice(from, 1);
      next.splice(to, 0, x);
      return next;
    });
  const remove = (i: number) => setUrls((u) => u.filter((_, j) => j !== i));

  const btn =
    "w-7 h-7 rounded-full bg-black/55 text-white flex items-center justify-center hover:bg-black/75 disabled:opacity-30 disabled:pointer-events-none";

  return (
    <div>
      <input type="hidden" name="image" value={urls[0] ?? ""} />
      <input type="hidden" name="extraImages" value={JSON.stringify(urls.slice(1))} />

      {urls.length > 0 && (
        <ul className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 mb-3">
          {urls.map((url, i) => (
            <li key={url} className="relative aspect-square rounded-lg overflow-hidden border border-brand-green/10 bg-brand-green/5">
              {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail */}
              <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
              {i === 0 && (
                <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-brand-gold text-brand-green text-[10px] font-bold uppercase">
                  Principale
                </span>
              )}
              <button type="button" onClick={() => remove(i)} className={`${btn} absolute top-1.5 right-1.5`} aria-label={`Retirer la photo ${i + 1}`}>
                <X size={14} />
              </button>
              <div className="absolute bottom-1.5 inset-x-1.5 flex justify-between">
                <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} className={btn} aria-label="Déplacer avant">
                  <ChevronLeft size={15} />
                </button>
                {i > 0 && (
                  <button type="button" onClick={() => move(i, 0)} className={btn} title="Mettre en photo principale" aria-label="Mettre en photo principale">
                    <Star size={13} />
                  </button>
                )}
                <button type="button" onClick={() => move(i, i + 1)} disabled={i === urls.length - 1} className={btn} aria-label="Déplacer après">
                  <ChevronRight size={15} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = ""; // allow picking the same file again
          if (files.length) handleFiles(files);
        }}
        className="hidden"
      />
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={progress !== null || urls.length >= MAX_PHOTOS}
          onClick={() => inputRef.current?.click()}
          className="px-3.5 py-2 rounded-lg border border-brand-green/20 text-sm font-medium text-brand-charcoal hover:border-brand-gold/40 transition-colors disabled:opacity-60"
        >
          {progress ? `Envoi ${progress.done + 1}/${progress.total}…` : urls.length ? "Ajouter des photos" : "Choisir des photos"}
        </button>
        <span className="text-xs text-brand-charcoal/45">
          {urls.length}/{MAX_PHOTOS} · la 1re est affichée sur la carte, les autres en appuyant dessus
        </span>
      </div>
      {error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}
    </div>
  );
}
