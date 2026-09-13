"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 8 * 1024 * 1024; // 8 MB

export default function ImageUpload({ initialUrl }: { initialUrl?: string }) {
  const [url, setUrl] = useState(initialUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Format non supporté (JPEG, PNG ou WebP uniquement).");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError("Fichier trop volumineux (8 Mo max).");
      return;
    }

    setUploading(true);
    try {
      const blob = await upload(`menu-items/${Date.now()}-${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/admin/blob-upload",
      });
      setUrl(blob.url);
    } catch {
      setError("Échec de l'envoi de la photo. Réessayez.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input type="hidden" name="image" value={url} />
      <div className="flex items-center gap-4">
        {url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="w-20 h-20 rounded-lg object-cover border border-brand-green/10" />
        )}
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
            className="hidden"
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="px-3.5 py-2 rounded-lg border border-brand-green/20 text-sm font-medium text-brand-charcoal hover:border-brand-gold/40 transition-colors disabled:opacity-60"
          >
            {uploading ? "Envoi..." : url ? "Changer la photo" : "Choisir une photo"}
          </button>
          {error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}
        </div>
      </div>
    </div>
  );
}
