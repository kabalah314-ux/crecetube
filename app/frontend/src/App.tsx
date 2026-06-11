import { useEffect, type ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Toasts } from "./components/ui/Toasts";
import { useStore } from "./store/useStore";
import { Onboarding } from "./routes/Onboarding";
import { Dashboard } from "./routes/Dashboard";
import { Settings } from "./routes/Settings";
import { VideosList } from "./routes/VideosList";
import { NewVideo } from "./routes/NewVideo";
import { VideoWizard } from "./routes/VideoWizard";
import { VideoDetail } from "./routes/VideoDetail";
import { CourseIndex } from "./routes/CourseIndex";
import { CourseSection } from "./routes/CourseSection";
import { CourseLesson } from "./routes/CourseLesson";
import { TemplatesLibrary } from "./routes/TemplatesLibrary";
import { TemplateDetail } from "./routes/TemplateDetail";
import { Metrics } from "./routes/Metrics";
import { Viabilidad } from "./routes/Viabilidad";
import { es } from "./i18n/es";

function Splash() {
  return (
    <div className="splash">
      <span className="spinner" style={{ width: 28, height: 28 }} />
      <span>Cargando {es.app.nombre}…</span>
    </div>
  );
}

function RequireProfile({ children }: { children: ReactNode }) {
  const status = useStore((s) => s.profileStatus);
  if (status === "loading") return <Splash />;
  if (status === "missing") return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

export default function App() {
  const status = useStore((s) => s.profileStatus);
  const loadProfile = useStore((s) => s.loadProfile);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  return (
    <>
      <Routes>
        <Route
          path="/onboarding"
          element={status === "ready" ? <Navigate to="/dashboard" replace /> : status === "loading" ? <Splash /> : <Onboarding />}
        />
        <Route
          element={
            <RequireProfile>
              <Layout />
            </RequireProfile>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/videos" element={<VideosList />} />
          <Route path="/videos/nuevo" element={<NewVideo />} />
          <Route path="/videos/:id" element={<VideoDetail />} />
          <Route path="/videos/:id/wizard/:stepId" element={<VideoWizard />} />
          <Route path="/curso" element={<CourseIndex />} />
          <Route path="/curso/:seccionId" element={<CourseSection />} />
          <Route path="/curso/:seccionId/:asignaturaId" element={<CourseLesson />} />
          <Route path="/plantillas" element={<TemplatesLibrary />} />
          <Route path="/plantillas/:id" element={<TemplateDetail />} />
          <Route path="/metricas" element={<Metrics />} />
          <Route path="/viabilidad" element={<Viabilidad />} />
          <Route path="/configuracion" element={<Settings />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toasts />
    </>
  );
}
