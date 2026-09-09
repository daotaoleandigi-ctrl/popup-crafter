import { uploadImage } from "@/lib/repository";
import { toast } from "sonner";
import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";

interface ImageUploaderProps {
  value: string;
  onChange: (dataUrl: string) => void;
  label: string;
  className?: string;
}

export default function ImageUploader({
  value,
  onChange,
  label,
  className,
}: ImageUploaderProps) {
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (busy) return;
    setBusy(true);
    try {
      onChange(await uploadImage(file));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không tải được ảnh.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className={className}>
      <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
        {label}
      </label>
      <div
        className="group relative flex h-20 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-border bg-muted/40 transition hover:border-primary/60"
        onClick={() => !busy && inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
        }}
      >
        {value ? (
          <>
            <img
              src={value}
              alt={label}
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              className="absolute right-1 top-1 rounded-full bg-black/55 p-1 text-white opacity-0 transition group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
            <Upload className="h-4 w-4" />
            <span>
              {busy ? "Đang tải ảnh…" : "Tải ảnh hoặc kéo thả (tối đa 5 MB)"}
            </span>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        disabled={busy}
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
    </div>
  );
}
