interface ColorInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
}

export default function ColorInput({
  label,
  value,
  onChange,
}: ColorInputProps) {
  const safe = typeof value === "string" ? value : "";
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
        {label}
      </label>
      <div className="flex items-center gap-2 rounded-lg border border-input bg-card p-1">
        <input
          type="color"
          value={safe.startsWith("#") ? safe : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 w-9 cursor-pointer rounded border-0 bg-transparent p-0"
        />
        <input
          type="text"
          value={safe}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-xs outline-none"
        />
      </div>
    </div>
  );
}
