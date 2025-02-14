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
  - Análisis de tweets
  - Generación de voz de cuenta
  - Creación de contenido personalizado

## Decisiones Técnicas Clave
1. **Arquitectura basada en componentes**:
   - Separación clara de responsabilidades
   - Componentes reutilizables
   - Mantenimiento simplificado

2. **Seguridad**:
   - Implementación de Google Authenticator
   - Autenticación mediante Supabase
   - Acceso restringido a nivel de componente
   - Políticas RLS para protección de datos

3. **Integración de APIs**:
   - OpenAI para análisis y generación de contenido
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

2. **Análisis y Generación de Voz**:
   - Recopilación de tweets de ejemplo
   - Análisis mediante OpenAI para extraer patrones
   - Generación de voz única para cada cuenta
   - Almacenamiento en tabla `voces_cuenta`

3. **Generación de Contenido**:
   - Consulta de la voz de cuenta almacenada
   - Procesamiento mediante OpenAI usando la voz como guía
   - Almacenamiento en Supabase
   - Visualización en interfaz de usuario

4. **Gestión de Cuentas**:
   - Creación y configuración de cuentas
   - Captura y análisis de tweets de ejemplo
   - Generación y almacenamiento de voz de cuenta
   - Historial de contenido generado

## Patrones de Voz de Cuenta
1. **Estructura de Voz**:
   - Core Voice: Definición principal del estilo
   - Key Components: Elementos característicos
   - Content Formula: Proporciones de elementos
   - Cross-Validation: Ejemplos de transformación
   - Conflict Resolution: Manejo de inconsistencias

2. **Proceso de Generación**:
   - Análisis de tweets de ejemplo
   - Síntesis de patrones comunes
   - Generación de fórmula de contenido
   - Validación cruzada con ejemplos
   - Almacenamiento para uso posterior

3. **Uso en Generación de Contenido**:
   - Consulta de voz almacenada
   - Aplicación de patrones y fórmulas
   - Generación de contenido consistente
   - Validación contra el estilo definido
