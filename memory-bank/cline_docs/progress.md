# Progreso de la Webapp de Gestión de Contenido

## Cambios Implementados
1. **Estructura de la Página de Instagram:**
   - Sección de **Narrativa** con un formulario para crear episodios, incluyendo campos para título, descripción, tipo de cierre, tags y arco narrativo.
   - Integración de un **canvas de línea de tiempo** que permite mover episodios y conectar entre ellos.
   - Sección de **Personal** y **Behind the Scenes** simplificadas, enfocadas en la descripción y una imagen destacada.

2. **Base de Datos:**
   - Creación de tablas en Supabase para almacenar episodios narrativos, tags, conexiones y posts simples.
   - Implementación de funciones en `instagramContent.js` para manejar la creación y obtención de episodios y posts.

3. **Interactividad:**
   - El canvas permite arrastrar y soltar episodios, así como conectar episodios entre sí.
   - Se implementaron tooltips para mostrar información detallada sobre cada episodio al pasar el mouse.

## Próximos Pasos
- Ejecutar la migración de Supabase para crear las tablas necesarias.
- Probar la funcionalidad de la aplicación para asegurar que todo funcione como se espera.
- Documentar cualquier problema encontrado durante las pruebas y realizar ajustes según sea necesario.
