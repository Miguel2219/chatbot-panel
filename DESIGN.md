---
name: Zolvion Chatbot Panel
description: Panel multi-tenant nocturno para gestionar bots, leads y conversaciones del SaaS Zolvion.
colors:
  night-floor: "#0A0A1A"
  night-surface: "#0F1024"
  night-elevated: "#141528"
  night-hover: "#1A1C33"
  sidebar-recess: "#05060D"
  ember-orange: "#FF6B00"
  ember-orange-bright: "#FF8A33"
  ember-orange-deep: "#E65C00"
  paper-foreground: "#F4F5FB"
  smoke-foreground: "#A0A3B8"
  iron-foreground: "#475569"
  iron-border: "#FFFFFF14"
  iron-border-strong: "#FFFFFF24"
  ember-glow: "#FF6B001F"
  ember-focus: "#FF6B0080"
  signal-success: "#22C55E"
  signal-warning: "#F59E0B"
  signal-danger: "#EF4444"
  signal-info: "#38BDF8"
typography:
  display:
    fontFamily: "Inter, sans-serif"
    fontSize: "32px"
    fontWeight: 700
    lineHeight: 1.2
  headline:
    fontFamily: "Inter, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: 1.3
  title:
    fontFamily: "Inter, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Inter, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    letterSpacing: "0.4px"
  caption:
    fontFamily: "Inter, sans-serif"
    fontSize: "11px"
    fontWeight: 500
    lineHeight: 1.5
  mono:
    fontFamily: "ui-monospace, JetBrains Mono, Cascadia Mono, Consolas, Monaco, monospace"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  pill: "20px"
  circle: "50%"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.ember-orange}"
    textColor: "#FFFFFF"
    rounded: "{rounded.sm}"
    padding: "0 24px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.ember-orange-bright}"
    textColor: "#FFFFFF"
  button-secondary:
    backgroundColor: "{colors.night-elevated}"
    textColor: "{colors.paper-foreground}"
    rounded: "{rounded.sm}"
    padding: "0 24px"
    height: "40px"
  button-secondary-hover:
    backgroundColor: "{colors.night-hover}"
    textColor: "{colors.paper-foreground}"
  button-icon:
    backgroundColor: "{colors.night-elevated}"
    textColor: "{colors.smoke-foreground}"
    rounded: "{rounded.circle}"
    size: "36px"
  input-default:
    backgroundColor: "{colors.night-elevated}"
    textColor: "{colors.paper-foreground}"
    rounded: "{rounded.sm}"
    padding: "0 16px"
    height: "44px"
  badge-success:
    backgroundColor: "#22C55E1F"
    textColor: "{colors.signal-success}"
    rounded: "{rounded.pill}"
    padding: "3px 10px"
  badge-danger:
    backgroundColor: "#EF44441F"
    textColor: "{colors.signal-danger}"
    rounded: "{rounded.pill}"
    padding: "3px 10px"
  badge-primary:
    backgroundColor: "{colors.ember-glow}"
    textColor: "{colors.ember-orange}"
    rounded: "{rounded.pill}"
    padding: "3px 10px"
  tab-active:
    backgroundColor: "transparent"
    textColor: "{colors.paper-foreground}"
  tab-inactive:
    backgroundColor: "transparent"
    textColor: "{colors.smoke-foreground}"
---

# Design System: Zolvion Chatbot Panel

## 1. Overview

**Creative North Star: "The Night Workshop"**

Un taller nocturno: el power user trabaja iluminado por una sola fuente (el naranja Zolvion) sobre una superficie oscura calibrada en cuatro pasos de gris-violeta. Densidad sobre espectáculo. La interfaz es un instrumento, no una vidriera. Los asesores pasan ocho horas frente a este panel, los TENANT_OWNER vienen a configurar su bot y volver a su sitio web; ninguno necesita ser entretenido, todos necesitan que la herramienta desaparezca en la tarea.

El sistema rechaza explícitamente la estética SaaS genérica (HubSpot, Salesforce, hero metric grids), el glassmorphism decorativo, los gradientes púrpura tipo Stripe, los gradient text con `background-clip`, los side-stripe borders coloreados, los modales como contenedor universal y los clichés visuales del rubro chatbot (neón cyan, mascots, burbujas decorativas). Lo que queda después de quitar todo eso es una superficie oscura comprometida (no toggle), tipografía Inter tight, jerarquías construidas con peso y escala (no con color decorativo), y un único acento naranja que aparece sólo donde cumple función semántica.

**Key Characteristics:**
- **Densidad sobre aire.** Aire calculado, no whitespace por defecto.
- **Compromiso con la oscuridad.** Cuatro escalones de night-* tintados hacia el azul-violeta de marca; nunca `#000` ni `#fff`.
- **Naranja como punto de fuego.** Ember Orange aparece en CTA primarios, tab activa, focus ring, badge primary. Nada más.
- **Tipografía Inter, una sola familia.** Todas las jerarquías derivan de la misma escala 11→32px.
- **Bordes 1px sutiles.** El sistema no grita; se delimita.

## 2. Colors: The Night Workshop Palette

Una paleta dark **committed** (no "dark theme toggle"). Cuatro tonos de night-* construyen la profundidad por luminosidad; el naranja Zolvion es el único acento de marca; los neutros van tintados hacia el azul-violeta para que la pantalla nunca se sienta gris-corporativo.

### Primary

- **Ember Orange** (`#FF6B00`): el único acento de marca. Aparece en botones primarios (Guardar, Crear, Enviar), en el `border-bottom` de la tab activa, en el focus ring de inputs, en badges de tipo "bot" y en el shadow-glow puntual. Su rareza es el punto.
- **Ember Orange Bright** (`#FF8A33`): hover state del primary. +12% lightness, no satura más.
- **Ember Orange Deep** (`#E65C00`): variante profunda para casos donde el bright es demasiado claro sobre fondo claro (raros, en este sistema casi nunca).

### Neutral

La superficie completa se construye con cuatro pasos de night-*. Cada uno corresponde a un nivel jerárquico:

- **Night Floor** (`#0A0A1A`): fondo global de la app. La capa que el ojo no debe registrar.
- **Night Surface** (`#0F1024`): tarjetas, table-wrappers, contenedores de contenido principal.
- **Night Elevated** (`#141528`): inputs, ng-select, snippet code blocks, install hints. La capa "interactiva o destacada".
- **Night Hover** (`#1A1C33`): hover states de botones secundarios, skeleton shimmer, opciones de dropdown bajo cursor.
- **Sidebar Recess** (`#05060D`): el sidebar es **más profundo** que el fondo, no más alto. Recede.

### Foreground

- **Paper Foreground** (`#F4F5FB`): texto principal. Casi blanco con tinte azul-violeta, no `#fff`.
- **Smoke Foreground** (`#A0A3B8`): texto secundario, labels, breadcrumbs, placeholders descriptivos.
- **Iron Foreground** (`#475569`): texto deshabilitado, hint counters en estado normal, placeholders de input vacíos.

### Borders

- **Iron Border** (`#FFFFFF14`): el borde por defecto. 8% opacidad, casi inaudible. Define sin gritar.
- **Iron Border Strong** (`#FFFFFF24`): hover state de bordes, separadores más explícitos cuando hace falta.
- **Ember Glow** (`#FF6B001F`): tinte naranja al 12% para badge-primary, ng-select multi chips, hover de btn-icon-primary, fondo de opciones seleccionadas en dropdown.
- **Ember Focus** (`#FF6B0080`): focus ring 50% naranja. Aparece como `box-shadow: 0 0 0 3px ember-glow` o `outline: 2px solid ember-focus`.

### Status (semánticos universales — verde = ok, rojo = peligro, etc.)

- **Signal Success** (`#22C55E`): confirmaciones, badges activo, status closed.
- **Signal Warning** (`#F59E0B`): alertas no bloqueantes, contador de caracteres en zona ámbar (≥ 18.000 / 20.000).
- **Signal Danger** (`#EF4444`): errores, contador en límite (≥ 20.000), botón danger, status inactivo.
- **Signal Info** (`#38BDF8`): notificaciones neutras, status contacted.

### Named Rules

**The Single-Spark Rule.** El naranja Ember se usa donde **comunica acción o estado**: CTA primario, tab activa, focus ring, badge-primary. Nunca como decoración: nunca en el nombre de una entidad dentro de un heading (`<strong>` con color naranja en títulos = prohibido), nunca en gradient text, nunca en side-stripe borders, nunca como background ambiental.

**The Tinted-Neutral Rule.** Ningún hex puro. Los neutros tienen tinte hacia el azul-violeta de marca (chroma ~0.005-0.01). `#000` y `#fff` están prohibidos por contrato.

**The Recessed-Sidebar Rule.** El sidebar va **más oscuro** que el fondo (Sidebar Recess, no Night Surface). En este sistema la jerarquía no se construye levantando elementos hacia adelante, se construye hundiendo el chrome hacia atrás.

## 3. Typography

**Body Font:** Inter (con fallback `sans-serif`).
**Mono Font:** `ui-monospace, JetBrains Mono, Cascadia Mono, Consolas, Monaco, monospace` — para snippets de código y labels técnicos.

**Character:** Inter en todos los pesos del sistema (300, 400, 500, 600, 700). Una sola familia carga todo: headings, buttons, labels, body, data. Los pesos hacen el trabajo que en otros sistemas haría un par display/body. El mono solo aparece en bloques de código real (snippet HTML, identifiers en hints como `<code>&lt;/body&gt;</code>`) y en el label "HTML" del snippet header.

### Hierarchy

- **Display** (700, 32px / 1.2): headlines de página principal. h1 raro; típicamente lo usa solo el dashboard.
- **Headline** (600, 24px / 1.3): títulos de página (`.customize-title`), h2 de secciones grandes.
- **Title** (600, 18px / 1.3): h3, modal titles, títulos de cards (`.title-page`, `.modal-title`).
- **Body** (400, 14px / 1.6): texto general, copy de párrafo, contenido de inputs. **Línea acotada a 75ch para texto técnico**, 65ch para prosa larga.
- **Label** (500, 12px / 0.4px letter-spacing): labels de input, badges, eyebrows tipo "BOTS" en breadcrumbs (NO usado en este sistema — los breadcrumbs decorativos están prohibidos).
- **Caption** (500, 11px / 1.5): contadores (12.847 / 20.000), hints, metadata de tablas.
- **Mono** (400, 12px / 1.6): snippets de código (`<pre>`), label "HTML" en snippet header (uppercase, 0.05em letter-spacing).

Números de input importante (`.input-hint` con contador) usan `font-variant-numeric: tabular-nums` para no saltar al teclear.

### Named Rules

**The Single-Family Rule.** Inter carga todo. No hay display + body pairing; la variación viene de peso y escala. Si una jerarquía nueva no se puede construir con la escala existente (11/12/14/16/18/24/32px) y los pesos disponibles, el problema no se resuelve agregando otra familia: se resuelve replanteando la jerarquía.

**The Tabular-Numbers Rule.** Cualquier número que cambie en tiempo real (contadores, métricas, timestamps en tablas) usa `font-variant-numeric: tabular-nums`. Los dígitos no saltan; el ojo no se distrae.

**The 75ch Rule.** Texto técnico (system prompts, snippets, descriptions de bots) se acota a `max-width: 75ch`. Páginas más anchas (960px+) son válidas si el contenido editable adentro respeta este límite.

## 4. Elevation

El sistema construye profundidad con **tonal layering** primero, sombras solo en overlays.

Las cuatro capas night-* son la elevación primaria: el fondo es Night Floor, las cards son Night Surface, los inputs son Night Elevated, el hover llega a Night Hover. El ojo lee jerarquía por luminosidad sin necesidad de sombras estructurales. El sidebar invierte la metáfora — recede a Sidebar Recess en lugar de levantarse.

Las sombras existen pero solo aparecen cuando algo **realmente flota** sobre el documento: dropdowns de ng-select, dialogs de Angular Material, toasts. Nunca en cards estáticas.

### Shadow Vocabulary

- **Ambient Low** (`box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4)` — `$shadow-sm`): popovers chicos, tooltips.
- **Ambient Medium** (`box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5)` — `$shadow-md`): modales internos.
- **Ambient High** (`box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6)` — `$shadow-lg`): dropdowns de ng-select, Angular Material dialogs (cuando se usen).
- **Ember Glow** (`box-shadow: 0 0 20px rgba(255, 107, 0, 0.35)` — `$shadow-glow`): existe en variables pero **se usa con extrema reserva**. Solo en momentos donde el naranja deba leerse como "spark" puntual, nunca como decoración ambiental.

### Named Rules

**The Float-Means-Float Rule.** Si el elemento no flota literalmente sobre el documento (dropdown, modal, toast), no lleva sombra. Las cards, los table-wrappers y los inputs son flat por construcción — su elevación viene del color, no del shadow.

**The Glow-Is-A-Spark Rule.** El `$shadow-glow` naranja es un evento, no un estado. No se usa para "destacar" un botón importante; solo aparece en momentos donde el spark es semánticamente correcto (focus en input crítico, confirmación de acción de alto valor). Si alguna vez está activado en más de un elemento por pantalla, hay un bug.

## 5. Components

Cada componente lidera con una línea de carácter, después spec.

### Buttons

Confiados y tight. Altura uniforme 40px (`btn-sm` 32px, `btn-lg` 48px), radio 8px (`$border-radius-sm`), padding horizontal `$spacing-lg` (24px), `font-weight: 500`, transición `0.15s ease`.

- **Shape:** radio contenido (8px). Nunca pill (excepto badges), nunca cuadrado (excepto chips de fecha si los hubiera).
- **Primary** (`btn-primary`): background Ember Orange, texto blanco. Hover → Ember Orange Bright. Active → `transform: scale(0.98)` (escala compositor-friendly, no animación de layout).
- **Secondary** (`btn-secondary`): background Night Elevated, texto Paper Foreground, borde Iron Border Strong (1px). Hover → Night Hover, borde más claro.
- **Danger** (`btn-danger`): background Signal Danger, texto blanco. Hover → 8% darker.
- **Outline** (`btn-outline`): transparente, borde Ember Orange 1px, texto Ember Orange. Hover → fondo Ember Glow.
- **Ghost** (`btn-ghost`): sin fondo, texto Smoke Foreground. Hover → fondo Night Elevated, texto Paper. Para acciones tipo "Volver" o links sutiles.
- **Icon** (`btn-icon`): circular 36×36px, background Night Elevated, borde Iron Border. Variantes `btn-icon-primary` y `btn-icon-danger` que solo cambian color en hover.
- **Disabled:** opacidad 0.45, `pointer-events: none`. No "fade out" ni greyscale; el elemento existe pero está apagado.

### Inputs / Fields

Bloques interactivos con peso visible. Background Night Elevated, borde Iron Border Strong 1px, radio 8px, alto 44px (suficiente para touch). Padding horizontal 16px.

- **Default:** texto Paper Foreground, placeholder Iron Foreground.
- **Focus:** borde cambia a Ember Orange + `box-shadow: 0 0 0 3px ember-glow`. Glow naranja al 12% como aura.
- **Disabled:** opacidad 0.5, cursor not-allowed.
- **Textarea:** alto auto con `min-height: 100px` (320px para system prompts), padding 16px en todos los lados, `resize: vertical`.
- **Errors:** patrón "error en el label". El mensaje aparece a la **derecha del label**, no debajo del input — la altura del bloque no cambia entre estado válido y inválido. Texto rojo plano (Signal Danger), sin pill, sin fondo. Implementado en `<app-input-label>`.

### Badges

Pills compactos. Radio 20px (pill completo), padding 3px 10px, `font-size: 11px`, `font-weight: 600`, `letter-spacing: 0.4px`. Llevan un punto de color (`::before` 6×6px circle) heredando `currentColor` que hace de indicador visual antes del texto.

- **Success / Danger / Warning / Info**: tinte 12% del color base + texto al color base. Patrón consistente.
- **Primary**: Ember Glow + Ember Orange (badge "Bot" en conversaciones).
- **Pending**: gris suave sobre rgba(148, 163, 184, 0.12).

### Tabs

Patrón ARIA Authoring Practices completo: `role="tablist"`, `role="tab"`, `aria-selected`, roving tabindex, navegación por flechas/Home/End. Visualmente, tabs flush-left sin padding horizontal (solo vertical 8px) con underline 2px Ember Orange en el activo. El border-bottom del active overlap el border del tablist con `margin-bottom: -1px` para que se vea continuo.

Las tabs son `<a routerLink>` cuando son navegación real (página customize-bot), `<button>` cuando son state local. Ambas comparten estilo.

Focus visible: `outline: 2px solid ember-focus, outline-offset: 4px`.

### Cards / Containers

Background Night Surface, borde Iron Border 1px, radio 12px (`$border-radius`). Sin sombra (ver Float-Means-Float Rule). Internal padding `$spacing-lg` (24px) por defecto. Cards anidadas están **prohibidas**.

### Tables

Reutilizadas via `<app-table>` shared. Background Night Surface, header en Smoke Foreground (label-style: uppercase, letter-spacing 0.4px), rows separadas por Iron Border, hover en Night Hover. Skeleton shimmer durante loading (no spinner central). Paginación abajo, controles de filter/add/edit/delete arriba.

### Snippet Block (signature component)

Bloque para mostrar código copiable. Background Night Elevated, borde Iron Border, radio 12px, `overflow: hidden`. Tres partes:

1. **Header** (`.snippet-header`): row flex con label "HTML" en mono uppercase a la izquierda + botón Copiar a la derecha. Background Night Surface, borde inferior Iron Border.
2. **Code** (`.snippet-code`): `<pre>` con `font-family: mono`, `font-size: 12px`, `line-height: 1.7`, `white-space: pre`, `overflow-x: auto`. Sin `word-break: break-all` (esa es la trampa que destroza identificadores).
3. **Copy button**: `btn-secondary btn-sm` con icono `content_copy` que cambia a `check` durante 2s tras click. `aria-live="polite"` en el span del label.

Restricción: `max-width: 75ch` para que el código sea legible sin scroll horizontal en líneas razonables.

### Sidebar

Background Sidebar Recess (`#05060D` — más oscuro que el fondo). Width 220px en desktop, colapsable a hamburger en mobile. Nav items con icono + label, hover y active states en Night Hover y Ember Glow respectivamente. User info + logout en footer del sidebar.

### Named Rules

**The 1px-Border Rule.** Bordes son siempre 1px. El único border más grueso autorizado es el `border-bottom: 2px` de la tab activa (porque ahí el grosor es la afirmación). Cualquier `border-left/right > 1px` es side-stripe = prohibido por contrato.

**The 44px Touch Rule.** Inputs, dropdowns y botones primarios tienen al menos 44px de alto en mobile (`@media max-width: 640px`). Las tabs en mobile suben a `padding: $spacing-md` (16px vertical) por la misma razón.

## 6. Do's and Don'ts

### Do

- **Do** usar la escala `night-floor / surface / elevated / hover` como elevación primaria; las sombras solo aparecen en lo que realmente flota.
- **Do** reservar Ember Orange para los cuatro lugares donde cumple función: CTA primario, tab activa, focus ring, badge primary. En cualquier otro lugar, usar peso o tamaño.
- **Do** acotar texto técnico (system prompts, snippets, descriptions) a `max-width: 75ch`. La página puede ser ancha; el contenido editable se acota.
- **Do** componer páginas full-width con padding generoso (`$spacing-lg $spacing-xl`) que llenen el área del admin shell. Lo editable se acota internamente.
- **Do** construir tabs con el patrón ARIA tablist completo (`role`, `aria-selected`, roving tabindex, flechas) y, si son navegación real, usar `<a routerLink>`.
- **Do** poner labels visibles siempre. Los placeholders son una pista, no un sustituto de la etiqueta.
- **Do** usar `font-variant-numeric: tabular-nums` en cualquier contador en tiempo real.
- **Do** preferir páginas dedicadas sobre modales para flujos de configuración densos. La página customize-bot reemplazó al modal por exactamente esta razón.

### Don't

- **Don't** usar `#000` ni `#fff` puros. Todos los neutros van tintados hacia el azul-violeta de marca (`night-*`, `paper-foreground`, `smoke-foreground`).
- **Don't** pintar nombres de entidad en `<strong>` con color de marca dentro de headings ("Personalizar bot **Bot1**" en naranja brillante = prohibido). El color naranja es acento puntual, nunca decoración.
- **Don't** usar `border-left` o `border-right > 1px` como acento coloreado en cards, list items, callouts o alerts. Es la trampa SaaS clásica. Reescribir con borde completo, background tint, o nada.
- **Don't** usar gradient text (`background-clip: text` con gradiente). Ni en headings, ni en CTAs, ni en métricas.
- **Don't** usar glassmorphism decorativo (frosted glass por estética). Si aparece blur, debe tener función (separar overlay del fondo, indicar disabled).
- **Don't** componer "hero metric grids" — número gigante + label chico + sparkline en cuadrillas idénticas. Cliché SaaS.
- **Don't** usar gradientes púrpura tipo Stripe. El sistema tiene naranja, no morado.
- **Don't** abrir un modal antes de evaluar inline / drawer / página dedicada. Modal es último recurso.
- **Don't** usar clichés visuales del rubro chatbot: neón cyan, robots, burbujas decorativas, mascots.
- **Don't** componer páginas con `max-width` chico (< 1000px) centradas con `margin: 0 auto` en pantallas wide. Lee como producto inacabado. La página llena el shell; el contenido se acota.
- **Don't** usar `word-break: break-all` en snippets de código. Destroza identificadores y URLs. Usar `overflow-x: auto` en `<pre>`.
- **Don't** usar sticky footer con `linear-gradient` para botones de form. Patrón sobreingeniería; los botones van en flujo normal alineados a la derecha del input que sirven.
- **Don't** anidar cards. Cards dentro de cards = wrong. Si necesitás separación dentro de un card, usá un divider 1px Iron Border.
- **Don't** usar em dashes en copy. Usar comas, dos puntos, punto y coma, paréntesis o punto.
- **Don't** usar exclamaciones en feedback de UI ("¡Copiado!" → "Copiado"). La voz es directa y técnica, no efusiva.
