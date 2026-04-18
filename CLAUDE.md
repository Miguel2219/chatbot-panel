# Chatbot Panel — Guía del desarrollador

Frontend Angular 18 del proyecto `chatbot-saas`. Se conecta al backend Spring Boot en `http://localhost:8080`.

---

## Stack y versiones críticas

| Herramienta | Versión | Nota |
|---|---|---|
| Angular | 18 | Standalone components, control flow `@if/@for` |
| `@ng-select/ng-select` | **^13.x** | v14+ requiere Angular 19+. No actualizar |
| Angular Material | 18.x | Solo se usa para tabla, paginador, iconos, diálogos |
| ngx-toastr | latest | Notificaciones toast |
| secure-ls | latest | Encriptación AES del localStorage |

---

## Arquitectura de módulos

```
src/app/
├── core/
│   ├── guards/          auth.guard.ts, no-auth.guard.ts
│   ├── interceptors/    auth, api-prefix, http-error
│   ├── interfaces/      page.interface.ts, table.interface.ts, select.interface.ts, http-options.interface.ts
│   ├── services/        http.service.ts, auth.service.ts, storage.service.ts, loading.service.ts
│   └── utils/           endpoints.ts
├── modules/
│   ├── auth/            login
│   ├── administration/  shell layout (sidebar + header + router-outlet)
│   ├── dashboard/
│   ├── bots/
│   ├── conversations/
│   ├── leads/
│   ├── documents/
│   ├── users/           asesores/advisers
│   ├── whatsapp-config/
│   ├── roles/           gestión de roles y permisos
│   └── tenants/         solo visible para rol ADMIN
└── shared/
    ├── layouts/
    │   ├── table/            TableComponent (reutilizable en todos los módulos)
    │   ├── delete-confirm/   modal de confirmación genérico
    │   └── loading-overlay/  overlay global de carga
    └── pipes/
        └── data-type-table.pipe.ts
```

Todos los componentes son **standalone**. No existe ningún `NgModule`.

---

## Sistema de diseño — Dark Theme

### Variables SCSS (`src/assets/styles/scss/abstracts/_variables.scss`)

```scss
// Fondos (de más oscuro a más claro)
$bg-base:     #0A0B0F   // fondo global de la app
$bg-surface:  #12141A   // tarjetas, table-wrapper
$bg-elevated: #1A1D26   // inputs, ng-select
$bg-hover:    #222736   // hover states, skeleton shimmer

// Acento principal
$primary:       #7C6EFF  // morado — color de marca
$primary-hover: #6455E0
$secondary:     #5B8EFF  // azul complementario

// Textos
$text-primary:   #F1F5F9
$text-secondary: #94A3B8
$text-muted:     #475569

// Bordes
$border-color:       rgba(255,255,255,0.08)
$border-color-light: rgba(255,255,255,0.12)
$border-color-focus: rgba(124,110,255,0.5)   // focus glow en inputs
```

**Regla de uso de colores:** nunca escribir hex directamente en los partials — siempre usar las variables. El único lugar donde los valores hex están permitidos es `_variables.scss`.

### Organización SCSS (`src/assets/styles/scss/`)

El orden de importación en `main.scss` importa — las variables deben ir primero:

```
abstracts/_variables   ← primero siempre
base/_typography
base/_base
themes/_theme          ← overrides de Angular Material
components/            _buttons, _badges, _cards
layout/                _forms, _tables
pages/                 uno por módulo
modals/                uno por modal
```

Se usa `@import` (no `@use`) para que las variables sean accesibles en todos los partials sin re-importar.

### Clases CSS globales importantes

**Botones** (en `_buttons.scss`):
- `.btn .btn-primary` — botón principal morado
- `.btn .btn-secondary` — botón secundario gris
- `.btn .btn-danger` — botón rojo
- `.btn-icon` — circular, 36×36px (para íconos sueltos)
- `.btn-icon-primary` / `.btn-icon-danger` — variantes de color para acciones en tabla
- `.btn .btn-sm` — versión pequeña (usada en toolbar de tabla)

**Badges** (en `_badges.scss`):
- `.badge-success`, `.badge-danger`, `.badge-warning`, `.badge-info`, `.badge-pending`

**Formularios** (en `_forms.scss`):
- `.input-group` + `.input-label` + `.input-error` — patrón estándar de campo
- `.ng-select-module` — ng-select en páginas de módulo (filtro de bot)
- `.ng-select-modal` — ng-select dentro de modales

---

## Convenciones de código

### Nomenclatura de servicios privados

```typescript
private _http: HttpService        // guión bajo + camelCase
private _auth: AuthService
private _loader: LoadingService
private _toastr: ToastrService
```

### Servicios HTTP — usar siempre `HttpService`, nunca `HttpClient` directo

```typescript
// GET sin params
this._http.get<T>(EndPoints.ALGO)

// GET con paginación
this._http.get<Page<T>>(EndPoints.ALGO, false, this._http.addParams(params))

// POST
this._http.post<RequestDto, ResponseDto>(EndPoints.ALGO, payload)

// PUT
this._http.put<RequestDto, ResponseDto>(EndPoints.ALGO + id, payload)

// DELETE
this._http.delete<void>(EndPoints.ALGO + id)

// Subir archivo (FormData — usa Bearer token directo, sin Content-Type)
this._http.postFormData<ResponseDto>(EndPoints.ALGO, formData)
```

El `ApiPrefixInterceptor` prepend `environment.api` (`http://localhost:8080`) a cada request automáticamente.
El `AuthInterceptor` agrega `Bearer <token>` salvo que se pase `clearAuthorization = true` (solo login/register).

### Endpoints — siempre en `endpoints.ts`

```typescript
export const enum EndPoints {
  BOT            = '/api/bot/',
  BOTS_BY_TENANT = '/api/bot/get_bots_by_tenant/',
  // ...
}
```

Nunca escribir URLs hardcodeadas en servicios.

### Storage — siempre via `StorageService`

```typescript
this._storage.setItem('access_token', token);
this._storage.getItem<string>('access_token');
this._storage.removeAll();
```

Usa `SecureLS` con AES. Nunca llamar `localStorage` directamente.

### Tenant ID

```typescript
// Leer el tenant del usuario autenticado:
this._auth.getTenantId()
```

Almacenado en storage tras el login. No vive en el JWT — viene en el body del response de `/api/auth/login`.

---

## TableComponent — uso correcto

### Inputs obligatorios

```typescript
[tableColumns]="tableColumns"   // definición de columnas
[tableData]="items"             // array de datos
[totalElements]="totalElements" // total del backend (para paginador)
[actions]="actions"             // { add, edit, delete, search }
```

### Inputs opcionales

```typescript
[isLoading]="isLoading"   // muestra skeleton shimmer
[isPageable]="isPageable" // muestra paginador (true si totalElements > size)
[pageIndex]="pageIndex"   // página actual (viene de Page.number)
[pageSize]="size"         // registros por página (viene de Page.size)
[addActionName]="'Texto'" // texto del botón Nuevo (default: 'Nuevo')
```

### Outputs

```typescript
(add)="abrirModal()"
(edit)="abrirModal($event)"       // $event = fila completa
(delete)="confirmarEliminar($event)"
(filter)="cargarDatos($event)"    // $event = HttpParams con offset/limit/order_by/order
```

### Tipos de columna (`dataType`)

| Valor | Resultado |
|---|---|
| `'text'` | texto plano |
| `'date'` | formato `dd/MM/yyyy` |
| `'dateTime'` | formato `dd/MM/yyyy HH:mm` |
| `'boolean'` | badge verde/rojo Activo/Inactivo |
| `'status'` | badge con mapeo de estados del backend |
| `'badge'` | igual que status |
| `'currency'` | formato moneda |

### Definición de columnas

```typescript
tableColumns: TableColumn[] = [
  { name: 'Nombre', key: 'name',       isSortable: true, dataType: 'text' },
  { name: 'Estado', key: 'is_active',                    dataType: 'boolean' },
  { name: 'Fecha',  key: 'created_at', isSortable: true, dataType: 'date' },
];
```

El `key` debe coincidir exactamente con el nombre del campo en el objeto que retorna el backend (snake_case si el backend usa `@JsonProperty` con snake_case).

---

## Paginación — convención de parámetros

Los controladores del backend reciben:

| Param | Default | Descripción |
|---|---|---|
| `offset` | `0` | número de página |
| `limit` | `10` | registros por página |
| `order_by` | campo de fecha | campo de ordenamiento |
| `order` | `desc` | dirección (`asc`/`desc`) |

El `TableComponent.emitFilter()` ya genera estos params automáticamente. El patrón en el componente padre:

```typescript
items: T[] = [];
totalElements = 0;
isPageable = false;
size = 0;
pageIndex = 0;
isLoading = false;

loadItems(params: HttpParams = new HttpParams()): void {
  this.isLoading = true;
  this._service.getItems(params).subscribe({
    next: (data) => {
      this.items = data.content;
      this.totalElements = data.totalElements;
      this.size = data.size;
      this.pageIndex = data.number;
      this.isPageable = data.totalElements > data.size;
      this.isLoading = false;
    },
    error: () => { this.isLoading = false; },
  });
}
```

```html
<app-table
  [tableData]="items"
  [totalElements]="totalElements"
  [isPageable]="isPageable"
  [pageIndex]="pageIndex"
  [pageSize]="size"
  [isLoading]="isLoading"
  (filter)="loadItems($event)">
</app-table>
```

---

## Sistema de loaders — 3 niveles

### Nivel 1 — Global overlay (mutaciones)

```typescript
// Usar para: crear, actualizar, eliminar, subir archivos
this._loader.show();
this._servicio.operacion().subscribe({
  next: () => { this._loader.hide(); },
  error: () => { this._loader.hide(); },
});
```

El `LoadingOverlayComponent` está montado en el layout principal y escucha automáticamente.

### Nivel 2 — Module loader (módulos con ng-select + tabla)

Para evitar mostrar el ng-select vacío mientras los bots cargan:

```typescript
isInitializing = true;

ngOnInit(): void {
  this._botService.getBotsByTenantSelect().subscribe({
    next: (bots) => {
      this.bots = bots;
      this.isInitializing = false;   // ← antes de cargar datos de tabla
      if (bots.length > 0) {
        this.selectedBotId = bots[0].value;
        this.loadDatos();
      }
    },
    error: () => { this.isInitializing = false; },
  });
}
```

```html
@if (isInitializing) {
  <div class="module-loading">
    <div class="loader-ring"></div>
  </div>
} @else {
  <!-- ng-select + app-table -->
}
```

### Nivel 3 — Table skeleton (fetch de datos)

Solo agregar `isLoading = true/false` al fetch y pasarlo al `app-table` con `[isLoading]="isLoading"`. La tabla reemplaza sus filas por skeleton shimmer automáticamente.

---

## Modales — patrón estándar

```typescript
// Abrir desde el componente padre:
const ref = this._dialog.open(MiModalComponent, {
  width: '520px',
  autoFocus: false,
  data: { /* datos opcionales */ },
});
ref.afterClosed().subscribe(result => {
  if (result) this.recargarDatos();
});

// Dentro del modal:
constructor(
  private _dialogRef: MatDialogRef<MiModalComponent>,
  @Inject(MAT_DIALOG_DATA) public data: { /* tipo */ },
) {}

close(success = false): void {
  this._dialogRef.close(success);
}
```

Los modales siempre cierran con `true` (éxito) o `false`/sin argumento (cancelar).

---

## Bot selector — patrón de módulos con filtro

Los módulos que filtran por bot (conversations, leads, documents, whatsapp-config) usan `getBotsByTenantSelect()`, no `getBotsByTenant()`:

```typescript
// Retorna Select[] = { label: string; value: string }[]
// value = bot_id, label = nombre del bot
this._botService.getBotsByTenantSelect().subscribe(...)
```

En el template, siempre con la clase `ng-select-module`:

```html
<ng-select
  class="ng-select-module"
  [items]="bots"
  bindValue="value"
  bindLabel="label"
  [(ngModel)]="selectedBotId"
  (change)="onBotChange()"
  [clearable]="false"
  placeholder="Selecciona un bot">
</ng-select>
```

---

## Angular.json — estilos globales

El orden importa:

```json
"styles": [
  "@angular/cdk/overlay-prebuilt.css",
  "node_modules/@ng-select/ng-select/themes/default.theme.css",
  "src/styles.scss"
]
```

`@angular/cdk/overlay-prebuilt.css` es **obligatorio** — sin él, los modales y dropdowns se renderizan fuera del viewport (en el flujo del documento en lugar de `position: fixed`).

---

## Archivos que NO se deben tocar sin entender el impacto

| Archivo | Razón |
|---|---|
| `src/assets/styles/scss/abstracts/_variables.scss` | Cambiar colores afecta toda la app |
| `src/assets/styles/scss/main.scss` | El orden de imports es intencional |
| `src/app/core/interceptors/` | Tocar el AuthInterceptor puede romper la autenticación |
| `src/app/shared/layouts/table/table.component.ts` | Es el componente central de todos los módulos |
| `src/app/core/services/http.service.ts` | Todos los servicios dependen de él |
| `angular.json` (styles array) | Ver sección anterior |
