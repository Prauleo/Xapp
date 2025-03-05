# Plan de Implementación

## Sección 1: Mejoras en el Canvas

- **Tarea 1**: Eliminar el grid del fondo del canvas
  - **Pasos**:
    1. Modificar el archivo `src/components/TimelineCanvas.js`
    2. Localizar la función `drawGrid` (aproximadamente en la línea 323)
    3. Eliminar la llamada a esta función en la función `draw` o comentarla (alrededor de la línea 317)
    4. Alternativa: modificar la función para que el grid sea casi invisible con `ctx.strokeStyle = 'rgba(200, 200, 200, 0.05)'` en lugar de `'rgba(200, 200, 200, 0.2)'`
  - **Criterio de éxito**: Al cargar la página, el canvas ya no muestra el grid o es apenas perceptible

- **Tarea 2**: Mejorar el contraste y visibilidad de los nodos
  - **Pasos**:
    1. En el mismo archivo `src/components/TimelineCanvas.js`
    2. Localizar la sección donde se dibujan los nodos (alrededor de la línea 335)
    3. Aumentar el tamaño de los nodos y/o el grosor del borde para hacerlos más destacados
    4. Modificar el código así:
       ```jsx
       // Aumentar tamaño de nodos
       const nodeRadius = node.displayMode === 'detailed' ? 35 : 25; // Valores originales eran 30 y 20

       // Para nodos sin imagen, usar colores más vibrantes
       ctx.fillStyle = node.selected ? '#4f46e5' : node.isArchived ? '#9ca3af' : '#1f2937';
       // Agregar sombra para dar profundidad
       ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
       ctx.shadowBlur = 5;
       ctx.shadowOffsetX = 2;
       ctx.shadowOffsetY = 2;
       ```
  - **Criterio de éxito**: Los nodos se ven más prominentes y legibles sobre el fondo del canvas

## Sección 2: Reorganización del Layout

- **Tarea 1**: Modificar la estructura de la página para dar más espacio al canvas
  - **Pasos**:
    1. Abrir el archivo `src/app/cuenta/[id]/instagram/page.js`
    2. Localizar la sección `NarrativaSection` (alrededor de la línea 30)
    3. Modificar el grid para cambiar de 50/50 a 70/30:
       ```jsx
       // Cambiar
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
       // Por
       <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
         {/* Panel lateral (30%) */}
         <div className="lg:col-span-3 space-y-6">
           {/* Formulario y filtros aquí */}
         </div>
         {/* Canvas principal (70%) */}
         <div className="lg:col-span-7 space-y-6">
           {/* Canvas aquí */}
         </div>
       </div>
       ```
    4. Reorganizar los componentes internos para adaptarse a la nueva estructura
  - **Criterio de éxito**: Al cargar la página, el canvas ocupa aproximadamente el 70% del ancho disponible

- **Tarea 2**: Aumentar la altura del canvas para aprovechar mejor el espacio vertical
  - **Pasos**:
    1. En el mismo archivo `src/app/cuenta/[id]/instagram/page.js`
    2. Localizar el div que contiene el canvas (buscar `className="h-[500px]"`)
    3. Aumentar la altura:
       ```jsx
       // Cambiar 
       <div className="flex border-2 border-border rounded-lg h-[500px] relative overflow-hidden">
       // Por
       <div className="flex border-2 border-border rounded-lg h-[700px] relative overflow-hidden">
       ```
  - **Criterio de éxito**: El canvas es visiblemente más alto que antes

## Sección 3: Panel Lateral Contraíble

- **Tarea 1**: Implementar un sistema para contraer/expandir el panel lateral
  - **Pasos**:
    1. Abrir el archivo `src/app/cuenta/[id]/instagram/page.js`
    2. Añadir un estado para controlar si el panel está contraído:
       ```jsx
       const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
       ```
    3. Modificar el contenedor del panel lateral:
       ```jsx
       <div className={`transition-all duration-300 ${
         isPanelCollapsed 
           ? 'lg:col-span-1 overflow-hidden' 
           : 'lg:col-span-3'
       } space-y-6`}>
         {/* Botón para contraer/expandir */}
         <button 
           onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
           className="absolute left-0 top-1/2 bg-bg-secondary p-2 rounded-r-lg border border-border z-10"
         >
           <svg className="w-4 h-4 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={
               isPanelCollapsed 
                 ? "M13 5l7 7-7 7M5 5l7 7-7 7" // Flechas derecha
                 : "M19 12H5M11 19l-7-7 7-7" // Flechas izquierda
             } />
           </svg>
         </button>
         
         {/* Contenido del panel que se muestra/oculta */}
         <div className={`${isPanelCollapsed ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
           {/* Formulario y filtros aquí */}
         </div>
       </div>
       
       {/* Ajustar el tamaño del canvas cuando se contrae el panel */}
       <div className={`transition-all duration-300 ${
         isPanelCollapsed ? 'lg:col-span-9' : 'lg:col-span-7'
       } space-y-6`}>
         {/* Canvas aquí */}
       </div>
       ```
  - **Criterio de éxito**: Al hacer clic en el botón, el panel lateral se contrae y el canvas se expande para ocupar el espacio liberado

- **Tarea 2**: Crear versiones compactas de los formularios para el panel contraído
  - **Pasos**:
    1. En el mismo archivo `src/app/cuenta/[id]/instagram/page.js`
    2. Modificar el componente `NarrativaSection` para incluir una versión compacta del formulario:
       ```jsx
       {isPanelCollapsed ? (
         <div className="p-4 bg-bg-secondary rounded-lg border border-border">
           <div className="flex flex-col items-center space-y-2">
             <button 
               className="p-3 bg-accent text-text-primary rounded-full"
               onClick={() => setIsPanelCollapsed(false)}
               title="Expandir para crear episodio"
             >
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
               </svg>
             </button>
             <span className="text-sm text-text-primary">Nuevo</span>
           </div>
         </div>
       ) : (
         <div className="p-6 bg-bg-secondary rounded-lg border border-border">
           {/* Formulario completo existente */}
         </div>
       )}
       ```
  - **Criterio de éxito**: Cuando el panel está contraído, se muestra una versión compacta con íconos, y cuando está expandido, se muestra el formulario completo

## Sección 4: Funcionalidad de Edición/Eliminación de Episodios

- **Tarea 1**: Implementar un menú contextual para los nodos del canvas
  - **Pasos**:
    1. Abrir el archivo `src/components/TimelineCanvas.js`
    2. Añadir un nuevo estado para el menú contextual:
       ```jsx
       const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, nodeId: null });
       ```
    3. Modificar el manejador de eventos `handleMouseDown` para detectar click derecho y mostrar el menú:
       ```jsx
       const handleMouseDown = useCallback((e) => {
         // Evitar que aparezca el menú contextual del navegador
         if (e.button === 2) {
           e.preventDefault();
           
           const canvasPos = mouseToCanvas(e.clientX, e.clientY);
           
           // Verificar si se hizo clic derecho en un nodo
           const clickedNode = nodes.find(node => {
             const dx = node.x - canvasPos.x;
             const dy = node.y - canvasPos.y;
             const nodeRadius = node.displayMode === 'detailed' ? 30 : 20;
             return Math.sqrt(dx * dx + dy * dy) < nodeRadius;
           });
           
           if (clickedNode) {
             setContextMenu({
               show: true,
               x: e.clientX,
               y: e.clientY,
               nodeId: clickedNode.id
             });
             return;
           }
         }
         
         // Resto del código existente para handleMouseDown
         // ...
       }, [mouseToCanvas, nodes, connecting, selectedNodes]);
       
       // Agregar manejador para cerrar el menú al hacer clic en cualquier parte
       const handleCloseContextMenu = useCallback(() => {
         setContextMenu({ show: false, x: 0, y: 0, nodeId: null });
       }, []);
       
       // Añadir event listener para cerrar el menú
       useEffect(() => {
         window.addEventListener('click', handleCloseContextMenu);
         // Prevenir el menú contextual del navegador
         const handleContextMenu = (e) => e.preventDefault();
         canvasRef.current?.addEventListener('contextmenu', handleContextMenu);
         
         return () => {
           window.removeEventListener('click', handleCloseContextMenu);
           canvasRef.current?.removeEventListener('contextmenu', handleContextMenu);
         };
       }, [handleCloseContextMenu]);
       ```
    4. Añadir el componente de menú contextual al JSX del componente:
       ```jsx
       {/* Menú contextual */}
       {contextMenu.show && (
         <div 
           className="absolute z-20 bg-bg-secondary border border-border rounded-lg shadow-lg overflow-hidden"
           style={{ 
             left: contextMenu.x,
             top: contextMenu.y,
           }}
           onClick={(e) => e.stopPropagation()} // Evitar que se cierre al hacer clic en el menú
         >
           <div className="flex flex-col min-w-[150px]">
             <button
               className="p-2 hover:bg-accent/20 text-text-primary text-left flex items-center gap-2"
               onClick={() => {
                 // Lógica para editar
                 onEditNode && onEditNode(contextMenu.nodeId);
                 setContextMenu({ show: false, x: 0, y: 0, nodeId: null });
               }}
             >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
               </svg>
               Editar
             </button>
             <button
               className="p-2 hover:bg-accent/20 text-text-primary text-left flex items-center gap-2"
               onClick={() => {
                 // Lógica para eliminar
                 onDeleteNode && onDeleteNode(contextMenu.nodeId);
                 setContextMenu({ show: false, x: 0, y: 0, nodeId: null });
               }}
             >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
               </svg>
               Eliminar
             </button>
             <button
               className="p-2 hover:bg-accent/20 text-text-primary text-left flex items-center gap-2"
               onClick={() => {
                 // Lógica para cambiar modo de visualización
                 toggleDisplayMode(contextMenu.nodeId);
                 setContextMenu({ show: false, x: 0, y: 0, nodeId: null });
               }}
             >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
               </svg>
               Cambiar vista
             </button>
           </div>
         </div>
       )}
       ```
  - **Criterio de éxito**: Al hacer clic derecho sobre un nodo, aparece un menú contextual con opciones para Editar, Eliminar y Cambiar vista

- **Tarea 2**: Implementar la funcionalidad de editar episodios
  - **Pasos**:
    1. Abrir el archivo `src/app/cuenta/[id]/instagram/page.js`
    2. Añadir estados para el modal de edición:
       ```jsx
       const [isEditModalOpen, setIsEditModalOpen] = useState(false);
       const [currentEditingEpisode, setCurrentEditingEpisode] = useState(null);
       ```
    3. Añadir la función para editar episodios:
       ```jsx
       const handleEditEpisode = async (editedData) => {
         try {
           const { data: episode, error } = await supabase
             .from('narrative_episodes')
             .update({
               title: editedData.title,
               description: editedData.description,
               closure_type: editedData.closure,
               tags: editedData.tags,
               arc_name: editedData.arc,
               updated_at: new Date().toISOString()
             })
             .eq('id', currentEditingEpisode.id)
             .select();

           if (error) throw error;

           // Actualizar el episodio en el estado local
           setEpisodes(episodes.map(ep => 
             ep.id === currentEditingEpisode.id ? { ...ep, ...episode } : ep
           ));

           // Cerrar el modal
           setIsEditModalOpen(false);
           setCurrentEditingEpisode(null);

           alert('Episodio actualizado exitosamente');
         } catch (err) {
           console.error('Error updating episode:', err);
           alert(`Error al actualizar el episodio: ${err.message || 'Error desconocido'}`);
         }
       };
       ```
    4. Agregar el modal de edición en el JSX:
       ```jsx
       {/* Modal de Edición */}
       {isEditModalOpen && currentEditingEpisode && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
           <div className="bg-bg-secondary rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
             <h3 className="text-xl font-semibold mb-4 text-text-primary">Editar Episodio</h3>
             
             {/* Formulario de edición - similar al de creación pero con valores por defecto */}
             <div className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-text-primary mb-2">Título</label>
                 <input 
                   type="text" 
                   value={title} 
                   onChange={(e) => setTitle(e.target.value)}
                   className="w-full p-2 bg-bg-primary border border-border rounded-lg text-text-primary" 
                   defaultValue={currentEditingEpisode.title}
                 />
               </div>
               
               {/* Resto de campos del formulario */}
               
               <div className="flex gap-2 mt-6">
                 <button
                   onClick={() => {
                     handleEditEpisode({
                       title,
                       description,
                       closure,
                       tags,
                       arc
                     });
                   }}
                   className="flex-1 bg-accent text-text-primary px-4 py-2 rounded-lg hover:opacity-90"
                 >
                   Guardar Cambios
                 </button>
                 <button
                   onClick={() => {
                     setIsEditModalOpen(false);
                     setCurrentEditingEpisode(null);
                   }}
                   className="flex-1 bg-bg-primary text-text-primary px-4 py-2 rounded-lg border border-border hover:bg-bg-primary/70"
                 >
                   Cancelar
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}
       ```
    5. Pasar la función al componente TimelineCanvas:
       ```jsx
       <TimelineCanvas 
         // Propiedades existentes...
         onEditNode={(nodeId) => {
           const episodeToEdit = episodes.find(ep => ep.id === nodeId);
           if (episodeToEdit) {
             setCurrentEditingEpisode(episodeToEdit);
             setTitle(episodeToEdit.title);
             setDescription(episodeToEdit.description || '');
             setClosure(episodeToEdit.closure_type || 'complete');
             setTags(episodeToEdit.tags || []);
             setArc(episodeToEdit.arc_name || '');
             setIsEditModalOpen(true);
           }
         }}
       />
       ```
  - **Criterio de éxito**: Al seleccionar "Editar" en el menú contextual de un nodo, se abre un modal que permite editar los detalles del episodio

- **Tarea 3**: Implementar la funcionalidad de eliminar episodios
  - **Pasos**:
    1. Continuar en `src/app/cuenta/[id]/instagram/page.js`
    2. Añadir estados para el modal de confirmación:
       ```jsx
       const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
       const [episodeToDelete, setEpisodeToDelete] = useState(null);
       ```
    3. Añadir la función para eliminar episodios:
       ```jsx
       const handleDeleteEpisode = async () => {
         if (!episodeToDelete) return;
         
         try {
           // Primero eliminar las conexiones relacionadas
           const { error: connError } = await supabase
             .from('episode_connections')
             .delete()
             .or(`from_episode_id.eq.${episodeToDelete},to_episode_id.eq.${episodeToDelete}`);

           if (connError) throw connError;
           
           // Luego eliminar el episodio
           const { error } = await supabase
             .from('narrative_episodes')
             .delete()
             .eq('id', episodeToDelete);

           if (error) throw error;

           // Actualizar el estado local
           setEpisodes(episodes.filter(ep => ep.id !== episodeToDelete));
           
           // Cerrar el modal
           setIsDeleteModalOpen(false);
           setEpisodeToDelete(null);

           alert('Episodio eliminado exitosamente');
         } catch (err) {
           console.error('Error deleting episode:', err);
           alert(`Error al eliminar el episodio: ${err.message || 'Error desconocido'}`);
         }
       };
       ```
    4. Agregar el modal de confirmación en el JSX:
       ```jsx
       {/* Modal de Confirmación de Eliminación */}
       {isDeleteModalOpen && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
           <div className="bg-bg-secondary rounded-lg p-6 max-w-md w-full">
             <h3 className="text-xl font-semibold mb-4 text-text-primary">Confirmar Eliminación</h3>
             <p className="text-text-primary mb-6">
               ¿Estás seguro de que deseas eliminar este episodio? Esta acción no se puede deshacer.
             </p>
             
             <div className="flex gap-2">
               <button
                 onClick={handleDeleteEpisode}
                 className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
               >
                 Eliminar
               </button>
               <button
                 onClick={() => {
                   setIsDeleteModalOpen(false);
                   setEpisodeToDelete(null);
                 }}
                 className="flex-1 bg-bg-primary text-text-primary px-4 py-2 rounded-lg border border-border hover:bg-bg-primary/70"
               >
                 Cancelar
               </button>
             </div>
           </div>
         </div>
       )}
       ```
    5. Pasar la función al componente TimelineCanvas:
       ```jsx
       <TimelineCanvas 
         // Propiedades existentes...
         onDeleteNode={(nodeId) => {
           setEpisodeToDelete(nodeId);
           setIsDeleteModalOpen(true);
         }}
       />
       ```
  - **Criterio de éxito**: Al seleccionar "Eliminar" en el menú contextual de un nodo, se abre un modal de confirmación y, si se confirma, el episodio se elimina del canvas y de la base de datos

## Sección 5: Optimizar EpisodeLibrary

- **Tarea 1**: Implementar una versión más compacta del componente EpisodeLibrary
  - **Pasos**:
    1. Abrir el archivo `src/components/EpisodeLibrary.js`
    2. Añadir una prop para el modo compacto:
       ```jsx
       export default function EpisodeLibrary({ 
         episodes = [], 
         onArchiveToggle, 
         onAddToCanvas,
         className = '',
         compact = false // Nueva prop
       }) {
       ```
    3. Modificar el JSX para tener una versión compacta:
       ```jsx
       return (
         <div className={`flex flex-col h-full ${className}`}>
           {/* Barra de búsqueda y filtros - versión compacta o completa */}
           <div className={`${compact ? 'p-2' : 'p-4'} bg-bg-secondary border-b border-border`}>
             {!compact ? (
               <>
                 <div className="mb-4">
                   <input
                     type="text"
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     placeholder="Buscar episodios..."
                     className="w-full p-2 bg-bg-primary border border-border rounded-lg text-text-primary"
                   />
                 </div>
                 
                 <div className="flex flex-wrap gap-2 mb-4">
                   <select
                     value={filterTag}
                     onChange={(e) => setFilterTag(e.target.value)}
                     className="flex-1 p-2 bg-bg-primary border border-border rounded-lg text-text-primary"
                   >
                     <option value="">Todos los tags</option>
                     {availableTags.map(tag => (
                       <option key={tag} value={tag}>{tag}</option>
                     ))}
                   </select>
                   
                   <select
                     value={filterArc}
                     onChange={(e) => setFilterArc(e.target.value)}
                     className="flex-1 p-2 bg-bg-primary border border-border rounded-lg text-text-primary"
                   >
                     <option value="">Todos los arcos</option>
                     {availableArcs.map(arc => (
                       <option key={arc} value={arc}>{arc}</option>
                     ))}
                   </select>
                 </div>
                 
                 <div className="flex items-center">
                   <label className="flex items-center text-text-primary cursor-pointer">
                     <input
                       type="checkbox"
                       checked={showArchived}
                       onChange={() => setShowArchived(!showArchived)}
                       className="mr-2"
                     />
                     Mostrar archivados
                   </label>
                 </div>
               </>
             ) : (
               <div className="flex justify-between items-center">
                 <input
                   type="text"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   placeholder="Buscar..."
                   className="w-full p-1 text-sm bg-bg-primary border border-border rounded-lg text-text-primary"
                 />
                 <button
                   onClick={() => setShowArchived(!showArchived)}
                   className={`ml-2 p-1 rounded-lg ${showArchived ? 'bg-accent' : 'bg-bg-primary'}`}
                   title={showArchived ? "Ocultar archivados" : "Mostrar archivados"}
                 >
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                   </svg>
                 </button>
               </div>
             )}
           </div>
           
           {/* Lista de episodios - versión compacta o completa */}
           <div className="flex-1 overflow-y-auto p-2">
             {filteredEpisodes().length === 0 ? (
               <div className={`text-center ${compact ? 'py-2 text-xs' : 'py-8'} text-text-primary opacity-70`}>
                 No se encontraron episodios
               </div>
             ) : (
               <div className="space-y-3">
                 {filteredEpisodes().map(episode => (
                   <div
                     key={episode.id}
                     className={`${compact ? 'p-2 text-sm' : 'p-3'} rounded-lg border ${
                       episode.is_archived 
                         ? 'bg-bg-primary/50 border-border/50' 
                         : 'bg-bg-secondary border-border'
                     } cursor-grab transition-colors hover:border-accent`}
                     draggable
                     onDragStart={(e) => handleDragStart(e, episode)}
                     onClick={() => onAddToCanvas && onAddToCanvas(episode)}
                   >
                     <div className="flex justify-between items-start mb-2">
                       <h3 className={`${compact ? 'text-sm' : 'text-base'} font-medium ${episode.is_archived ? 'text-text-primary/70' : 'text-text-primary'}`}>
                         {compact ? episode.title.substring(0, 15) + (episode.title.length > 15 ? '...' : '') : episode.title}
                       </h3>
                       
                       <button
                         onClick={(e) => {
                           e.stopPropagation();
                           onArchiveToggle && onArchiveToggle(episode.id, !episode.is_archived);
                         }}
                         className="p-1 text-text-primary/70 hover:text-text-primary"
                         title={episode.is_archived ? "Desarchivar" : "Archivar"}
                       >
                         <svg className={`${compact ? 'w-3 h-3' : 'w-4 h-4'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                         </svg>
                       </button>
                     </div>
                     
                     {!compact && episode.description && (
                       <p className={`text-sm mb-2 line-clamp-
