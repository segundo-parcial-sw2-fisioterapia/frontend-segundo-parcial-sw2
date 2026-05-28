# Guía de control de visibilidad por roles

## Roles del sistema

| Valor literal | Descripción |
|---|---|
| `administrador` | Acceso total |
| `fisioterapeuta` | Gestión clínica completa |
| `recepcionista` | Agenda, pacientes y personas |
| `director` | Lectura de reportes y sesiones |
| `contador` | Módulos financieros |
| `paciente` | Vistas propias (ejercicios, sesiones domiciliarias) |

---

## Método `auth.tieneRoles()`

El servicio `LoginService` expone `tieneRoles(...roles: string[]): boolean`.

- Decodifica el JWT almacenado en `localStorage` sin librería externa.
- Comprobación **estricta y literal**: `'administrador'` no coincide con `'ADMINISTRADOR'`.
- Lógica **OR**: retorna `true` si el usuario tiene **al menos uno** de los roles indicados.
- Sin bypass de administrador: cada rol se evalúa de forma independiente.

---

## Pasos para usar `*ngIf` en un componente standalone

### 1. Inyectar `LoginService` como `auth` público en el componente

```typescript
import { NgIf } from '@angular/common';
import { LoginService } from '../../../nucleo/rest/login.service';

@Component({
  imports: [NgIf /* ... otros imports */],
})
export class MiComponente {
  auth = inject(LoginService);   // público para que el template lo acceda
}
```

### 2. Usar `*ngIf` en el template

```html
<!-- Un solo rol -->
<button *ngIf="auth.tieneRoles('administrador')" (click)="crear()">
  Nuevo registro
</button>

<!-- Varios roles (OR): visible si tiene cualquiera de los dos -->
<button *ngIf="auth.tieneRoles('administrador', 'recepcionista')" (click)="crear()">
  Nuevo Paciente
</button>

<!-- Ocultar sección entera según rol -->
<div *ngIf="auth.tieneRoles('paciente')">
  <h2>Mi Perfil</h2>
</div>

<!-- Mostrar solo a director y administrador -->
<section *ngIf="auth.tieneRoles('director', 'administrador')">
  KPIs ejecutivos
</section>
```

---

## Alternativa con sintaxis `@if` (sin importar NgIf)

Angular 17+ incluye control de flujo nativo. No requiere `NgIf` en `imports`.

```html
@if (auth.tieneRoles('administrador')) {
  <button (click)="eliminar()">Eliminar</button>
}

@if (auth.tieneRoles('fisioterapeuta', 'administrador')) {
  <app-sesion-form />
}
```

> Usa `@if` en componentes que ya usan `@for` / `@switch` (como el Sidebar).
> Usa `*ngIf` en componentes que prefieran la sintaxis de directivas estructurales.

---

## Tabla de acciones por módulo

### Gestión Clínica

| Módulo | Botón / Acción | Roles que lo ven |
|---|---|---|
| Pacientes | Nuevo Paciente | `administrador`, `recepcionista` |
| Pacientes | Editar | `administrador`, `recepcionista`, `fisioterapeuta` |
| Pacientes | Eliminar | `administrador` |
| Pacientes | Alta Médica | `administrador`, `fisioterapeuta` |
| Citas | Nueva Cita | `administrador`, `recepcionista` |
| Citas | Confirmar | `administrador`, `recepcionista`, `fisioterapeuta` |
| Citas | Cancelar | `administrador`, `recepcionista` |
| Citas | Eliminar | `administrador` |
| Ejercicios | Nuevo / Editar | `administrador`, `fisioterapeuta` |
| Ejercicios | Eliminar | `administrador` |
| Evaluaciones | Nueva / Editar | `fisioterapeuta`, `administrador` |
| Evaluaciones | Eliminar | `administrador` |
| Planes Tratamiento | Nuevo / Editar | `fisioterapeuta`, `administrador` |
| Planes Ejercicios | Nuevo / Editar | `fisioterapeuta`, `administrador` |
| Sesiones | Nueva / Editar / Cerrar y Firmar | `fisioterapeuta` |
| Sesiones | Eliminar | `administrador` |
| Ses. Domiciliarias | Nueva | `paciente`, `fisioterapeuta` |
| Ses. Domiciliarias | Editar | `fisioterapeuta`, `administrador` |
| Personas | Nueva / Editar | `administrador`, `recepcionista` |
| Personas | Eliminar | `administrador` |
| Usuarios | Todas las acciones | `administrador` |

### Gestión Administrativa

| Módulo | Botón / Acción | Roles que lo ven |
|---|---|---|
| Empleados | Ver listado | `administrador`, `director`, `contador` |
| Empleados | Crear / Editar / Eliminar | `administrador` |
| Inventario | Ver listado | `administrador`, `director`, `recepcionista`, `fisioterapeuta` |
| Inventario | Crear / Editar | `administrador`, `recepcionista` |
| Facturas / Pagos | Ver | `administrador`, `director`, `contador`, `recepcionista` |
| Facturas / Pagos | Crear / Editar | `administrador`, `recepcionista`, `contador` |
| Nóminas | Ver | `administrador`, `director`, `contador` |
| Nóminas | Crear / Editar | `administrador`, `contador` |

---

## Ejemplo completo — componente con varios botones

```typescript
// citas.ts
@Component({
  imports: [NgIf, /* ... */],
})
export class Citas {
  auth = inject(LoginService);
}
```

```html
<!-- citas.html -->
<div class="flex gap-2">
  <!-- Solo recepcionista y administrador pueden crear citas -->
  <button *ngIf="auth.tieneRoles('administrador', 'recepcionista')"
          (click)="abrirCrear()" class="btn-primary">
    Nueva Cita
  </button>
</div>

<app-tabla
  [columnas]="columnas"
  [filas]="citas()"
  (ver)="abrirVer($event)"
  (editar)="abrirEditar($event)"
  (eliminar)="eliminarCita($event)"
/>
```

> Para ocultar los botones de editar/eliminar dentro de `app-tabla`, pasa un `Input`
> desde el smart component:
> ```html
> <app-tabla
>   [puedeEditar]="auth.tieneRoles('administrador', 'recepcionista', 'fisioterapeuta')"
>   [puedeEliminar]="auth.tieneRoles('administrador')"
> />
> ```
