// OpenRouterTutorial — mini-tutorial descartable para configurar la clave IA (T015)
import { useNavigate } from "react-router-dom";
import { Sparkles, Key, Settings, ExternalLink } from "lucide-react";
import { Modal } from "../components/ui/Modal";
import { es } from "../i18n/es";

interface Props {
  open: boolean;
  onClose: () => void;
}

const t = es.tutorial.openrouter;

const PASOS = [
  {
    num: 1,
    Icon: Sparkles,
    titulo: t.paso1Titulo,
    desc: t.paso1Desc,
  },
  {
    num: 2,
    Icon: Key,
    titulo: t.paso2Titulo,
    desc: t.paso2Desc,
  },
  {
    num: 3,
    Icon: Settings,
    titulo: t.paso3Titulo,
    desc: t.paso3Desc,
  },
] as const;

export function OpenRouterTutorial({ open, onClose }: Props) {
  const navigate = useNavigate();

  function handleCta() {
    onClose();
    navigate("/configuracion");
  }

  const actions = (
    <>
      <button
        className="btn btn-ghost btn-sm"
        data-testid="openrouter-tutorial-close"
        onClick={onClose}
      >
        {t.ctaSaltar}
      </button>
      <button
        className="btn btn-primary btn-sm"
        data-testid="openrouter-tutorial-cta"
        onClick={handleCta}
      >
        {t.ctaIrConfiguracion}
      </button>
    </>
  );

  return (
    <Modal open={open} onClose={onClose} title={t.titulo} wide actions={actions}>
      <div data-testid="openrouter-tutorial">
        <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)", marginBottom: "var(--space-5)" }}>
          {t.bajada}
        </p>

        <div style={{ marginBottom: "var(--space-5)" }}>
          {PASOS.map(({ num, Icon, titulo, desc }) => (
            <div key={num} className="tutorial-step">
              <div className="tutorial-step-num" aria-hidden="true">
                {num}
              </div>
              <div className="tutorial-step-body">
                <strong>
                  <Icon size={14} style={{ verticalAlign: "middle", marginRight: "var(--space-1)" }} />
                  {titulo}
                </strong>
                <p>{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <a
          href="https://openrouter.ai/keys"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary btn-sm"
          style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)" }}
        >
          <ExternalLink size={14} />
          {t.linkOpenRouter}
        </a>
      </div>
    </Modal>
  );
}
