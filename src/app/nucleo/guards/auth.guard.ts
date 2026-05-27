import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LoginService } from '../rest/login.service';

/**
 * Protege rutas que requieren sesión activa.
 * Redirige a /login si no hay token almacenado.
 */
export const authGuard: CanActivateFn = () => {
  const loginService = inject(LoginService);
  const router = inject(Router);

  if (loginService.obtenerToken()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
