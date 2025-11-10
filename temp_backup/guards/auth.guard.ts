import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { LoadingComponent } from '../loading/loading.component';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    
    // Obtener token de la URL
    const token = this.getTokenFromUrl();
    
    if (!token) {
      console.error('❌ No se encontró token en la URL');
      this.redirectToAuthError();
      return false;
    }

    // Validar token con GLPI
    return this.validateTokenWithGLPI(token).pipe(
      map((isValid) => {
        if (isValid) {
          console.log('✅ Token válido, permitiendo acceso');
          return true;
        } else {
          console.error('❌ Token inválido');
          this.redirectToAuthError();
          return false;
        }
      }),
      catchError((error) => {
        console.error('❌ Error validando token:', error);
        this.redirectToAuthError();
        return of(false);
      })
    );
  }

  /**
   * Obtiene el token desde la URL
   */
  private getTokenFromUrl(): string | null {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('token') || urlParams.get('glpi_token') || null;
  }

  /**
   * Valida el token con la API de GLPI
   */
  private validateTokenWithGLPI(token: string): Observable<boolean> {
    // Intentar autenticar con GLPI
    return new Observable<boolean>((observer) => {
      this.authService.authenticateWithGLPI(token);
      
      // Suscribirse al estado de autenticación
      const subscription = this.authService.isAuthenticated$.subscribe({
        next: (isAuthenticated) => {
          if (isAuthenticated) {
            observer.next(true);
            observer.complete();
          } else {
            // Esperar un poco más para ver si hay un error
            setTimeout(() => {
              const error = this.authService.error();
              if (error) {
                observer.error(new Error(error));
              } else {
                observer.next(false);
                observer.complete();
              }
            }, 2000);
          }
        },
        error: (error) => {
          observer.error(error);
        }
      });

      // Timeout de 10 segundos
      setTimeout(() => {
        subscription.unsubscribe();
        observer.error(new Error('Timeout validando token'));
      }, 10000);
    });
  }

  /**
   * Redirige a la página de error de autenticación
   */
  private redirectToAuthError(): void {
    this.router.navigate(['/auth-error']);
  }
}
