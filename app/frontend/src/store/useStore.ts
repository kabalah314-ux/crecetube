// useStore.ts — estado global (perfil, sesión, tema, toasts).
import { create } from "zustand";
import { api, isApiError } from "../services/api";
import type { AuthConfig, AuthUser, DeepPartial, Tema, UserProfile } from "../types";

export type ProfileStatus = "loading" | "missing" | "ready";

export interface Toast {
  id: number;
  tipo: "success" | "info" | "error";
  texto: string;
  accion?: { label: string; fn: () => void };
}

interface Store {
  profile: UserProfile | null;
  profileStatus: ProfileStatus;
  auth: AuthUser | null; // null = aún sin cargar
  authConfig: AuthConfig | null;
  toasts: Toast[];
  loadAuth: () => Promise<void>;
  logout: () => Promise<void>;
  loadProfile: () => Promise<void>;
  createProfile: (datos: Partial<UserProfile>) => Promise<UserProfile>;
  patchProfile: (patch: DeepPartial<UserProfile>) => Promise<void>;
  setTheme: (tema: Tema) => Promise<void>;
  toast: (tipo: Toast["tipo"], texto: string, accion?: Toast["accion"]) => void;
  dismissToast: (id: number) => void;
}

function applyTheme(tema: Tema) {
  document.documentElement.dataset.theme = tema;
}

let toastSeq = 1;

export const useStore = create<Store>((set, get) => ({
  profile: null,
  profileStatus: "loading",
  auth: null,
  authConfig: null,
  toasts: [],

  loadAuth: async () => {
    try {
      const [me, config] = await Promise.all([
        api.get<AuthUser>("/api/auth/me"),
        api.get<AuthConfig>("/api/auth/config"),
      ]);
      set({ auth: me, authConfig: config });
    } catch {
      // Backend antiguo o sin conexión → comportarse como modo local sin auth.
      set({
        auth: { id: "local", email: null, nombre: null, modo: "local" },
        authConfig: { googleClientId: null, authConfigurada: false },
      });
    }
  },

  logout: async () => {
    try {
      await api.post("/api/auth/logout");
    } catch {
      /* la cookie puede haber caducado ya; recargar igualmente */
    }
    window.location.assign("/");
  },

  loadProfile: async () => {
    try {
      const p = await api.get<UserProfile>("/api/profile");
      applyTheme(p.preferenciasUi.tema);
      set({ profile: p, profileStatus: "ready" });
    } catch (e) {
      if (isApiError(e) && e.code === "PROFILE_NOT_FOUND") set({ profileStatus: "missing" });
      else {
        set({ profileStatus: "missing" });
        get().toast("error", "No se pudo conectar con el servidor. ¿Está arrancado el backend?");
      }
    }
  },

  createProfile: async (datos) => {
    const p = await api.post<UserProfile>("/api/profile", datos);
    applyTheme(p.preferenciasUi.tema);
    set({ profile: p, profileStatus: "ready" });
    return p;
  },

  patchProfile: async (patch) => {
    const p = await api.patch<UserProfile>("/api/profile", patch);
    applyTheme(p.preferenciasUi.tema);
    set({ profile: p });
  },

  setTheme: async (tema) => {
    applyTheme(tema); // al vuelo
    const { profile } = get();
    if (profile) await get().patchProfile({ preferenciasUi: { tema } });
  },

  toast: (tipo, texto, accion) => {
    const id = toastSeq++;
    set((s) => ({ toasts: [...s.toasts, { id, tipo, texto, accion }] }));
    window.setTimeout(() => get().dismissToast(id), accion ? 6000 : 4500);
  },

  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
