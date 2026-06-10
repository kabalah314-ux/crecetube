# 06 · SISTEMA DE DISEÑO UI

> **Para la IA constructora**: este archivo define los **tokens** y **componentes** de diseño. NO usar starters genéricos. NO usar Inter. NO usar morados sobre blancos. La estética debe sentirse "de estudio creativo", no "SaaS template".

---

## 6.1 PRINCIPIOS

1. **Estética con carácter**: editorial-tech, no SaaS-genérico.
2. **Modo oscuro por defecto**: el creador trabaja de noche.
3. **Color como información**, no decoración: cada familia de estrategias tiene su color.
4. **Tipografía con personalidad** en titulares, neutra y legible en cuerpo.
5. **Grid asimétrico** en pantallas de contenido (wizard, dashboard). Sin "todo centrado".
6. **Espaciado generoso** (2x el "cómodo"). El producto tiene mucha info, no quiero claustrofobia.
7. **Microinteracciones sobrias**: nada salta sin motivo. Todo tiene 150-250ms.

---

## 6.2 PALETA DE COLORES

### 6.2.1 Tema oscuro (defecto)

```css
--bg-base:        #0F0E0C;   /* fondo principal: marrón-carbón cálido, no negro */
--bg-elevated:    #19170F;   /* tarjetas, modales */
--bg-overlay:     #1F1C12;   /* tooltips, popovers */
--bg-input:       #14120C;   /* inputs */

--text-primary:   #F5EFE0;   /* blanco roto cálido */
--text-secondary: #B8B0A0;
--text-tertiary:  #7A7466;
--text-disabled:  #4A463C;

--border-subtle:  #2A271E;
--border-strong:  #423E32;

--accent-primary: #E94F37;   /* rojo terracota — NO el rojo YouTube exacto */
--accent-hover:   #F26B55;
--accent-active:  #C73E29;

--accent-gold:    #E5B454;   /* dorado para logros, no amarillo chillón */
--accent-mint:    #6FBFA5;   /* éxito */
--accent-coral:   #F08C7A;   /* warning suave */
--accent-rust:    #D9614A;   /* error */

--shadow-card:    0 6px 24px rgba(0,0,0,0.45);
--shadow-modal:   0 12px 60px rgba(0,0,0,0.65);
```

### 6.2.2 Tema claro

```css
--bg-base:        #FAF7F1;   /* crema cálido, no blanco puro */
--bg-elevated:    #FFFFFF;
--bg-overlay:     #F2EDE3;
--bg-input:       #FFFFFF;

--text-primary:   #1A1814;
--text-secondary: #5C5648;
--text-tertiary:  #8C8676;
--text-disabled:  #C9C4B4;

--border-subtle:  #E6E0D2;
--border-strong:  #C9C4B4;

--accent-primary: #D6442A;
--accent-hover:   #E94F37;
--accent-active:  #B83723;

--accent-gold:    #C99838;
--accent-mint:    #4A9B82;
--accent-coral:   #E07B6A;
--accent-rust:    #C04B36;

--shadow-card:    0 4px 16px rgba(60,40,20,0.12);
--shadow-modal:   0 12px 40px rgba(60,40,20,0.25);
```

### 6.2.3 Colores de FAMILIAS de estrategias (constantes en ambos temas)

```css
--family-miniaturas:   #E94F37;  /* rojo terracota */
--family-titulos:      #E78A3C;  /* naranja quemado */
--family-tematicas:    #5A8FC9;  /* azul polvo */
--family-canal:        #6FAE73;  /* verde sage */
--family-video:        #A87CC2;  /* lila apagado (NO violeta neón) */
--family-descripcion:  #4DB5C4;  /* turquesa */
--family-listas:       #D9B441;  /* mostaza */
--family-tarjetas:     #D77BA1;  /* rosa palo */
--family-comunidad:    #5BB6A3;  /* turquesa mineral */
--family-crossplatform:#8A8A8A;  /* gris pizarra */
--family-directos:     #9F4A4F;  /* granate */
--family-emails:       #C77E59;  /* terracota suave */
--family-monetizacion: #C99838;  /* oro pálido */
--family-mentalidad:   #7A9686;  /* salvia */
--family-analitica:    #6E8AAD;  /* azul cielo apagado */
--family-pasos:        #BFA47A;  /* arena */
```

### 6.2.4 Colores de ESTADOS de un VideoProject

```css
--state-idea:          #B8B0A0;
--state-investigacion: #5A8FC9;
--state-guion:         #A87CC2;
--state-grabacion:     #E78A3C;
--state-edicion:       #D9B441;
--state-publicado:     #6FAE73;
--state-optimizacion:  #4DB5C4;
--state-archivado:     #7A7466;
```

---

## 6.3 TIPOGRAFÍA

### 6.3.1 Fuentes (todas con fallback)

**Display / Headings**: ELEGIR UNA, NO Inter, NO Roboto:
- **Fraunces** (recomendada) — serif moderna con carácter, gran versatilidad.
- Alternativas: **Cabinet Grotesk**, **Tobias**, **Recoleta**, **Boogaloo**.

**Body**: **General Sans** (recomendada), alternativas: **Söhne**, **GT Walsheim**, **Manrope**.

**Mono** (para timestamps, IDs): **JetBrains Mono** o **IBM Plex Mono**.

```css
--font-display: 'Fraunces', Georgia, 'Times New Roman', serif;
--font-body:    'General Sans', system-ui, sans-serif;
--font-mono:    'JetBrains Mono', 'Menlo', monospace;
```

> Importante: cargarlas vía `@fontsource/*` (npm) para no depender de Google Fonts CDN.

### 6.3.2 Escala tipográfica

```css
--text-xs:   12px / 16px;   /* labels, badges */
--text-sm:   14px / 20px;   /* secundario */
--text-base: 16px / 24px;   /* cuerpo */
--text-lg:   18px / 26px;
--text-xl:   22px / 30px;   /* títulos de bloque */
--text-2xl:  28px / 36px;
--text-3xl:  36px / 44px;   /* títulos de página */
--text-4xl:  48px / 56px;   /* heroes */
--text-5xl:  64px / 72px;   /* onboarding */

--font-weight-regular: 400;
--font-weight-medium:  500;
--font-weight-bold:    700;
--font-weight-black:   900;
```

Display siempre en **font-weight 500-700** (no 900, evitar sensación SaaS-bold).
Body siempre en **400-500**.

---

## 6.4 ESPACIADO

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 24px;
--space-6: 32px;
--space-7: 48px;
--space-8: 64px;
--space-9: 96px;
```

Regla: separación entre bloques principales ≥ `--space-6`. Padding interno de cards ≥ `--space-5`.

---

## 6.5 RADIOS Y BORDES

```css
--radius-sm:  6px;   /* botones pequeños, badges */
--radius-md:  10px;  /* inputs, cards */
--radius-lg:  16px;  /* modales, paneles */
--radius-pill: 999px;

--border-width-thin: 1px;
--border-width-thick: 2px;
```

---

## 6.6 SOMBRAS Y EFECTOS

Sombras suaves, cálidas, NO grises planos.

```css
--shadow-sm:  0 1px 2px rgba(0,0,0,0.20);
--shadow-md:  0 4px 12px rgba(0,0,0,0.25);
--shadow-lg:  0 12px 36px rgba(0,0,0,0.40);

--blur-glass: backdrop-filter: blur(18px) saturate(140%);
```

---

## 6.7 COMPONENTES BASE

### 6.7.1 Botón
- Primario: fondo `--accent-primary`, texto `--text-primary` (claro), radio `md`, padding 12px 20px.
- Secundario: fondo transparente, borde `--border-strong`, texto `--text-primary`.
- Ghost: solo texto.
- Hover: cambia a `--accent-hover` + traslación 1px arriba.
- Active: `--accent-active`.
- Disabled: `--text-disabled` + `--border-subtle`, cursor not-allowed.

Tamaños: `sm` (padding 8x12, text-sm), `md` (12x20, base), `lg` (16x28, lg).

### 6.7.2 Input
- Fondo `--bg-input`.
- Borde `--border-subtle`.
- Focus: borde `--accent-primary` + ring 3px `rgba(233,79,55,0.18)`.
- Padding 12px 14px.
- Placeholder `--text-tertiary`.
- Mensajes de error en `--accent-rust`.

### 6.7.3 Card de vídeo
```
┌──────────────────────┐
│  [Miniatura 16:9]    │
│                      │
├──────────────────────┤
│ [STATE BADGE]        │
│ Título del vídeo     │
│ Nicho · Tipo         │
│ ████░░░░ 44%         │
│ [→ Continuar]        │
└──────────────────────┘
```
- Hover: elevación + leve scale 1.02.
- Click: cambia cursor a pointer, animación press 100ms.

### 6.7.4 Stepper (wizard)
- Horizontal en desktop, vertical en mobile.
- Cada paso: número en círculo + título corto.
- Estados: `pending` (gris), `current` (anillo accent), `done` (relleno mint con check).
- Clic en paso completado: navega a él.
- Línea conectora con `--border-subtle`.

### 6.7.5 Checklist item
```
[ ] Texto del item
    Descripción opcional pequeña
```
- Check animado: scale-in + ligera línea diagonal sobre el texto al completar.
- Color al completar: texto `--text-tertiary`.

### 6.7.6 Bloque IA
- Fondo `--bg-overlay` con borde gradiente sutil (de --accent-gold a --accent-primary).
- Icono "sparkles" (Lucide).
- Botón "Generar" con loading state (spinner pequeño + texto "Pensando...").
- Resultado en lista de cards seleccionables.
- Botón "Regenerar" siempre disponible.

### 6.7.7 Tag de estrategia
- Pill (radius-pill), padding 4x10, text-xs, weight-medium.
- Background: color de familia con opacity 0.18.
- Texto: color de familia.
- Borde: 1px del color de familia con opacity 0.35.

Ejemplo: `<Tag family="miniaturas">SEOmarco</Tag>`

### 6.7.8 Modal
- Overlay: `rgba(0,0,0,0.65)` con blur 8px.
- Card centrada, max-width 560px (700 si es de configuración).
- Animación: scale 0.96 → 1 + opacity 0 → 1 en 200ms.
- Botón cerrar arriba-derecha (icono X).
- Acciones abajo-derecha (cancelar a la izquierda, primaria a la derecha).

### 6.7.9 Toast
- Esquina inferior derecha en desktop.
- Centro superior en móvil.
- Tipos:
  - Success: borde izquierdo --accent-mint.
  - Info: borde izquierdo --text-secondary.
  - Error: borde izquierdo --accent-rust.
- Duración: 3-5s. Hover pausa.

### 6.7.10 Empty state
- Icono Lucide grande (64px) en --text-tertiary.
- Título text-xl.
- Descripción text-base secundario.
- CTA primario.

---

## 6.8 MICROINTERACCIONES

| Acción | Animación | Duración |
|--------|-----------|----------|
| Botón hover | translateY(-1px) + brightness 1.05 | 150ms ease |
| Card hover | translateY(-2px) + shadow-lg | 200ms ease |
| Modal open | scale + opacity | 200ms |
| Checklist done | scale 1 → 1.15 → 1 del check + tachado | 250ms cubic-bezier(.34,1.56,.64,1) |
| Step done | check anillo expandiéndose | 300ms |
| Toast in | translateY(+8) → 0 + opacity | 200ms |
| Publicar vídeo | confetti suave (50 partículas, cálidos) | 1500ms |
| Autosave guardando | spinner dot 3 pulsos | infinite |

Reglas:
- Nunca animar más de 300ms en interacciones frecuentes.
- Respetar `prefers-reduced-motion`: en ese caso, todas las animaciones a 0ms y mantener solo opacity.

---

## 6.9 ICONOS

- Librería: **Lucide React** (`lucide-react`).
- Tamaño base 20px. 24px en CTAs primarios. 16px en badges.
- Color heredado del texto (`currentColor`).
- Iconos clave a importar:
  - `Sparkles` (IA), `Plus`, `Check`, `X`, `ChevronRight`, `ChevronLeft`, `Search`,
  - `Video`, `BookOpen`, `LayoutDashboard`, `LineChart`, `FileText`, `Settings`,
  - `Upload`, `Download`, `Eye`, `Edit`, `Trash`, `Copy`, `Save`, `RefreshCw`,
  - `Hash`, `Tag`, `Clock`, `Calendar`, `AlertCircle`, `CheckCircle2`, `Info`.

**Nunca emojis decorativos**.

---

## 6.10 LAYOUT GENERAL

### 6.10.1 Sidebar
- Ancho 240px desktop, oculto en móvil (drawer).
- Items con icono 20px + texto.
- Item activo: barra de 3px a la izquierda en `--accent-primary` + fondo `rgba(233,79,55,0.08)`.
- Logo arriba, perfil/ajustes abajo.

### 6.10.2 Topbar
- Solo en móvil (en desktop el sidebar reemplaza).
- Logo + botón hamburguesa + acción contextual.

### 6.10.3 Contenedor principal
- Max-width: 1280px en general, 1440px en métricas, 800px en wizard.
- Padding lateral mínimo: 24px (mobile), 48px (desktop).

### 6.10.4 Grid asimétrico
Dashboard, lista vídeos, panel métricas → 12 columnas. Bloques que no llenan 12 (ej. 8+4 o 7+5) generan ritmo visual.

---

## 6.11 ACCESIBILIDAD

- Contraste mínimo 4.5:1 entre texto y fondo (AA).
- Focus visible: ring 3px `--accent-primary` con `outline-offset: 2px`.
- `tabindex` ordenado lógicamente.
- Labels asociadas explícitamente (`<label for>`).
- Anuncios ARIA (`role="status"`, `aria-live="polite"`) en autosave y toasts.
- Skip-to-content link (oculto hasta focus).
- Componentes interactivos NUNCA `<div onClick>`, siempre `<button>` o `<a>`.

---

## 6.12 RESPONSIVE

Breakpoints:
```
sm:  640px
md:  768px
lg:  1024px
xl:  1280px
2xl: 1536px
```

- < 768px: sidebar oculto, wizard apilado, cards 1 columna.
- 768-1024px: sidebar colapsado (solo iconos), wizard apilado.
- > 1024px: sidebar full, wizard 2 columnas cuando aplique.

---

## 6.13 ASSETS

- Logo: SVG con variantes mono/color.
- Favicons: 16, 32, 180 (Apple), 192, 512 (PWA).
- Ilustraciones de empty states: trazo simple, lineweight 1.5px, color `--text-tertiary`. Estilo "doodle editorial".
- Sin stock photos.

---

## 6.14 DO / DON'T

### DO
- Fondo carbón cálido `#0F0E0C`.
- Tipografía display con personalidad (Fraunces).
- Color por familia para tags.
- Animaciones < 250ms.
- Espaciado generoso.

### DON'T
- Morados/violetas como acento.
- Gradientes obvios (especialmente azul→morado).
- Fuente Inter.
- Iconos emoji en UI.
- Componentes Material UI sin re-estilar.
- Más de 3 colores de acento en una misma vista.
- Animaciones tipo "bounce" agresivas.
