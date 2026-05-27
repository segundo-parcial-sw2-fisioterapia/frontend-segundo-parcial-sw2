# Estándar de Codificación — Frontend Angular 20
**Proyecto:** ERP para Centro de Rehabilitación y Fisioterapia | **Materia:** SW2 | **Subsistema:** Gestión Clínica (`gestion-clinica`)

> **Contexto:** Este estándar aplica al frontend web del ERP de Fisioterapia desarrollado en Angular 20. Un ERP (Enterprise Resource Planning) centraliza la gestión operativa del centro: pacientes, citas, sesiones, evaluaciones, planes de tratamiento y ejercicios. Cada módulo del ERP se refleja en una carpeta dentro de `modulos/gestion-clinica/` y expone operaciones CRUD completas (crear, listar, editar, ver detalle, eliminar).

---

## 1. Tecnologías y Versiones

| Tecnología | Uso |
|---|---|
| Angular 20 | Framework principal, sin sufijo `Component` en clases |
| Tailwind 4 CSS | Estilos de layout y utilidades generales |
| CSS por componente | Solo estilos muy específicos o animaciones no cubiertas por Tailwind |
| Apollo Client / GraphQLService | Peticiones GraphQL centralizadas en `nucleo/graphql` |

> **Regla:** Usar Tailwind para el 90% del estilo. El archivo `.css` del componente solo se usa cuando Tailwind no alcanza (animaciones keyframe, pseudo-elementos complejos).

---

## 2. Arquitectura de Carpetas

```
src/app/
├── layout/                        # Layout principal (navbar + sidebar + main)
│   ├── layout.ts
│   ├── layout.html
│   ├── layout.css
│   ├── navbar/
│   │   ├── navbar.ts
│   │   ├── navbar.html
│   │   └── navbar.css
│   └── sidebar/
│       ├── sidebar.ts
│       ├── sidebar.html
│       └── sidebar.css
│
├── compartido/                    # Componentes reutilizables globales
│   ├── tabla/                     # ← UN SOLO diseño de tabla para todo el ERP
│   │   ├── tabla.ts
│   │   ├── tabla.html
│   │   └── tabla.css
│   ├── modal/                     # ← Wrapper de modal reutilizable
│   │   ├── modal.ts
│   │   └── modal.html
│   ├── badge-semaforo/
│   ├── boton-accion/
│   └── pipes/
│
├── nucleo/
│   ├── graphql/
│   │   ├── graphql.service.ts     # Cliente GraphQL base/ejemplo
│   │   └── gestion-clinica/       # Un servicio por entidad
│   │       ├── ejercicios.ts
│   │       ├── pacientes.ts
│   │       ├── citas.ts
│   │       └── ...
│   ├── guards/
│   └── rest/
│
├── modulos/
│   └── gestion-clinica/           # Subsistema de gestión clínica del ERP
│       ├── personas/              # ← Ejemplo de módulo completo
│       │   ├── personas.ts        # Smart: lista + tabla + botones de acción
│       │   ├── personas.html
│       │   ├── personas.css
│       │   ├── crear-personas/    # Sub-componente: formulario de creación
│       │   │   ├── crear-personas.ts
│       │   │   ├── crear-personas.html
│       │   │   └── crear-personas.css
│       │   ├── editar-personas/   # Sub-componente: formulario de edición
│       │   │   ├── editar-personas.ts
│       │   │   ├── editar-personas.html
│       │   │   └── editar-personas.css
│       │   └── ver-personas/      # Sub-componente: detalle (MODAL)
│       │       ├── ver-personas.ts
│       │       ├── ver-personas.html
│       │       └── ver-personas.css
│       ├── ejercicios/
│       │   ├── ejercicios.ts
│       │   ├── ejercicios.html
│       │   ├── ejercicios.css
│       │   ├── crear-ejercicios/
│       │   ├── editar-ejercicios/
│       │   └── ver-ejercicios/
│       ├── pacientes/
│       ├── citas/
│       └── ...
│
└── enviroment/
```

---

## 2.1 Convención de Nomenclatura de Sub-componentes (OBLIGATORIO)

Cada módulo del ERP **debe contener obligatoriamente** los siguientes sub-componentes. El nombre sigue el patrón `[prefijo]-[nombre-carpeta-padre]`:

| Sub-componente | Prefijo | Propósito | Tipo |
|---|---|---|---|
| `[entidad].ts` | *(sin prefijo)* | **Componente padre / Smart.** Lista todos los registros mediante la tabla compartida. Contiene los botones de acción (Crear, Editar, Ver, Eliminar). | Smart (Inteligente) |
| `crear-[entidad]/` | `crear-` | Formulario de **creación** de un nuevo registro. | Dumb (Tonto) |
| `editar-[entidad]/` | `editar-` | Formulario de **edición** de un registro existente. Recibe el registro por `@Input()`. | Dumb (Tonto) |
| `ver-[entidad]/` | `ver-` | Vista de **detalle** de un registro por ID. **Siempre se implementa como Modal.** | Dumb (Tonto) — Modal |

### Ejemplo aplicado: módulo `personas/`

```
personas/
├── personas.ts            ← Smart: tabla con lista de todas las personas + botones
├── personas.html
├── personas.css
├── crear-personas/        ← Dumb: formulario para registrar una nueva persona
│   ├── crear-personas.ts
│   ├── crear-personas.html
│   └── crear-personas.css
├── editar-personas/       ← Dumb: formulario para editar datos de una persona
│   ├── editar-personas.ts
│   ├── editar-personas.html
│   └── editar-personas.css
└── ver-personas/          ← Dumb MODAL: muestra el detalle completo de una persona
    ├── ver-personas.ts
    ├── ver-personas.html
    └── ver-personas.css
```

### Reglas estrictas

1. **El componente padre (`personas.ts`) es para listar.** Contiene la tabla, los botones de acción y orquesta la apertura de los sub-componentes. No renderiza formularios directamente.
2. **`crear-[entidad]` y `editar-[entidad]` son formularios independientes.** Pueden renderizarse dentro del componente padre o dentro de un modal wrapper de `compartido/modal/`.
3. **`ver-[entidad]` es siempre un Modal.** Usa el componente `app-modal` de `compartido/modal/`. Muestra todos los campos del registro de forma legible (no editable).
4. **Los tres sub-componentes son OBLIGATORIOS** para todo módulo del ERP, independientemente de la complejidad del formulario.
5. **El sufijo siempre es el nombre de la carpeta padre.** Si la carpeta padre es `ejercicios/`, los sub-componentes se llaman `crear-ejercicios`, `editar-ejercicios`, `ver-ejercicios`.

---

## 3. Patrón Smart / Dumb (Inteligente / Tonto)

### 3.1 Componente Inteligente (Smart)

- Vive en la raíz del módulo: `modulos/gestion-clinica/ejercicios/ejercicios.ts`
- **Única responsabilidad:** inyectar servicios, manejar estado, llamar al backend
- No contiene lógica de presentación compleja
- Pasa datos a los componentes tontos mediante `@Input()`
- Recibe eventos de los tontos mediante `@Output()`

```typescript
// modulos/gestion-clinica/ejercicios/ejercicios.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { EjerciciosService } from '../../../nucleo/graphql/gestion-clinica/ejercicios';
import { EjercicioLista } from './componentes/ejercicio-lista/ejercicio-lista';
import { EjercicioForm } from './componentes/ejercicio-form/ejercicio-form';

@Component({
  selector: 'app-ejercicios',
  imports: [EjercicioLista, EjercicioForm],
  templateUrl: './ejercicios.html',
  styleUrl: './ejercicios.css',
})
export class Ejercicios implements OnInit {
  private ejerciciosService = inject(EjerciciosService);

  /** Lista de ejercicios obtenida del backend */
  ejercicios = signal<any[]>([]);
  cargando = signal(false);
  modalAbierto = signal(false);
  ejercicioSeleccionado = signal<any | null>(null);

  ngOnInit(): void {
    this.cargarEjercicios();
  }

  /** Carga todos los ejercicios del catálogo terapéutico */
  cargarEjercicios(): void {
    this.cargando.set(true);
    this.ejerciciosService.listarEjercicios().subscribe({
      next: (datos) => {
        this.ejercicios.set(datos);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  /** Abre el modal de creación/edición */
  abrirModal(ejercicio?: any): void {
    this.ejercicioSeleccionado.set(ejercicio ?? null);
    this.modalAbierto.set(true);
  }

  /** Elimina un ejercicio por su ID */
  eliminarEjercicio(id: number): void {
    this.ejerciciosService.eliminarEjercicio(id).subscribe({
      next: () => this.cargarEjercicios(),
    });
  }

  /** Guarda (crea o edita) un ejercicio */
  guardarEjercicio(datos: any): void {
    const operacion = datos.id
      ? this.ejerciciosService.editarEjercicio(datos)
      : this.ejerciciosService.crearEjercicio(datos);

    operacion.subscribe({
      next: () => {
        this.modalAbierto.set(false);
        this.cargarEjercicios();
      },
    });
  }
}
```

### 3.2 Componente Tonto (Dumb)

- Vive en `componentes/` dentro del módulo
- **Solo presenta datos**, no inyecta servicios del backend
- Recibe datos por `@Input()` y emite eventos por `@Output()`
- Puede dividirse en sub-componentes si el template supera ~100 líneas

```typescript
// modulos/gestion-clinica/ejercicios/componentes/ejercicio-lista/ejercicio-lista.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Tabla } from '../../../../../compartido/tabla/tabla';

@Component({
  selector: 'app-ejercicio-lista',
  imports: [Tabla],
  templateUrl: './ejercicio-lista.html',
})
export class EjercicioLista {
  /** Lista de ejercicios a mostrar */
  @Input() ejercicios: any[] = [];

  /** Indica si está cargando datos */
  @Input() cargando = false;

  /** Emite el ejercicio a editar */
  @Output() editar = new EventEmitter<any>();

  /** Emite el ID del ejercicio a eliminar */
  @Output() eliminar = new EventEmitter<number>();

  /** Columnas de la tabla compartida */
  columnas = [
    { key: 'nombre', titulo: 'Nombre' },
    { key: 'categoria_trabajo', titulo: 'Categoría' },
    { key: 'nivel_dificultad', titulo: 'Dificultad' },
    { key: 'repeticiones_sugeridas', titulo: 'Repeticiones' },
  ];
}
```

---

## 4. Servicios GraphQL (`nucleo/graphql/gestion-clinica/`)

Cada entidad tiene su propio servicio. Patrón obligatorio:

```typescript
// nucleo/graphql/gestion-clinica/ejercicios.ts
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { GraphQLService } from '../graphql.service';

@Injectable({ providedIn: 'root' })
export class EjerciciosService {
  private gql = inject(GraphQLService);

  /** Retorna el catálogo completo de ejercicios */
  listarEjercicios(): Observable<any[]> {
    return this.gql.query<{ listarEjercicios: any[] }>(`
      query {
        listarEjercicios {
          id nombre descripcion
          categoria_trabajo nivel_dificultad
          duracion_segundos repeticiones_sugeridas
          url_video_referencia
        }
      }
    `).pipe(map(d => d.listarEjercicios));
  }

  /** Busca un ejercicio por su ID */
  verEjercicio(id: number): Observable<any> {
    return this.gql.query<{ verEjercicio: any }>(`
      query($id: Int!) {
        verEjercicio(id: $id) {
          id nombre descripcion categoria_trabajo
          nivel_dificultad duracion_segundos repeticiones_sugeridas
        }
      }
    `, { id }).pipe(map(d => d.verEjercicio));
  }

  /** Filtra ejercicios por zona corporal */
  listarEjerciciosPorCategoria(categoria: string): Observable<any[]> {
    return this.gql.query<{ listarEjerciciosPorCategoria: any[] }>(`
      query($categoria: CategoriaTrabajo!) {
        listarEjerciciosPorCategoria(categoria: $categoria) {
          id nombre nivel_dificultad duracion_segundos
        }
      }
    `, { categoria }).pipe(map(d => d.listarEjerciciosPorCategoria));
  }

  /** Agrega un nuevo ejercicio al catálogo terapéutico */
  crearEjercicio(datos: any): Observable<any> {
    return this.gql.mutate<{ crearEjercicios: any }>(`
      mutation($datos: CreateEjercicioInput!) {
        crearEjercicios(datos: $datos) {
          id nombre categoria_trabajo nivel_dificultad
        }
      }
    `, { datos }).pipe(map(d => d.crearEjercicios));
  }

  /** Actualiza los datos de un ejercicio del catálogo */
  editarEjercicio(datos: any): Observable<any> {
    return this.gql.mutate<{ editarEjercicio: any }>(`
      mutation($datos: UpdateEjercicioInput!) {
        editarEjercicio(datos: $datos) {
          id nombre nivel_dificultad
        }
      }
    `, { datos }).pipe(map(d => d.editarEjercicio));
  }

  /** Elimina un ejercicio del catálogo permanentemente */
  eliminarEjercicio(id: number): Observable<any> {
    return this.gql.mutate<{ eliminarEjercicio: any }>(`
      mutation($id: Int!) {
        eliminarEjercicio(id: $id) { id nombre }
      }
    `, { id }).pipe(map(d => d.eliminarEjercicio));
  }
}
```

> **Regla:** El tipo de retorno de cada método siempre desempaqueta el wrapper GraphQL con `.pipe(map(d => d.nombreOperacion))`. El componente nunca ve la estructura `{ data: { ... } }`.

---

## 5. Componente Tabla Compartido (`compartido/tabla/`)

**Un único componente de tabla** para todo el sistema. Todos los módulos lo importan. El diseño se ajusta desde un solo punto.

```typescript
// compartido/tabla/tabla.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';

export interface ColumnaTabla {
  key: string;
  titulo: string;
  tipo?: 'texto' | 'badge' | 'fecha' | 'acciones';
}

@Component({
  selector: 'app-tabla',
  imports: [NgFor, NgIf],
  templateUrl: './tabla.html',
})
export class Tabla {
  /** Definición de columnas */
  @Input() columnas: ColumnaTabla[] = [];

  /** Datos a mostrar */
  @Input() filas: any[] = [];

  /** Muestra skeleton loader */
  @Input() cargando = false;

  /** Mensaje cuando no hay datos */
  @Input() mensajeVacio = 'No hay registros disponibles.';

  /** Habilitar columna de acciones */
  @Input() conAcciones = true;

  /** Emite la fila al hacer clic en Editar */
  @Output() editar = new EventEmitter<any>();

  /** Emite el ID al hacer clic en Eliminar */
  @Output() eliminar = new EventEmitter<any>();

  /** Resuelve el valor de una celda por su key */
  obtenerValor(fila: any, key: string): any {
    return key.split('.').reduce((obj, k) => obj?.[k], fila);
  }
}
```

```html
<!-- compartido/tabla/tabla.html -->
<div class="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
  <table class="min-w-full divide-y divide-gray-200 text-sm">
    <thead class="bg-gray-50">
      <tr>
        <th *ngFor="let col of columnas"
            class="px-4 py-3 text-left font-semibold text-gray-600 tracking-wide uppercase text-xs">
          {{ col.titulo }}
        </th>
        <th *ngIf="conAcciones"
            class="px-4 py-3 text-right font-semibold text-gray-600 tracking-wide uppercase text-xs">
          Acciones
        </th>
      </tr>
    </thead>
    <tbody class="divide-y divide-gray-100 bg-white">
      <!-- Skeleton loader -->
      <tr *ngIf="cargando" *ngFor="let i of [1,2,3,4,5]">
        <td *ngFor="let col of columnas" class="px-4 py-3">
          <div class="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
        </td>
        <td *ngIf="conAcciones" class="px-4 py-3">
          <div class="h-4 bg-gray-200 rounded animate-pulse w-16 ml-auto"></div>
        </td>
      </tr>
      <!-- Datos -->
      <tr *ngIf="!cargando" *ngFor="let fila of filas"
          class="hover:bg-blue-50 transition-colors duration-150">
        <td *ngFor="let col of columnas" class="px-4 py-3 text-gray-700">
          {{ obtenerValor(fila, col.key) ?? '—' }}
        </td>
        <td *ngIf="conAcciones" class="px-4 py-3 text-right space-x-2">
          <button (click)="editar.emit(fila)"
                  class="px-3 py-1 text-xs rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 font-medium transition">
            Editar
          </button>
          <button (click)="eliminar.emit(fila.id)"
                  class="px-3 py-1 text-xs rounded-lg bg-red-100 text-red-700 hover:bg-red-200 font-medium transition">
            Eliminar
          </button>
        </td>
      </tr>
      <!-- Sin datos -->
      <tr *ngIf="!cargando && filas.length === 0">
        <td [attr.colspan]="columnas.length + (conAcciones ? 1 : 0)"
            class="px-4 py-10 text-center text-gray-400">
          {{ mensajeVacio }}
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

---

## 6. Formulario Base Compartido (`compartido/formulario-base/`)

**Un único estilo de formulario** para todo el sistema. Se usa mediante clases CSS exportadas desde este componente o como wrapper.

### 6.1 Clases Tailwind estándar para formularios

```html
<!-- Contenedor del formulario -->
<form class="space-y-5">

  <!-- Grupo de campo -->
  <div class="flex flex-col gap-1">
    <label class="text-sm font-medium text-gray-700">Nombre del campo</label>
    <input
      class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
             text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500
             focus:border-transparent transition placeholder:text-gray-400"
      type="text"
      placeholder="Ingrese valor..."
    />
    <!-- Mensaje de error -->
    <span class="text-xs text-red-500">Campo requerido</span>
  </div>

  <!-- Select -->
  <div class="flex flex-col gap-1">
    <label class="text-sm font-medium text-gray-700">Categoría</label>
    <select class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                   text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500
                   bg-white transition">
      <option value="">Seleccione...</option>
    </select>
  </div>

  <!-- Textarea -->
  <div class="flex flex-col gap-1">
    <label class="text-sm font-medium text-gray-700">Descripción</label>
    <textarea rows="3"
      class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
             text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500
             resize-none transition">
    </textarea>
  </div>

  <!-- Botones -->
  <div class="flex justify-end gap-3 pt-2">
    <button type="button"
            class="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600
                   hover:bg-gray-50 transition font-medium">
      Cancelar
    </button>
    <button type="submit"
            class="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium
                   hover:bg-blue-700 transition disabled:opacity-50">
      Guardar
    </button>
  </div>

</form>
```

### 6.2 Componente EjercicioForm (ejemplo de formulario tonto)

```typescript
// modulos/gestion-clinica/ejercicios/componentes/ejercicio-form/ejercicio-form.ts
import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { inject } from '@angular/core';

@Component({
  selector: 'app-ejercicio-form',
  imports: [ReactiveFormsModule],
  templateUrl: './ejercicio-form.html',
})
export class EjercicioForm implements OnChanges {
  private fb = inject(FormBuilder);

  /** Ejercicio a editar (null = creación) */
  @Input() ejercicio: any | null = null;

  /** Emite los datos del formulario al guardar */
  @Output() guardar = new EventEmitter<any>();

  /** Emite señal de cancelación */
  @Output() cancelar = new EventEmitter<void>();

  form: FormGroup = this.fb.group({
    id: [null],
    nombre: ['', Validators.required],
    descripcion: [''],
    categoria_trabajo: ['', Validators.required],
    nivel_dificultad: ['', Validators.required],
    duracion_segundos: [null],
    repeticiones_sugeridas: [null],
    url_video_referencia: [''],
  });

  ngOnChanges(): void {
    if (this.ejercicio) {
      this.form.patchValue(this.ejercicio);
    } else {
      this.form.reset();
    }
  }

  /** Envía el formulario si es válido */
  enviar(): void {
    if (this.form.valid) {
      this.guardar.emit(this.form.value);
    }
  }
}
```

---

## 7. Layout (`layout/`)

El layout divide la pantalla en tres zonas fijas. Todos los módulos renderizan dentro del `<main>` mediante `<router-outlet>`.

```typescript
// layout/layout.ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './navbar/navbar';
import { Sidebar } from './sidebar/sidebar';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, Navbar, Sidebar],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout {}
```

```html
<!-- layout/layout.html -->
<div class="flex h-screen overflow-hidden bg-gray-50">
  <!-- Sidebar fijo a la izquierda -->
  <app-sidebar class="flex-shrink-0" />

  <!-- Columna derecha: navbar + contenido principal -->
  <div class="flex flex-col flex-1 overflow-hidden">
    <app-navbar />
    <main class="flex-1 overflow-y-auto p-6">
      <router-outlet />
    </main>
  </div>
</div>
```

---

## 8. Nomenclatura

| Elemento | Regla | Ejemplo |
|---|---|---|
| Clase del componente | PascalCase, **sin sufijo** | `Ejercicios`, `EjercicioLista` |
| Archivo | `kebab-case.ts` | `ejercicio-lista.ts` |
| Selector | `app-kebab-case` | `app-ejercicio-lista` |
| Métodos | `camelCase`, verbo en español | `cargarEjercicios()`, `guardarEjercicio()` |
| Variables colección | camelCase plural | `ejercicios`, `listaCitas` |
| Variables singular | camelCase singular | `ejercicioSeleccionado`, `cargando` |
| Signals | `signal<T>(valorInicial)` | `ejercicios = signal<any[]>([])` |
| Servicios GraphQL | PascalCase + `Service` | `EjerciciosService`, `CitasService` |

---

## 9. Reglas de División en Sub-componentes

Un componente **debe dividirse** en sub-componentes cuando:

1. El template HTML supera **~80 líneas**
2. Tiene **secciones claramente diferenciadas** (lista + formulario + detalle)
3. Una sección se repite en otro módulo (→ moverla a `compartido/`)

**Estructura resultante para un módulo complejo:**

```
ejercicios/
├── ejercicios.ts              # Smart: estado + lógica
├── ejercicios.html            # Solo orquesta sub-componentes
└── componentes/
    ├── ejercicio-lista/       # Dumb: muestra la tabla
    ├── ejercicio-form/        # Dumb: formulario crear/editar
    └── ejercicio-detalle/     # Dumb: vista de detalle (opcional)
```

---

## 10. Mapa de Servicios GraphQL — Gestión Clínica

| Servicio (`nucleo/graphql/gestion-clinica/`) | Queries principales | Mutations principales |
|---|---|---|
| `ejercicios.ts` | `listarEjercicios`, `verEjercicio`, `listarEjerciciosPorCategoria` | `crearEjercicio`, `editarEjercicio`, `eliminarEjercicio` |
| `pacientes.ts` | `listarPacientes`, `verPaciente`, `buscarPacientes` | `crearPacientes`, `editarPaciente`, `altaMedicaPaciente`, `eliminarPaciente` |
| `personas.ts` | `listarPersonas`, `verPersona`, `buscarPersonas` | `crearPersonas`, `editarPersona`, `eliminarPersona` |
| `citas.ts` | `listarCitas`, `verCita`, `listarCitasPorPaciente`, `listarCitasPorEmpleadoYFecha`, `listarCitasProximas` | `crearCitas`, `editarCita`, `confirmarCita`, `cancelarCita`, `eliminarCita` |
| `evaluaciones-iniciales.ts` | `listarEvaluacionesIniciales`, `verEvaluacionInicial`, `listarEvaluacionesPorPaciente` | `crearEvaluacionesIniciales`, `editarEvaluacionInicial`, `eliminarEvaluacionInicial` |
| `planes-tratamientos.ts` | `listarPlanesTratamientos`, `verPlanTratamiento`, `listarPlanesPorPaciente` | `crearPlanesTratamientos`, `editarPlanTratamiento`, `eliminarPlanTratamiento` |
| `planes-ejercicios.ts` | `listarPlanesEjercicios`, `verPlanEjercicio`, `listarEjerciciosDePlan` | `crearPlanesEjercicios`, `editarPlanEjercicio`, `eliminarPlanEjercicio` |
| `sesiones.ts` | `listarSesiones`, `verSesion`, `listarSesionesPorPaciente` | `crearSesiones`, `editarSesion`, `cerrarYFirmarSesion`, `eliminarSesion` |
| `sesiones-domiciliarias.ts` | `listarSesionesDomiciliarias`, `verSesionDomiciliaria`, `listarSesionesDomiciliariasPorPaciente` | `crearSesionesDomiciliarias`, `editarSesionDomiciliaria`, `eliminarSesionDomiciliaria` |
| `usuarios.ts` | `listarUsuarios`, `verUsuario` | `crearUsuarios`, `editarUsuario`, `inactivarUsuario`, `eliminarUsuario` |

---

## 11. Documentación Obligatoria de Métodos

Todo método con lógica de negocio lleva JSDoc:

```typescript
/**
 * Carga las evaluaciones iniciales de un paciente específico.
 *
 * @param pacienteId ID del paciente a consultar.
 * @returns Observable con el listado de evaluaciones iniciales.
 */
listarEvaluacionesPorPaciente(pacienteId: number): Observable<any[]> { ... }
```

---

## 12. Checklist de Implementación por Módulo

Antes de considerar un módulo completo, verificar:

- [ ] Servicio GraphQL en `nucleo/graphql/gestion-clinica/<entidad>.ts` con todas las queries y mutations
- [ ] Componente Smart en `modulos/gestion-clinica/<entidad>/<entidad>.ts` — inyecta servicio, maneja estado con `signal()`
- [ ] Componente Dumb lista en `componentes/<entidad>-lista/` — usa `app-tabla` compartida
- [ ] Componente Dumb formulario en `componentes/<entidad>-form/` — usa clases Tailwind estándar de formulario
- [ ] `@Input()` y `@Output()` correctamente definidos en todos los Dumb
- [ ] Sin inyección de servicios GraphQL en componentes Dumb
- [ ] Tabla importada desde `compartido/tabla/tabla`
- [ ] JSDoc en todos los métodos del servicio y del Smart
- [ ] CSS del componente vacío o mínimo (solo lo que Tailwind no cubre)

## HISTORIAS DE USUARIO
  