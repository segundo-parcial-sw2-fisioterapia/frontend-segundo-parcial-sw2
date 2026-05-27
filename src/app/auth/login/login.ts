import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginService } from '../../nucleo/rest/login.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private fb = inject(FormBuilder);
  private loginService = inject(LoginService);
  private router = inject(Router);

  cargando = signal(false);
  error = signal<string | null>(null);
  mostrarContrasena = signal(false);

  form = this.fb.group({
    correo: ['', [Validators.required, Validators.email]],
    contrasena: ['', [Validators.required, Validators.minLength(6)]],
  });

  /**
   * Envía las credenciales y redirige al sistema si son válidas.
   */
  ingresar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.cargando.set(true);
    this.error.set(null);

    const { correo, contrasena } = this.form.value;

    this.loginService.login({ correo: correo!, contrasena: contrasena! }).subscribe({
      next: () => {
        this.cargando.set(false);
        this.router.navigate(['/app']);
      },
      error: (err) => {
        this.cargando.set(false);
        this.error.set(
          err.status === 401
            ? 'Credenciales incorrectas. Verifique su correo y contraseña.'
            : 'No se pudo conectar con el servidor. Intente nuevamente.'
        );
      },
    });
  }

  /** Alterna la visibilidad del campo contraseña. */
  alternarContrasena(): void {
    this.mostrarContrasena.update((v) => !v);
  }
}
