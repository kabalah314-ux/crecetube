import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  icon: LucideIcon;
  title: string;
  desc?: string;
  cta?: ReactNode;
}

export function EmptyState({ icon: Icon, title, desc, cta }: Props) {
  return (
    <div className="empty">
      <Icon size={64} strokeWidth={1.5} />
      <h3>{title}</h3>
      {desc && <p>{desc}</p>}
      {cta}
    </div>
  );
}
