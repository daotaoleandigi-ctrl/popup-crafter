import type { CSSProperties, ElementType } from "react";

interface EditableTextProps {
  value: string;
  onChange: (v: string) => void;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  placeholder?: string;
  multiline?: boolean;
}

export default function EditableText({
  value,
  onChange,
  as: Tag = "div",
  className,
  style,
  placeholder,
  multiline,
}: EditableTextProps) {
  return (
    <Tag
      contentEditable
      suppressContentEditableWarning
      onBlur={(e: React.FocusEvent<HTMLElement>) =>
        onChange(
          multiline
            ? e.currentTarget.innerText
            : e.currentTarget.textContent || "",
        )
      }
      onKeyDown={(e: React.KeyboardEvent) => {
        if (!multiline && e.key === "Enter") {
          e.preventDefault();
          (e.target as HTMLElement).blur();
        }
      }}
      className={`${className ?? ""} outline-none focus:bg-accent/15 focus:ring-2 focus:ring-primary/40 rounded cursor-text`}
      style={style}
      data-ph={placeholder}
    >
      {value}
    </Tag>
  );
}
