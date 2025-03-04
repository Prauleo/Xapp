## Actualización de Funcionalidad: Generación y Guardado de Prompts de Imagen

### Descripción
Se ha implementado una nueva funcionalidad que permite a los usuarios generar prompts de imagen basados en el texto de los tweets generados. Los usuarios ahora pueden elegir guardar solo aquellos prompts que les gusten, lo que mejora la experiencia de uso y la gestión de contenido.

### Cambios Realizados
1. **Componente PromptGenerator**:
   - Se agregó un botón de "Guardar" junto al prompt generado.
   - Se implementó un sistema de feedback visual que indica si un prompt ha sido guardado.
   - La lógica de generación y guardado se separó para mayor claridad.

2. **Página de Contenido**:
   - Se actualizó para manejar el nuevo sistema de guardado de prompts.
   - Se corrigieron errores relacionados con el guardado en la base de datos.

3. **Historial de Contenido**:
   - Se modificó para mostrar solo los prompts que han sido guardados por el usuario.

### Uso de la Nueva Funcionalidad
- Los usuarios pueden generar tweets normalmente.
- Para cada tweet, pueden generar un prompt de imagen.
- Si el prompt no es satisfactorio, pueden regenerarlo.
- Los prompts que les gusten pueden ser guardados haciendo clic en el botón de "Guardar".
- Los prompts guardados aparecerán en el historial de contenido.

### Beneficios
- Mejora la gestión de contenido al permitir que los usuarios guarden solo lo que realmente les interesa.
- Facilita la creación de contenido visual atractivo basado en los tweets generados.
