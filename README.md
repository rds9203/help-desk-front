# Help Desk Frontend

Sistema de gestión de créditos y préstamos - Interfaz de usuario.

## 📋 Descripción

Frontend del sistema Help Desk construido con Angular 20. Proporciona una interfaz moderna y responsive para la gestión de créditos, usuarios y notificaciones.

## 🛠️ Tecnologías

- **Angular 20** - Framework frontend
- **Angular Material** - Componentes UI
- **TypeScript** - Tipado estático
- **RxJS** - Programación reactiva
- **SCSS** - Estilos

## 📦 Instalación

### Prerrequisitos

- Node.js (versión 18 o superior)
- npm o yarn
- Angular CLI

### Pasos de instalación

1. **Clonar el repositorio**
   ```bash
   git clone <url-del-repositorio>
   cd help-desk-front
   ```

2. **Instalar Angular CLI globalmente** (si no lo tienes)
   ```bash
   npm install -g @angular/cli
   ```

3. **Instalar dependencias**
   ```bash
   npm install
   ```

4. **Configurar variables de entorno**
   ```bash
   # Editar src/environments/environment.ts
   export const environment = {
     production: false,
     apiUrl: 'http://localhost:3001/api'
   };
   ```

## 🚀 Ejecución

### Desarrollo
```bash
# Iniciar servidor de desarrollo
ng serve
# o
npm start

# La aplicación estará disponible en http://localhost:4200
```

### Producción
```bash
# Compilar para producción
ng build --configuration production

# Los archivos compilados estarán en dist/
```

## 📊 Estructura del Proyecto

```
help-desk-front/
├── src/
│   ├── app/
│   │   ├── credits/           # Módulo de créditos
│   │   │   ├── credits.component.ts
│   │   │   ├── credits.component.html
│   │   │   └── credits.component.css
│   │   ├── services/          # Servicios
│   │   │   └── api.service.ts
│   │   ├── layout/           # Componentes de layout
│   │   │   ├── header/
│   │   │   ├── sidebar/
│   │   │   └── footer/
│   │   └── app.component.ts
│   ├── environments/         # Variables de entorno
│   ├── styles.css           # Estilos globales
│   └── index.html
├── angular.json             # Configuración de Angular
├── package.json            # Dependencias
└── README.md              # Este archivo
```

## 🎯 Funcionalidades

### Gestión de Usuarios
- **Selector de usuarios**: Cambiar entre diferentes usuarios
- **Información del usuario**: Mostrar nombre, posición y rol
- **Roles**: Admin y Usuario regular

### Gestión de Créditos
- **Vista de admin**: Ver todos los créditos de todos los usuarios
- **Vista de usuario**: Ver solo los créditos propios
- **Crear crédito**: Formulario con validaciones
- **Aprobar/Rechazar**: Funcionalidad para admins

### Documentos
- **Autorización de descuentos**: Generar documento oficial
- **Cálculo automático**: Cuotas y fechas de pago
- **Datos del usuario**: Información personalizada

### Notificaciones
- **Sistema de notificaciones**: Tipo Facebook
- **Contador de no leídas**: Badge en el ícono
- **Marcar como leída**: Al hacer clic

## 🔧 Componentes Principales

### CreditsComponent

#### Propiedades
```typescript
// Usuarios
availableUsers: Signal<User[]>     // Lista de usuarios disponibles
selectedUserId: Signal<number>     // ID del usuario seleccionado
currentUser: Signal<User>          // Usuario actual

// Créditos
credits: Signal<Credit[]>          // Lista de créditos
loading: Signal<boolean>           // Estado de carga

// Formularios
newCreditForm: {                   // Formulario de nuevo crédito
  loanAmount: number
  installments: number
}

// Notificaciones
notifications: Signal<Notification[]>
unreadNotificationsCount: Signal<number>
```

#### Métodos Principales

##### `loadUsers()`
```typescript
/**
 * Carga la lista de todos los usuarios disponibles
 * @returns void
 */
loadUsers(): void
```

##### `changeUser(userId: number)`
```typescript
/**
 * Cambia el usuario actualmente seleccionado
 * @param userId - ID del usuario a seleccionar
 */
changeUser(userId: number): void
```

##### `generateAuthorization()`
```typescript
/**
 * Genera el documento de autorización de descuentos
 * @returns void
 */
generateAuthorization(): void
```

##### `validateLoanAmount()`
```typescript
/**
 * Valida que el monto no exceda el máximo permitido
 * @returns void
 */
validateLoanAmount(): void
```

##### `formatCurrency(amount: number)`
```typescript
/**
 * Formatea un número como moneda en pesos colombianos
 * @param amount - Monto a formatear
 * @returns string - Monto formateado
 */
formatCurrency(amount: number): string
```

## 📱 Interfaces TypeScript

### User
```typescript
interface User {
  id: number
  firstName: string
  lastName: string
  email: string
  position: string
  startDate: string
  salary: number
  hasDebt: boolean
  role: {
    id: number
    name: string
    description: string
  }
}
```

### Credit
```typescript
interface Credit {
  id: number
  userId: number
  user: User
  creditType: string
  amount: number
  installmentAmount: number
  outstandingAmount: number
  startDate: string
  endDate: string
  status: string
  interestRate: {
    id: number
    rate: number
  }
  installments: number
  paidInstallments: number
}
```

### Notification
```typescript
interface Notification {
  id: number
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: Date
  userId?: number
  creditId?: number
}
```

## 🎨 Estilos

### Temas
- **Angular Material**: Componentes con Material Design
- **Responsive**: Adaptable a móviles y tablets
- **Tema personalizado**: Colores corporativos

### CSS Classes Principales
```css
.top-navbar          /* Barra superior de navegación */
.user-info           /* Información del usuario */
.action-buttons-cell /* Celdas de acciones */
.dialog-header       /* Encabezado de diálogos */
```

## 🔌 Servicios

### ApiService
```typescript
class ApiService {
  // Usuarios
  getUsers(): Observable<User[]>
  getUser(id: number): Observable<User>
  getMaxCredit(userId: number): Observable<any>
  
  // Créditos
  getCredits(): Observable<Credit[]>
  getCreditsByUser(userId: number): Observable<Credit[]>
  createCredit(credit: Credit): Observable<Credit>
  
  // Notificaciones
  getNotifications(): Observable<Notification[]>
  getUnreadNotificationsCount(): Observable<{count: number}>
  markNotificationAsRead(id: number): Observable<any>
}
```

## 🚀 Scripts Disponibles

```bash
# Desarrollo
npm start              # ng serve
npm run build          # ng build
npm run test           # ng test
npm run e2e            # ng e2e
npm run lint           # ng lint

# Producción
npm run build:prod     # ng build --configuration production
```

## 🐛 Solución de Problemas

### Error de compilación
```bash
# Limpiar cache y reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Error de CORS
- Verificar que el backend esté ejecutándose en el puerto correcto
- Revisar la configuración de CORS en el backend

### Error de Angular Material
```bash
# Reinstalar Angular Material
ng add @angular/material
```

### Problemas de tipado
```bash
# Regenerar tipos
npm run build
```

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Componentes Adaptativos
- **Tabla**: Scroll horizontal en móviles
- **Diálogos**: Full screen en móviles
- **Navegación**: Menú colapsable en móviles

## 🔐 Seguridad

### Validaciones
- **Formularios**: Validación en tiempo real
- **Montos**: Límites máximos de crédito
- **Roles**: Control de acceso por rol

### Sanitización
- **Inputs**: Sanitización automática de Angular
- **XSS**: Protección contra inyección de scripts

## 📞 Soporte

Para reportar problemas o solicitar funcionalidades:
1. Crear un issue en el repositorio
2. Incluir pasos para reproducir el error
3. Especificar versión de Node.js y Angular

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.