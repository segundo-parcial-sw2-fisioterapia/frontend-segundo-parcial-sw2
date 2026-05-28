# Guía: Selector de Relaciones con Búsqueda en Vivo

## Por qué no usar `<select>` para llaves foráneas

Un `<select>` carga **todos** los registros en memoria para construir las opciones.
Con el dataset mínimo de 5 000 registros del proyecto, un `<select` de pacientes
o personas provocaría:

- Una query que retorna 5 000+ objetos completos al abrir el modal
- Renderizado de 5 000 `<option>` en el DOM (lentísimo, sin scroll virtual)
- El usuario debería leer miles de nombres para encontrar el correcto

**La solución:** el usuario escribe el nombre o CI, se busca en el backend con
`buscarPersonas(termino)` (que usa `ILIKE` o índice en BD) y se muestran máximo
10-20 resultados relevantes.

---

## El patrón: Smart/Dumb + Búsqueda Delegada

```
Smart (ej. citas.ts)
  ├── Inyecta PacientesService, UsuariosService, etc.
  ├── signals: pacientesBuscados, buscandoPacientes
  ├── método buscarPacientes(termino) → llama API
  └── pasa resultados al Dumb vía @Input

Dumb (ej. crear-citas.ts)
  ├── @Input() pacientes: any[]          ← resultados del smart
  ├── @Input() buscandoPacientes: boolean
  ├── @Output() buscarPacientes          ← delega búsqueda al smart
  ├── signal: pacienteSeleccionado       ← estado local del dumb
  ├── form.patchValue({ pacienteId })    ← escribe el ID en el form
  └── @Output() guardar → emite form.value con pacienteId ya seteado
```

**Regla:** el Dumb nunca inyecta servicios de búsqueda; sólo sabe
mostrar resultados que recibió y notificar qué el usuario escribió.

---

## Estructura de archivos por módulo

```
modulo/
├── modulo.ts          ← Smart: inyecta servicios, maneja búsquedas
├── modulo.html        ← pasa @Input y escucha @Output del Dumb
└── crear-modulo/
    ├── crear-modulo.ts    ← Dumb: @Input/@Output, signals locales
    └── crear-modulo.html  ← widget de búsqueda + dropdown + chip
```

---

## Paso a paso (copiable para cualquier módulo)

### 1. Smart component — signals y método de búsqueda

Agrega una sección por cada FK que tenga el formulario.

```typescript
// crear-citas.ts (smart)
import { PersonasService } from '...';   // o PacientesService, UsuariosService, etc.

// Uno por cada FK buscable
pacientesBuscados  = signal<any[]>([]);
buscandoPaciente   = signal(false);

empleadosBuscados  = signal<any[]>([]);
buscandoEmpleado   = signal(false);

/** Busca pacientes — llama API sólo si hay al menos 2 caracteres */
buscarPaciente(termino: string): void {
  if (!termino || termino.length < 2) { this.pacientesBuscados.set([]); return; }
  this.buscandoPaciente.set(true);
  this.pacientesService.buscarPacientes(termino).subscribe({
    next: (d) => { this.pacientesBuscados.set(d); this.buscandoPaciente.set(false); },
    error: ()  => this.buscandoPaciente.set(false),
  });
}

/** Igual para empleados, personas, etc. */
buscarEmpleado(termino: string): void { /* mismo patrón */ }

/** Al cerrar el modal, limpia todos los resultados */
cerrarModalCrear(): void {
  this.modalCrear.set(false);
  this.pacientesBuscados.set([]);
  this.empleadosBuscados.set([]);
}
```

### 2. Smart HTML — pasar los bindings al Dumb

```html
<app-modal titulo="Nueva Cita" [abierto]="modalCrear()" (cerrar)="cerrarModalCrear()">
  <app-crear-citas
    [pacientes]="pacientesBuscados()"
    [buscandoPaciente]="buscandoPaciente()"
    (buscarPaciente)="buscarPaciente($event)"

    [empleados]="empleadosBuscados()"
    [buscandoEmpleado]="buscandoEmpleado()"
    (buscarEmpleado)="buscarEmpleado($event)"

    (guardar)="crearCita($event)"
    (cancelar)="cerrarModalCrear()"
  />
</app-modal>
```

### 3. Dumb component TypeScript

```typescript
// crear-citas.ts (dumb)
import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-crear-citas',
  imports: [ReactiveFormsModule],
  templateUrl: './crear-citas.html',
})
export class CrearCitas {
  private fb = inject(FormBuilder);

  // ── FK: Paciente ──────────────────────────────────────────
  @Input() pacientes: any[] = [];
  @Input() buscandoPaciente = false;
  @Output() buscarPaciente = new EventEmitter<string>();
  pacienteSeleccionado = signal<any | null>(null);
  terminoPaciente = '';

  // ── FK: Empleado (Fisioterapeuta) ─────────────────────────
  @Input() empleados: any[] = [];
  @Input() buscandoEmpleado = false;
  @Output() buscarEmpleado = new EventEmitter<string>();
  empleadoSeleccionado = signal<any | null>(null);
  terminoEmpleado = '';

  // ── Outputs principales ───────────────────────────────────
  @Output() guardar  = new EventEmitter<any>();
  @Output() cancelar = new EventEmitter<void>();

  form = this.fb.group({
    pacienteId: [null as number | null, Validators.required],
    empleadoId: [null as number | null, Validators.required],
    fecha_hora:         ['', Validators.required],
    tipo:               ['', Validators.required],
    duracion_minutos:   [null as number | null],
    observaciones:      [''],
  });

  // ── Métodos por FK ────────────────────────────────────────

  onBuscarPaciente(t: string): void { this.terminoPaciente = t; this.buscarPaciente.emit(t); }
  seleccionarPaciente(p: any): void { this.pacienteSeleccionado.set(p); this.form.patchValue({ pacienteId: Number(p.id) }); }
  limpiarPaciente(): void    { this.pacienteSeleccionado.set(null); this.form.patchValue({ pacienteId: null }); this.terminoPaciente = ''; this.buscarPaciente.emit(''); }

  onBuscarEmpleado(t: string): void { this.terminoEmpleado = t; this.buscarEmpleado.emit(t); }
  seleccionarEmpleado(e: any): void { this.empleadoSeleccionado.set(e); this.form.patchValue({ empleadoId: Number(e.id) }); }
  limpiarEmpleado(): void    { this.empleadoSeleccionado.set(null); this.form.patchValue({ empleadoId: null }); this.terminoEmpleado = ''; this.buscarEmpleado.emit(''); }

  enviar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardar.emit(this.form.value);
  }
}
```

### 4. Widget HTML reutilizable — copia y ajusta el nombre

Para cada FK el HTML es idéntico; solo cambia el nombre de las variables:

```html
<!-- Widget genérico — reemplaza ENTIDAD por paciente, empleado, persona, etc. -->
<div class="flex flex-col gap-1">
  <label class="text-sm font-medium text-gray-700">LABEL DEL CAMPO</label>

  @if (!ENTIDADSeleccionado()) {
    <div class="relative">
      <input
        type="text"
        [value]="terminoENTIDAD"
        (input)="onBuscarENTIDAD($any($event.target).value)"
        placeholder="Buscar por nombre o CI..."
        autocomplete="off"
        class="input-base"
        [class.input-error]="form.get('entidadId')?.invalid && form.get('entidadId')?.touched"
      />

      @if (buscandoENTIDAD) {
        <div class="absolute right-3 top-2.5 w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      }

      @if (entidades.length > 0) {
        <ul class="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-panel max-h-48 overflow-y-auto">
          @for (item of entidades; track item.id) {
            <li>
              <button
                type="button"
                (click)="seleccionarENTIDAD(item)"
                class="w-full text-left px-3 py-2.5 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-0"
              >
                <!-- Ajusta los campos de visualización según la entidad -->
                <span class="text-sm font-medium text-gray-800">{{ item.nombre }} {{ item.apellido }}</span>
                <span class="ml-2 text-xs text-gray-400">CI: {{ item.ci }}</span>
              </button>
            </li>
          }
        </ul>
      }
    </div>
  }

  @if (ENTIDADSeleccionado()) {
    <div class="flex items-center gap-2 px-3 py-2.5 bg-green-50 border border-green-200 rounded-lg">
      <svg class="w-4 h-4 text-green-600 shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
      </svg>
      <span class="text-sm text-gray-800 flex-1">
        <span class="font-medium">{{ ENTIDADSeleccionado()?.nombre }} {{ ENTIDADSeleccionado()?.apellido }}</span>
        <span class="text-gray-500 ml-1.5">CI: {{ ENTIDADSeleccionado()?.ci }}</span>
      </span>
      <button type="button" (click)="limpiarENTIDAD()" class="text-xs text-primary-600 hover:underline shrink-0">
        Cambiar
      </button>
    </div>
  }

  @if (form.get('entidadId')?.invalid && form.get('entidadId')?.touched) {
    <span class="text-xs text-red-500">Debe seleccionar un registro de la búsqueda</span>
  }
</div>
```

---

## Mapa de relaciones por módulo

Todos los módulos que tienen FK y deben usar este patrón:

| Módulo | FK en el form | Servicio para buscar | Campo de display |
|---|---|---|---|
| `usuarios` ✅ | `personaId` | `PersonasService.buscarPersonas()` | `nombre apellido · CI` |
| `citas` | `pacienteId` | `PacientesService.buscarPacientes()` | `persona.nombre apellido · CI` |
| `citas` | `empleadoId` | `EmpleadosService.buscarEmpleados()`* | `nombre apellido · cargo` |
| `evaluaciones-iniciales` | `pacienteId` | `PacientesService.buscarPacientes()` | `persona.nombre apellido · CI` |
| `evaluaciones-iniciales` | `empleadoId` | `EmpleadosService.buscarEmpleados()`* | `nombre apellido · cargo` |
| `planes-tratamiento` | `pacienteId` | `PacientesService.buscarPacientes()` | `persona.nombre apellido · CI` |
| `planes-tratamiento` | `empleadoId` | `EmpleadosService.buscarEmpleados()`* | `nombre apellido · cargo` |
| `planes-ejercicios` | `pacienteId` | `PacientesService.buscarPacientes()` | `persona.nombre apellido · CI` |
| `sesiones` | `pacienteId` | `PacientesService.buscarPacientes()` | `persona.nombre apellido · CI` |
| `sesiones` | `empleadoId` | `EmpleadosService.buscarEmpleados()`* | `nombre apellido · cargo` |
| `sesiones-domiciliarias` | `pacienteId` | `PacientesService.buscarPacientes()` | `persona.nombre apellido · CI` |

> `*` `EmpleadosService` viene del microservicio `gestion-administrativa` (Spring Boot).
> Cuando esté disponible, el patrón es exactamente el mismo.

---

## Display según entidad — qué mostrar en el dropdown

Cada entidad tiene campos diferentes para mostrar al usuario:

### Persona (para `personaId`)
```html
{{ item.nombre }} {{ item.apellido }}
<span class="text-xs text-gray-400">CI: {{ item.ci }}</span>
```

### Paciente (para `pacienteId`)
El paciente contiene a la persona anidada:
```html
{{ item.persona.nombre }} {{ item.persona.apellido }}
<span class="text-xs text-gray-400">CI: {{ item.persona.ci }} · Estado: {{ item.estado }}</span>
```

Chip una vez seleccionado:
```html
{{ pacienteSeleccionado()?.persona?.nombre }} {{ pacienteSeleccionado()?.persona?.apellido }}
<span class="text-gray-500 ml-1.5">CI: {{ pacienteSeleccionado()?.persona?.ci }}</span>
```

### Empleado (para `empleadoId`)
Cuando `EmpleadosService` esté disponible:
```html
{{ item.persona.nombre }} {{ item.persona.apellido }}
<span class="text-xs text-gray-400">{{ item.cargo }}</span>
```

---

## Qué NO hacer

| ❌ Incorrecto | ✅ Correcto |
|---|---|
| `<input type="number" formControlName="pacienteId">` | Widget de búsqueda con dropdown |
| `<select>` con todos los pacientes | Búsqueda paginada por término |
| Inyectar `PacientesService` en el Dumb | Recibir resultados por `@Input()` |
| Buscar en cada pulsación de tecla | Mínimo 2 caracteres antes de llamar API |
| Dejar los resultados al cerrar el modal | Llamar `servicio.set([])` en `cerrarModal()` |

---

## Checklist de implementación por módulo

Para cada módulo con FK, verificar:

- [ ] Smart: señal `xBuscados = signal<any[]>([])`
- [ ] Smart: señal `buscandoX = signal(false)`
- [ ] Smart: método `buscarX(termino)` con guarda `length < 2`
- [ ] Smart: `cerrarModalCrear()` resetea todos los `xBuscados.set([])`
- [ ] Smart HTML: `[entidades]`, `[buscando]`, `(buscar)` en `<app-crear-x>`
- [ ] Dumb: `@Input() entidades`, `@Input() buscando`, `@Output() buscar`
- [ ] Dumb: `signal entidadSeleccionada`, `terminoBusqueda = ''`
- [ ] Dumb: métodos `onBuscar`, `seleccionar`, `limpiar`
- [ ] Dumb: `form.patchValue({ entidadId })` en `seleccionar`
- [ ] Dumb: `form.patchValue({ entidadId: null })` + emit `''` en `limpiar`
- [ ] HTML: widget con input, spinner, dropdown, chip verde, mensaje de error
