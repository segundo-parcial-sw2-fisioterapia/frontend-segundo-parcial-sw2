import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  label: string;
  ruta: string;
  icono: string;
  badge?: string;
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
        { label: 'Pacientes', ruta: '/app/pacientes', icono: 'patients' },
        { label: 'Citas', ruta: '/app/citas', icono: 'calendar' },
        { label: 'Evaluaciones Iniciales', ruta: '/app/evaluaciones-iniciales', icono: 'clipboard' },
        { label: 'Planes de Tratamiento', ruta: '/app/planes-tratamiento', icono: 'document' },
        { label: 'Planes de Ejercicios', ruta: '/app/planes-ejercicios', icono: 'collection' },
        { label: 'Ejercicios', ruta: '/app/ejercicios', icono: 'lightning' },
        { label: 'Sesiones Clínicas', ruta: '/app/sesiones', icono: 'clipboard-check' },
        { label: 'Sesiones Domiciliarias', ruta: '/app/sesiones-domiciliarias', icono: 'home' },
      ],
    },
    {
      titulo: 'Personas y Acceso',
      items: [
        { label: 'Personas', ruta: '/app/personas', icono: 'user' },
        { label: 'Usuarios', ruta: '/app/usuarios', icono: 'users' },
      ],
    },
    {
      titulo: 'Gestión Administrativa',
      items: [
        { label: 'Empleados', ruta: '/app/admin/empleados', icono: 'briefcase', badge: 'Pronto' },
        { label: 'Inventario', ruta: '/app/admin/inventario', icono: 'cube', badge: 'Pronto' },
        { label: 'Facturación', ruta: '/app/admin/facturacion', icono: 'receipt', badge: 'Pronto' },
      ],
    },
    {
      titulo: 'Inteligencia de Negocio',
      items: [
        { label: 'Reportes', ruta: '/app/bi/reportes', icono: 'chart-bar', badge: 'Pronto' },
        { label: 'Análisis Predictivo', ruta: '/app/bi/predictivo', icono: 'trending', badge: 'Pronto' },
      ],
    },
  ];
}
