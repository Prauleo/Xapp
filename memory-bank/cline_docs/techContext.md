# Contexto Técnico

## Tecnologías Utilizadas
- **Next.js (v15.1.6)**: Framework de React para desarrollo web, utilizado como base del proyecto.
- **React (v19.0.0)**: Biblioteca JavaScript para construir interfaces de usuario.
- **Supabase**: Cliente de Supabase (`@supabase/supabase-js v2.48.1`) para base de datos y autenticación.
- **OpenAI (v4.83.0)**: API de OpenAI para generación de contenido y análisis de tweets.
- **Headless UI (v2.2.0)**: Componentes de UI accesibles y sin estilos predefinidos.
- **TailwindCSS (v3.4.1)**: Framework de CSS para estilizado y diseño responsivo.

## Configuración de Desarrollo
- **Node.js y npm**: Entorno de ejecución y gestor de paquetes para JavaScript.
- **Scripts principales**:
  - `next dev --turbopack`: Inicia el servidor de desarrollo con Turbopack.
  - `next build`: Compila el proyecto para producción.
  - `next start`: Inicia el servidor en modo producción.
  - `next lint`: Ejecuta el linter para verificar el código.

## Estructura de Base de Datos
### Tablas Principales
1. **cuentas**:
   - `id`: UUID (Primary Key)
   - `user_id`: UUID (Referencia a auth.users)
   - `nombre`: TEXT
   - `idioma`: TEXT
   - `example_tweets`: JSONB
   - `tweet_analyses`: JSONB
   - `created_at`: TIMESTAMP WITH TIME ZONE

2. **voces_cuenta**:
   - `id`: UUID (Primary Key)
   - `cuenta_id`: UUID (Referencia a cuentas)
   - `voz`: TEXT
   - `created_at`: TIMESTAMP WITH TIME ZONE
   - `updated_at`: TIMESTAMP WITH TIME ZONE

3. **contenido**:
   - `id`: SERIAL (Primary Key)
   - `cuenta_id`: UUID (Referencia a cuentas)
   - `contexto`: TEXT
   - `tweets`: TEXT[]
   - `estado`: CHARACTER VARYING(20) DEFAULT 'borrador'
   - `necesita_imagen`: BOOLEAN DEFAULT FALSE
   - `prompt_imagen`: TEXT
   - `fecha_creacion`: TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
   - `ideas_principales`: TEXT
   - `user_id`: UUID (Referencia a auth.users)
   - `es_thread`: BOOLEAN DEFAULT FALSE
   - `longitud`: CHARACTER VARYING(20) DEFAULT 'mediano'

### Políticas de Seguridad
- Implementadas políticas RLS (Row Level Security) en todas las tablas
- Acceso restringido por usuario mediante auth.uid()
- Políticas CRUD específicas para cada tabla

## Herramientas de Desarrollo
- **ESLint**: Herramienta de linting para mantener la calidad del código.
- **PostCSS**: Procesador de CSS con plugins para transformaciones modernas.
- **Tailwind Forms**: Plugin de Tailwind para estilizar formularios.

## Limitaciones Técnicas
- **Dependencia de APIs externas**: 
  - OpenAI para generación de contenido y análisis de tweets.
  - Supabase para base de datos y autenticación.
  - Google Authenticator para seguridad.
- **Compatibilidad del navegador**: Requiere navegadores modernos que soporten las últimas características de JavaScript.
- **Seguridad**: 
  - Acceso limitado mediante Google Authenticator.
  - Necesidad de mantener tokens y claves de API seguros.
  - Políticas RLS implementadas para protección de datos.

## Integración con OpenAI
- **Análisis de Tweets**: Utiliza la API de OpenAI para analizar el estilo y contenido de los tweets.
- **Generación de Voz**: Sistema de síntesis para crear una voz única para cada cuenta basada en análisis de tweets.
- **Prompts Personalizados**: Implementación de prompts específicos para diferentes aspectos del análisis y generación de contenido.
