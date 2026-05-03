# Product

## Register

product

## Users

Tres roles, todos en desktop, en escritorio de oficina (uso prolongado, no on-the-go):

- **ADMIN (Zolvion interno):** 1-2 personas que gestionan tenants y supervisan el SaaS completo. Sesiones cortas pero frecuentes, vistas globales (dashboards multi-tenant, quotas).
- **TENANT_OWNER (cliente dueño de cuenta):** configura su bot, gestiona usuarios de su empresa, edita el `system_prompt`, instala el widget. Setup inicial intenso + ajustes semanales.
- **USER (asesor/empleado del cliente):** atiende leads asignados por el bot, lee conversaciones, marca estados. Panel abierto **4-8h al día**. Tasks repetitivas intercaladas con configuración esporádica.

Contexto compartido: B2B, uso interno empresarial, no consumer. Densidad de información alta — son power users que viven en el panel.

## Product Purpose

Panel de control multi-tenant para una plataforma SaaS de chatbots con IA (Zolvion). Permite a las empresas crear y configurar bots conversacionales (system_prompt, documentos de contexto, integración WhatsApp), gestionar leads capturados por el bot, supervisar conversaciones en tiempo real y administrar usuarios/permisos por tenant.

Éxito = el TENANT_OWNER configura un bot funcional en una sesión sin asistencia, los USER trabajan leads sin sentir fricción durante 8h, ADMIN supervisa multi-tenant sin perder de vista quotas y salud del sistema.

## Brand Personality

**Nocturno · Decidido · Técnico.**

Paleta dark con commitment real (no dark "por moda"): fondos `night-` (#0A0A1A → #1A1C33), acento naranja eléctrico Zolvion (#FF6B00) sobre la base oscura. Voz directa, en español neutro, sin disclaimers innecesarios. Tipografía tight, jerarquías por escala y peso (no por decoración).

Match aspiracional: densidad de Linear, oscuridad comprometida de Vercel dashboard, formularios densos sin abrumar al estilo Raycast settings. Nada juguetón, nada corporate-genérico.

## Anti-references

Lo que esto **no debe parecer**:

- **SaaS genérico tipo HubSpot/Salesforce** — cards anidadas en cards, hero metrics inflados, padding excesivo, todo igual de espaciado.
- **Glassmorphism decorativo** — frosted glass por estética, blurs sin función.
- **Gradient text** (`background-clip: text`) — nunca, ni en headings ni en CTAs.
- **Hero-metric grids** tipo "+45% MRR" en cuadrillas idénticas con número gigante + label pequeño + sparkline.
- **Stripe-style gradientes púrpuras** — el morado está, pero no en gradientes decorativos.
- **Modal as first instinct** — los modales son último recurso, no la respuesta default a "¿dónde pongo este formulario?".
- **Side-stripe borders coloreados** — `border-left: 4px solid color` como decoración en cards/alerts/list items. Prohibido por contrato.
- **Cliché AI/chatbot** — neón cyan, robots, burbujas de chat decorativas, mascots.
- **Colores corporativos típicos** — navy + dorado fintech, teal healthcare, etc.

## Design Principles

1. **Densidad sobre aire.** Los usuarios viven 8h en el panel y son power users — priorizar información visible sobre whitespace generoso. Aire calculado, no por defecto.
2. **Compromiso con la oscuridad.** Dark theme real, no un toggle. Tintar neutros hacia el azul-violeta de marca; nunca usar `#000` o `#fff` puros. Naranja eléctrico es acento puntual, no decoración global.
3. **Formularios como ciudadanos de primera.** El TENANT_OWNER pasa horas en formularios de configuración — labels visibles (nunca solo placeholders), focus states evidentes, errores claros, navegación por teclado fluida.
4. **Jerarquía por tipografía y escala, no por color decorativo.** Pesos y tamaños comunican importancia. El color se reserva para semántica (estado, error, éxito) y acento puntual.
5. **Modales son último recurso.** Antes de abrir un modal: ¿inline edit? ¿drawer? ¿página dedicada? Si el modal es inevitable, debe sentirse intencional — no un contenedor de fallback.

## Accessibility & Inclusion

Sin requerimientos legales formales (B2B, uso interno), pero target operativo:

- **WCAG AA mínimo**: contraste ≥ 4.5:1 para texto, ≥ 3:1 para componentes de UI y bordes informativos.
- **Focus visible obligatorio** en todos los elementos interactivos (los power users navegan con teclado).
- **Navegación por teclado completa** en formularios densos — Tab order coherente, atajos donde aporten.
- **Zoom hasta 200%** sin layout roto. Base de 14px es aceptable.
- **Motion sutil** — el panel está abierto 8h, animaciones bruscas cansan. Easing exponencial, duraciones cortas, respetar `prefers-reduced-motion`.
- **Labels visibles** siempre, no solo placeholders (se pierden al empezar a tipear).
- **HTML semántico** por defecto, aunque no se haga testing formal con screen readers.
