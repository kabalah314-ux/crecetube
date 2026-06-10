import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Video,
  BookOpen,
  FileText,
  LineChart,
  Settings,
  Menu,
  Sun,
  Moon,
} from "lucide-react";
import { es } from "../i18n/es";
import { useStore } from "../store/useStore";

const NAV = [
  { to: "/dashboard", label: es.nav.dashboard, icon: LayoutDashboard, testid: "nav-dashboard" },
  { to: "/videos", label: es.nav.videos, icon: Video, testid: "nav-videos" },
  { to: "/curso", label: es.nav.curso, icon: BookOpen, testid: "nav-curso" },
  { to: "/plantillas", label: es.nav.plantillas, icon: FileText, testid: "nav-plantillas" },
  { to: "/metricas", label: es.nav.metricas, icon: LineChart, testid: "nav-metricas" },
];

export function Layout() {
  const [drawer, setDrawer] = useState(false);
  const profile = useStore((s) => s.profile);
  const setTheme = useStore((s) => s.setTheme);
  const tema = profile?.preferenciasUi.tema ?? "dark";

  const nav = (
    <>
      <div className="sidebar-logo">
        CRECE<em>TUBE</em> <span style={{ fontWeight: 400, color: "var(--text-tertiary)" }}>Assistant</span>
      </div>
      <nav aria-label="Navegación principal">
        {NAV.map(({ to, label, icon: Icon, testid }) => (
          <NavLink
            key={to}
            to={to}
            data-testid={testid}
            className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
            onClick={() => setDrawer(false)}
          >
            <Icon size={20} />
            <span className="nav-label">{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-foot">
        <button
          className="nav-item"
          style={{ border: "none", background: "none", cursor: "pointer", width: "100%" }}
          onClick={() => setTheme(tema === "dark" ? "light" : "dark")}
          data-testid="theme-toggle"
          aria-label={tema === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
        >
          {tema === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          <span className="nav-label">{tema === "dark" ? "Tema claro" : "Tema oscuro"}</span>
        </button>
        <NavLink
          to="/configuracion"
          data-testid="nav-configuracion"
          className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
          onClick={() => setDrawer(false)}
        >
          <Settings size={20} />
          <span className="nav-label">{es.nav.configuracion}</span>
        </NavLink>
      </div>
    </>
  );

  return (
    <div className="app-shell">
      <a href="#contenido" className="skip-link">
        Saltar al contenido
      </a>
      <aside className={`sidebar${drawer ? " open" : ""}`}>{nav}</aside>
      {drawer && <div className="drawer-overlay" onClick={() => setDrawer(false)} />}
      <div>
        <header className="topbar">
          <button className="btn btn-ghost btn-sm" aria-label="Abrir menú" onClick={() => setDrawer(true)} data-testid="topbar-menu">
            <Menu size={20} />
          </button>
          <span className="sidebar-logo" style={{ padding: 0, fontSize: "var(--text-lg)" }}>
            CRECE<em>TUBE</em>
          </span>
          <span style={{ width: 36 }} />
        </header>
        <main id="contenido">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
