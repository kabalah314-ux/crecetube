import { Construction } from "lucide-react";
import { EmptyState } from "../components/ui/EmptyState";
import { es } from "../i18n/es";

export function Placeholder({ titulo }: { titulo: string }) {
  return (
    <div className="page">
      <div className="page-head">
        <h1>{titulo}</h1>
      </div>
      <div className="card">
        <EmptyState icon={Construction} title={es.common.enConstruccion} desc={es.common.enConstruccionDesc} />
      </div>
    </div>
  );
}
