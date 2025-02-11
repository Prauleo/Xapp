# Patrones del Sistema

## Construcción del Sistema
El sistema está construido utilizando una arquitectura moderna basada en:

### Frontend
- **Next.js**: Framework de React que proporciona:
  - Renderizado del lado del servidor (SSR)
  - Enrutamiento dinámico
  - Optimización automática de imágenes
  - Soporte para API routes

### Componentes Principales
- **Auth.js**: Manejo de autenticación
- **AuthenticatedContent.js**: Contenido protegido por autenticación
- **AuthProvider.js**: Proveedor de contexto de autenticación
- **CuentaForm.js**: Formulario para creación/edición de cuentas
- **CuentasList.js**: Listado de cuentas
- **HistorialContenido.js**: Historial de contenido generado
- **ThemeSwitcher.js**: Cambio de tema visual
- **FloatingButton.js**: Botón flotante para acciones principales

### Utilidades
- **openai.js**: Integración con la API de OpenAI
- **supabaseClient.js**: Cliente de Supabase para base de datos

## Decisiones Técnicas Clave
1. **Arquitectura basada en componentes**:
   - Separación clara de responsabilidades
   - Componentes reutilizables
   - Mantenimiento simplificado

2. **Seguridad**:
   - Implementación de Google Authenticator
   - Autenticación mediante Supabase
   - Acceso restringido a nivel de componente

3. **Integración de APIs**:
   - OpenAI para generación de contenido
   - Supabase para almacenamiento y autenticación
   - Google Authenticator para seguridad adicional

4. **Estructura de Directorios**:
   ```
   src/
   ├── app/          # Páginas y rutas de Next.js
   ├── components/   # Componentes reutilizables
   ├── utils/        # Utilidades y configuraciones
   └── pages_/       # Páginas adicionales
   ```

5. **Patrones de Estado**:
   - Uso de Context API para estado global
   - Manejo de estado local en componentes
   - Gestión de autenticación centralizada

6. **Estilizado**:
   - TailwindCSS para estilos consistentes
   - Headless UI para componentes base
   - Diseño responsivo y adaptable

## Flujo de Datos
1. **Autenticación**:
   - Verificación de credenciales mediante Google Authenticator
   - Manejo de sesiones con Supabase
   - Protección de rutas y contenido

2. **Generación de Contenido**:
   - Recopilación de tweets y contexto
   - Procesamiento mediante OpenAI
   - Almacenamiento en Supabase
   - Visualización en interfaz de usuario

3. **Gestión de Cuentas**:
   - Creación y configuración de cuentas
   - Captura del tono y estilo
   - Almacenamiento de preferencias
   - Historial de contenido generado
