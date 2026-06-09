import { Routes } from '@angular/router';
import { authGuard } from './nucleo/guards/auth.guard';
import { permisoGuard } from './nucleo/guards/permiso.guard';

// Importación estática de componentes
import { Login } from './auth/login/login';
import { Layout } from './layout/layout';
import { Dashboard } from './modulos/dashboard/dashboard';
import { Personas } from './modulos/gestion-clinica/personas/personas';
import { Pacientes } from './modulos/gestion-clinica/pacientes/pacientes';
import { Usuarios } from './modulos/gestion-clinica/usuarios/usuarios';
import { Ejercicios } from './modulos/gestion-clinica/ejercicios/ejercicios';
import { EvaluacionesIniciales } from './modulos/gestion-clinica/evaluaciones-iniciales/evaluaciones-iniciales';
import { EditarEvaluacion } from './modulos/gestion-clinica/evaluaciones-iniciales/editar-evaluacion/editar-evaluacion';
import { PlanesTratamiento } from './modulos/gestion-clinica/planes-tratamiento/planes-tratamiento';
import { PlanesEjercicios } from './modulos/gestion-clinica/planes-ejercicios/planes-ejercicios';
import { Sesiones } from './modulos/gestion-clinica/sesiones/sesiones';
import { VerSesiones } from './modulos/gestion-clinica/sesiones/ver-sesiones/ver-sesiones';
import { EditarSesiones } from './modulos/gestion-clinica/sesiones/editar-sesiones/editar-sesiones';
import { SesionesDomiciliarias } from './modulos/gestion-clinica/sesiones-domiciliarias/sesiones-domiciliarias';
import { Empleados } from './modulos/gestion-administrativa/empleados/empleados';
import { Insumos } from './modulos/gestion-administrativa/insumos/insumos';
import { Facturas } from './modulos/gestion-administrativa/facturas/facturas';
import { Tarifas } from './modulos/gestion-administrativa/tarifas/tarifas';
import { Mensualidades } from './modulos/gestion-administrativa/mensualidades/mensualidades';
import { Proximamente } from './modulos/placeholders/proximamente';
import { Predictivo } from './modulos/bi-automatizacion/predictivo';
import { Reportes } from './modulos/bi-automatizacion/reportes/reportes';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: Login,
  },
  {
    path: 'app',
    component: Layout,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        component: Dashboard,
      },
      {
        path: 'personas',
        component: Personas,
        canActivate: [permisoGuard],
        data: { roles: ['administrador', 'recepcionista', 'fisioterapeuta'] },
      },
      {
        path: 'pacientes',
        component: Pacientes,
        canActivate: [permisoGuard],
        data: { roles: ['administrador', 'recepcionista', 'fisioterapeuta'] },
      },
      {
        path: 'usuarios',
        component: Usuarios,
        canActivate: [permisoGuard],
        data: { roles: ['administrador'] },
      },
      {
        path: 'ejercicios',
        component: Ejercicios,
        canActivate: [permisoGuard],
        data: { roles: ['administrador', 'fisioterapeuta', 'paciente'] },
      },
      {
        path: 'evaluaciones-iniciales',
        children: [
          {
            path: '',
            component: EvaluacionesIniciales,
            canActivate: [permisoGuard],
            data: { roles: ['administrador', 'fisioterapeuta', 'director'] },
          },
          {
            path: 'editar/:id',
            component: EditarEvaluacion,
            canActivate: [permisoGuard],
            data: { roles: ['administrador', 'fisioterapeuta', 'director'] },
          },
        ],
      },
      {
        path: 'planes-tratamiento',
        children: [
          {
            path: '',
            component: PlanesTratamiento,
            canActivate: [permisoGuard],
            data: { roles: ['administrador', 'fisioterapeuta', 'director'] },
          },
          {
            path: 'crear/:evaluacionId',
            loadComponent: () => import('./modulos/gestion-clinica/planes-tratamiento/crear-planes-tratamiento/crear-planes-tratamiento').then(m => m.CrearPlanesTratamiento),
            canActivate: [permisoGuard],
            data: { roles: ['administrador', 'fisioterapeuta', 'director'] },
          }
        ]
      },
      {
        path: 'planes-ejercicios',
        component: PlanesEjercicios,
        canActivate: [permisoGuard],
        data: { roles: ['administrador', 'fisioterapeuta'] },
      },
      {
        path: 'sesiones',
        children: [
          {
            path: '',
            component: Sesiones,
            canActivate: [permisoGuard],
            data: { roles: ['administrador', 'fisioterapeuta', 'director', 'recepcionista'] },
          },
          {
            path: 'ver/:id',
            component: VerSesiones,
            canActivate: [permisoGuard],
            data: { roles: ['administrador', 'fisioterapeuta', 'director', 'recepcionista'] },
          },
          {
            path: 'editar/:id',
            component: EditarSesiones,
            canActivate: [permisoGuard],
            data: { roles: ['administrador', 'fisioterapeuta'] },
          },
        ],
      },
      {
        path: 'sesiones-domiciliarias',
        component: SesionesDomiciliarias,
        canActivate: [permisoGuard],
        data: { roles: ['administrador', 'fisioterapeuta', 'director', 'paciente'] },
      },
      {
        path: 'admin',
        children: [
          {
            path: 'empleados',
            component: Empleados,
            canActivate: [permisoGuard],
            data: { roles: ['administrador', 'director', 'contador'] },
          },
          {
            path: 'inventario',
            component: Insumos,
            canActivate: [permisoGuard],
            data: { roles: ['administrador', 'director', 'recepcionista', 'fisioterapeuta'] },
          },
          {
            path: 'facturacion',
            component: Facturas,
            canActivate: [permisoGuard],
            data: { roles: ['administrador', 'director', 'contador', 'recepcionista'] },
          },
          {
            path: 'tarifas',
            component: Tarifas,
            canActivate: [permisoGuard],
            data: { roles: ['administrador', 'fisioterapeuta'] },
          },
          {
            path: 'mensualidades',
            component: Mensualidades,
            canActivate: [permisoGuard],
            data: { roles: ['administrador', 'contador', 'recepcionista'] },
          },
        ],
      },
      {
        path: 'bi',
        children: [
          {
            path: 'reportes',
            component: Reportes,
            canActivate: [permisoGuard],
            data: { roles: ['administrador', 'director', 'contador'] },
          },
          {
            path: 'predictivo',
            component: Predictivo,
            canActivate: [permisoGuard],
            data: { roles: ['director', 'fisioterapeuta'] },
          },
        ],
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
