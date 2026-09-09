import { useState } from "react";
import type { PopupConfig } from "@/types";
import PopupList from "@/components/PopupList";
import PopupEditor from "@/components/PopupEditor";

const Index = () => {
  const [editing, setEditing] = useState<PopupConfig | null>(null);

  if (editing) {
    return <PopupEditor popup={editing} onBack={() => setEditing(null)} />;
  }
  return <PopupList onEdit={(p) => setEditing(p)} />;
};

export default Index;
