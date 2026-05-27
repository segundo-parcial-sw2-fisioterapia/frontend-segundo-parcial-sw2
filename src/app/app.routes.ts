import { Routes } from '@angular/router';
import { authGuard } from './nucleo/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login').then((m) => m.Login),
  },
  {
    path: 'app',
    loadComponent: () => import('./layout/layout').then((m) => m.Layout),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./modulos/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'personas',
        loadComponent: () =>
          import('./modulos/gestion-clinica/personas/personas').then((m) => m.Personas),
      },
      {
        path: 'pacientes',
        loadComponent: () =>
          import('./modulos/gestion-clinica/pacientes/pacientes').then((m) => m.Pacientes),
      },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./modulos/gestion-clinica/usuarios/usuarios').then((m) => m.Usuarios),
      },
      {
        path: 'citas',
        loadComponent: () =>
          import('./modulos/gestion-clinica/citas/citas').then((m) => m.Citas),
      },
      {
        path: 'ejercicios',
        loadComponent: () =>
          import('./modulos/gestion-clinica/ejercicios/ejercicios').then((m) => m.Ejercicios),
      },
      {
        path: 'evaluaciones-iniciales',
        loadComponent: () =>
          import('./modulos/gestion-clinica/evaluaciones-iniciales/evaluaciones-iniciales').then(
            (m) => m.EvaluacionesIniciales,
          ),
      },
      {
        path: 'planes-tratamiento',
        loadComponent: () =>
          import('./modulos/gestion-clinica/planes-tratamiento/planes-tratamiento').then(
            (m) => m.PlanesTratamiento,
          ),
      },
      {
        path: 'planes-ejercicios',
        loadComponent: () =>
          import('./modulos/gestion-clinica/planes-ejercicios/planes-ejercicios').then(
            (m) => m.PlanesEjercicios,
          ),
      },
      {
        path: 'sesiones',
        loadComponent: () =>
          import('./modulos/gestion-clinica/sesiones/sesiones').then((m) => m.Sesiones),
      },
      {
        path: 'sesiones-domiciliarias',
        loadComponent: () =>
          import('./modulos/gestion-clinica/sesiones-domiciliarias/sesiones-domiciliarias').then(
            (m) => m.SesionesDomiciliarias,
          ),
      },
      {
        path: 'admin/empleados',
        loadComponent: () =>
          import('./modulos/placeholders/proximamente').then((m) => m.Proximamente),
        data: {
          titulo: 'Gestión de Empleados',
          descripcion: 'Administración del personal del centro: fisioterapeutas, administrativos y médicos.',
        },
      },
      {
        path: 'admin/inventario',
        loadComponent: () =>
          import('./modulos/placeholders/proximamente').then((m) => m.Proximamente),
        data: {
          titulo: 'Control de Inventario',
          descripcion: 'Gestión de insumos, equipos terapéuticos y materiales del centro.',
        },
      },
      {
        path: 'admin/facturacion',
        loadComponent: () =>
          import('./modulos/placeholders/proximamente').then((m) => m.Proximamente),
        data: {
          titulo: 'Facturación y Cobros',
          descripcion: 'Emisión de facturas, registro de pagos y gestión financiera del centro.',
        },
      },
      {
        path: 'bi/reportes',
        loadComponent: () =>
          import('./modulos/placeholders/proximamente').then((m) => m.Proximamente),
        data: {
          titulo: 'Reportes y Estadísticas',
          descripcion: 'Informes de rendimiento clínico, ocupación y resultados por período.',
        },
      },
      {
        path: 'bi/predictivo',
        loadComponent: () =>
          import('./modulos/placeholders/proximamente').then((m) => m.Proximamente),
        data: {
          titulo: 'Análisis Predictivo',
          descripcion: 'Modelos de IA para predicción de alta médica y riesgo de recaída.',
        },
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
