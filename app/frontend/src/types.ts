// types.ts — espejo TypeScript de 03_MODELOS_DE_DATOS.md. No inventar campos.

export type Nivel = "principiante" | "intermedio" | "avanzado";
export type Frecuencia = "diaria" | "2x_semana" | "semanal" | "quincenal" | "mensual";
export type Objetivo = "suscriptores" | "monetizacion" | "influencia" | "ventas" | "diversion";
export type Tema = "dark" | "light";

export interface UserProfile {
  id: string;
  canalNombre: string | null; // null = todavía sin decidir (T021)
  canalUrl: string | null;
  nicho: string | null; // null = aún no lo sabe (T021)
  nivel: Nivel;
  frecuenciaObjetivo: Frecuencia | null; // null = aún no lo sabe (T021)
  objetivoPrincipal: Objetivo;
  idioma: "es";
  tieneCanalYa: boolean;
  gestionMulticanal: boolean;
  preferenciasUi: { tema: Tema; densidad: "compacta" | "comoda"; sonidos: boolean };
  iaConfig: {
    proveedor: string;
    modelo: string;
    apiKey: string; // "***" si hay clave guardada, "" si no
    baseUrl: string | null;
    temperatura: number;
  };
  createdAt: string;
  updatedAt: string;
}

// Canal del usuario (T017). Espejo de GET /api/canales.
export interface Channel {
  id: string;
  nombre: string;
  esPorDefecto: boolean;
  createdAt: string;
}

// Sesión (T016). Espejo de GET /api/auth/me y GET /api/auth/config.
export interface AuthUser {
  id: string;
  email: string | null;
  nombre: string | null;
  modo: "local" | "cuenta";
}

export interface AuthConfig {
  googleClientId: string | null;
  authConfigurada: boolean;
}

export type VideoState =
  | "idea"
  | "investigacion"
  | "guion"
  | "grabacion"
  | "edicion"
  | "publicado"
  | "optimizacion"
  | "archivado";

export type StepId =
  | "idea"
  | "investigacion"
  | "titulo"
  | "miniatura"
  | "guion"
  | "grabacion"
  | "edicion"
  | "publicacion"
  | "sprint"
  | "evergreen";

export interface BloqueGuion {
  titulo: string;
  duracionSegundos: number;
  contenido: string;
  roturaPatron: boolean;
  seoReset: boolean;
  seoZoom: boolean;
}

export interface Tarjeta {
  tipo: "Subjeta" | "Indujetas" | "Psicojetas" | "SEOjeta" | "SEOrescate";
  momentoSegundos: number;
  destino: string;
  cta: string;
}

export interface VideoProject {
  id: string;
  canalId: string | null;
  tituloIdea: string;
  tituloFinal: string | null;
  titulosAlternativos: string[];
  descripcionCorta: string;
  nicho: string;
  tipo: "sprint" | "evergreen" | "mixto";
  estado: VideoState;
  formato: "long" | "short" | "live" | "podcast";
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  archivedAt: string | null;
  palabrasClave: string[];
  seoPreguntas: string[];
  competenciaRefs: Array<{ url: string; notas: string }>;
  estrategiasAplicadas: string[];
  guion: {
    seoInicio: string;
    seoLoop: string;
    seoShock: string;
    desarrollo: BloqueGuion[];
    seoResultado: string;
    cliffhanger: string | null;
    psicoCta: string;
    duracionTotalEstimadaSeg: number;
  };
  miniatura: {
    estrategia: string | null;
    palabrasMiniatura: string;
    briefIA: string | null;
    urlPrincipal: string | null;
    urlsAlternativas: string[];
  };
  descripcionPublicada: string;
  hashtags: { descripcion: string[]; titulo: string[]; geolocalizacion: string | null };
  timestamps: Array<{ tiempo: string; titulo: string }>;
  listaReproduccionNombre: string | null;
  comentarioFijado: string | null;
  pantallasFinales: {
    configuracion: "unitaria" | "binaria" | "terciaria" | "cuaternaria" | "plantilla";
    elementos: Array<{
      tipo: "video" | "lista" | "suscripcion" | "canal" | "enlace";
      destino: string;
      posicion: "izq" | "der" | "centro" | "abajo";
    }>;
  };
  tarjetas: Tarjeta[];
  checklistEstado: Record<string, Record<string, boolean>>;
  difusion: {
    emailEnviado: boolean;
    postComunidad: {
      enviado: boolean;
      tipo: "Giftcalipsis" | "SEOencuesta" | "SEOlaunch" | "SEOrepesca" | null;
      contenido: string;
    };
    redesCompartido: { instagram: boolean; twitter: boolean; tiktok: boolean; otros: string[] };
    adsActivados: boolean;
    plataformasAds: string[];
  };
  metricasIds: string[];
  notas: string;
  seoHora: { diaSemana: number | null; horaPublicacion: string | null };
}

export interface CourseAsignatura {
  id: string;
  titulo: string;
  duracionEstimadaMin: number;
  plantillaRelacionadaId: string | null;
  contenido: string;
  recursoExtra: string | null;
  videoReferencia: string | null;
}

export interface CourseSeccion {
  id: string;
  titulo: string;
  descripcion: string;
  familia: string;
  colorToken: string;
  asignaturas: CourseAsignatura[];
}

export interface CourseStructure {
  version: number;
  totalSecciones: number;
  totalAsignaturas: number;
  secciones: CourseSeccion[];
}

export interface CourseProgress {
  id: string;
  asignaturaId: string;
  seccionId: string;
  completado: boolean;
  notaPersonal: string;
  fechaCompletado: string | null;
  vinculadoAVideoIds: string[];
}

export interface TemplateVariable {
  nombre: string;
  descripcion: string;
  valorPorDefecto: string;
  tipo: "texto" | "url" | "numero" | "fecha";
}

export interface Template {
  id: string;
  nombre: string;
  tipo: string;
  contenido: string;
  variablesDinamicas: TemplateVariable[];
  seccionRelacionadaId: string | null;
  esEditable: boolean;
  esPrecargada: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MetricSnapshot {
  id: string;
  videoProjectId: string;
  fecha: string;
  diasDesdePublicacion: number;
  vistas: number;
  impresiones: number;
  ctr: number;
  retencionMediaPct: number;
  duracionMediaSeg: number;
  velocidadVisualizacion: number;
  suscriptoresGanados: number;
  comentarios: number;
  likes: number;
  ingresosEstimados: number | null;
  rpm: number | null;
  notas: string;
}

export interface AIInteraction {
  id: string;
  videoProjectId: string | null;
  tipo: string;
  prompt: string;
  respuesta: string;
  respuestaParseada: unknown;
  seleccionUsuario: string | null;
  modeloUsado: string;
  tokensUsados: number | null;
  costoEstimado: number | null;
  createdAt: string;
}

// Utilidad para PATCH parciales
export type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };
