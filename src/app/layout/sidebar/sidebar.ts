import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LoginService } from '../../nucleo/rest/login.service';

interface NavItem {
  label: string;
  ruta: string;
  icono: string;
  badge?: string;
  roles?: string[];
}

interface NavGrupo {
  titulo: string;
  items: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  private loginService = inject(LoginService);

  grupos: NavGrupo[] = [
    {
      titulo: 'Inicio',
      items: [
        { label: 'Dashboard', ruta: '/app/dashboard', icono: 'dashboard' },
      ],
    },
    {
      titulo: 'Gestión Clínica',
      items: [
        {
          label: 'Pacientes',
          ruta: '/app/pacientes',
          icono: 'patients',
          roles: ['administrador', 'recepcionista', 'fisioterapeuta'],
        },
        {
          label: 'Evaluaciones Iniciales',
          ruta: '/app/evaluaciones-iniciales',
          icono: 'clipboard',
          roles: ['administrador', 'fisioterapeuta', 'director'],
        },
        {
          label: 'Planes de Tratamiento',
          ruta: '/app/planes-tratamiento',
          icono: 'document',
          roles: ['administrador', 'fisioterapeuta', 'director'],
        },
        {
          label: 'Planes de Ejercicios',
          ruta: '/app/planes-ejercicios',
          icono: 'collection',
          roles: ['administrador', 'fisioterapeuta', 'paciente'],
        },
        {
          label: 'Ejercicios',
          ruta: '/app/ejercicios',
          icono: 'lightning',
          roles: ['administrador', 'fisioterapeuta', 'paciente'],
        },
        {
          label: 'Sesiones Clínicas',
          ruta: '/app/sesiones',
          icono: 'clipboard-check',
          roles: ['administrador', 'fisioterapeuta', 'director'],
        },
        {
          label: 'Sesiones Domiciliarias',
          ruta: '/app/sesiones-domiciliarias',
          icono: 'home',
          roles: ['administrador', 'fisioterapeuta', 'director', 'paciente'],
        },
      ],
    },
    {
      titulo: 'Personas y Acceso',
      items: [
        {
          label: 'Personas',
          ruta: '/app/personas',
          icono: 'user',
          roles: ['administrador', 'recepcionista', 'fisioterapeuta'],
        },
        {
          label: 'Usuarios',
          ruta: '/app/usuarios',
          icono: 'users',
          roles: ['administrador'],
        },
      ],
    },
    {
      titulo: 'Gestión Administrativa',
      items: [
        {
          label: 'Empleados',
          ruta: '/app/admin/empleados',
          icono: 'briefcase',
          roles: ['administrador', 'director', 'contador'],
        },
        {
          label: 'Inventario',
          ruta: '/app/admin/inventario',
          icono: 'cube',
          roles: ['administrador', 'director', 'recepcionista', 'fisioterapeuta'],
        },
        {
          label: 'Facturación',
          ruta: '/app/admin/facturacion',
          icono: 'receipt',
          roles: ['administrador', 'director', 'contador', 'recepcionista'],
        },
        {
          label: 'Tarifas',
          ruta: '/app/admin/tarifas',
          icono: 'tag',
          roles: ['administrador', 'fisioterapeuta'],
        },
        {
          label: 'Mensualidades',
          ruta: '/app/admin/mensualidades',
          icono: 'credit-card',
          roles: ['administrador', 'contador', 'recepcionista'],
        },
      ],
    },
    {
      titulo: 'Inteligencia de Negocio',
      items: [
        {
          label: 'Reportes',
          ruta: '/app/bi/reportes',
          icono: 'chart-bar',
          badge: 'Pronto',
          roles: ['director', 'administrador', 'contador'],
        },
        {
          label: 'Análisis Predictivo',
          ruta: '/app/bi/predictivo',
          icono: 'trending',
          badge: 'Pronto',
          roles: ['director', 'fisioterapeuta'],
        },
      ],
    },
  ];

  /** Retorna true si el item debe mostrarse para el rol actual del usuario. */
  esVisible(item: NavItem): boolean {
    if (!item.roles || item.roles.length === 0) return true;
    return this.loginService.tieneRoles(...item.roles);
  }

  /** Retorna true si el grupo tiene al menos un item visible. */
  grupoEsVisible(grupo: NavGrupo): boolean {
    return grupo.items.some((item) => this.esVisible(item));
  }
}
