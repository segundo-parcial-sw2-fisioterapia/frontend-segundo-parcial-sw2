import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { LoginService } from '../rest/login.service';

/**
 * Protege rutas según los roles declarados en route.data.roles.
 * Si el usuario no tiene ninguno de los roles requeridos, redirige al dashboard.
 * Debe usarse siempre junto a authGuard (que valida la existencia del token).
 *
 * @example
 * {
 *   path: 'pacientes',
 *   canActivate: [authGuard, permisoGuard],
 *   data: { roles: ['administrador', 'fisioterapeuta'] },
 * }
 */
export const permisoGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const loginService = inject(LoginService);
  const router = inject(Router);

  const rolesRequeridos: string[] = route.data['roles'] ?? [];

  if (rolesRequeridos.length === 0) return true;

  if (loginService.tieneRoles(...rolesRequeridos)) return true;

  return router.createUrlTree(['/app/dashboard']);
};
