'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../../utils/supabaseClient';
import { useAuth } from '../../../../components/AuthProvider';
import WizardioLogo from '../../../../components/WizardioLogo';
import TimelineCanvas from '../../../../components/TimelineCanvas';
import EpisodeLibrary from '../../../../components/EpisodeLibrary';
import { 
  createNarrativeEpisode, 
  getNarrativeEpisodes, 
  createSimplePost, 
  getSimplePosts,
  uploadImageToSupabase,
  toggleEpisodeArchiveStatus
} from '../../../../utils/instagramContent';
import Image from 'next/image';

// Componente para la sección de Narrativa
const NarrativaSection = ({ accountId }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [closure, setClosure] = useState('complete');
  const [tags, setTags] = useState([]);
  const [arc, setArc] = useState('');
  const [newTag, setNewTag] = useState('');
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentEditingEpisode, setCurrentEditingEpisode] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [episodeToDelete, setEpisodeToDelete] = useState(null);
  const fileInputRef = useRef(null);

  // Cargar episodios al montar el componente
  useEffect(() => {
    const loadEpisodes = async () => {
      try {
        const { episodes: loadedEpisodes, error } = await getNarrativeEpisodes(accountId);
        if (error) throw error;
        setEpisodes(loadedEpisodes);
      } catch (err) {
        console.error('Error loading episodes:', err);
        setError('Error al cargar los episodios');
      } finally {
        setLoading(false);
      }
    };

    loadEpisodes();
  }, [accountId]);

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // Manejar la selección de imágenes
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido');
      return;
    }

    setImage(file);
    
    // Crear una URL para la vista previa
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Limpiar la imagen seleccionada
  const handleClearImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveEpisode = async () => {
    if (!title.trim()) {
      alert('Por favor ingresa un título para el episodio');
      return;
    }

    setSaving(true);
    try {
      // Primero subimos la imagen si existe
      let imageUrl = null;
      if (image) {
        const { url, error: uploadError } = await uploadImageToSupabase(image, 'episodes');
        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          throw new Error(`Error al subir la imagen: ${uploadError.message}`);
        }
        imageUrl = url;
      }

      // Luego creamos el episodio con la URL de la imagen
      const { episode, error } = await createNarrativeEpisode({
        accountId,
        title,
        description,
        closure,
        tags,
        arc,
        position: { x: 100, y: 100 }, // Posición inicial por defecto
        connections: [],
        imageUrl
      });

      if (error) throw error;

      // Limpiar el formulario
      setTitle('');
      setDescription('');
      setClosure('complete');
      setTags([]);
      setArc('');
      handleClearImage();

      // Actualizar la lista de episodios
      setEpisodes(prev => [...prev, episode]);

      alert('Episodio creado exitosamente');
    } catch (err) {
      console.error('Error saving episode:', err);
      alert(`Error al guardar el episodio: ${err.message || 'Error desconocido'}`);
    } finally {
      setSaving(false);
    }
  };

  // Función para editar un episodio existente
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
        ep.id === currentEditingEpisode.id ? { ...ep, ...episode[0] } : ep
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

  // Función para eliminar un episodio
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

  if (loading) return <div className="text-center py-4">Cargando episodios...</div>;
  if (error) return <div className="text-red-400 py-4">{error}</div>;

  return (
    <div className="space-y-8">
      {/* Formulario de creación - Layout modificado para dar más espacio al canvas (70/30) */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
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
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Descripción</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full h-32 p-2 bg-bg-primary border border-border rounded-lg text-text-primary resize-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Tipo de Cierre</label>
                  <select
                    value={closure}
                    onChange={(e) => setClosure(e.target.value)}
                    className="w-full p-2 bg-bg-primary border border-border rounded-lg text-text-primary"
                  >
                    <option value="complete">Completo</option>
                    <option value="cliffhanger">Cliffhanger</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Tags</label>
                  <div className="flex gap-2 flex-wrap mb-2">
                    {tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-accent text-text-primary rounded-lg text-sm flex items-center gap-1"
                      >
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-red-400"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                      className="flex-1 p-2 bg-bg-primary border border-border rounded-lg text-text-primary"
                      placeholder="Añadir tag..."
                    />
                    <button
                      onClick={handleAddTag}
                      className="px-4 py-2 bg-accent text-text-primary rounded-lg hover:opacity-90"
                    >
                      Añadir
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Arco Narrativo</label>
                  <input
                    type="text"
                    value={arc}
                    onChange={(e) => setArc(e.target.value)}
                    className="w-full p-2 bg-bg-primary border border-border rounded-lg text-text-primary"
                  />
                </div>
                
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
        {/* Panel lateral (30%) con funcionalidad para contraer/expandir */}
        <div className={`transition-all duration-300 ${
          isPanelCollapsed 
            ? 'lg:col-span-1 overflow-hidden' 
            : 'lg:col-span-3'
        } space-y-6 relative`}>
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
            <div className="p-6 bg-bg-secondary rounded-lg border border-border">
            <h3 className="text-lg font-semibold mb-4 text-text-primary">Detalles del Episodio</h3>
            
            {/* Título */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-primary mb-2">
                Título
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2 bg-bg-primary border border-border rounded-lg text-text-primary"
                placeholder="Título del episodio"
              />
            </div>

            {/* Descripción */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-primary mb-2">
                Descripción
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full h-32 p-2 bg-bg-primary border border-border rounded-lg text-text-primary resize-none"
                placeholder="Describe el episodio..."
              />
            </div>

            {/* Tipo de Cierre */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-primary mb-2">
                Tipo de Cierre
              </label>
              <select
                value={closure}
                onChange={(e) => setClosure(e.target.value)}
                className="w-full p-2 bg-bg-primary border border-border rounded-lg text-text-primary"
              >
                <option value="complete">Completo</option>
                <option value="cliffhanger">Cliffhanger</option>
              </select>
            </div>

            {/* Tags */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-primary mb-2">
                Tags
              </label>
              <div className="flex gap-2 flex-wrap mb-2">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-accent text-text-primary rounded-lg text-sm flex items-center gap-1"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-red-400"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  className="flex-1 p-2 bg-bg-primary border border-border rounded-lg text-text-primary"
                  placeholder="Añadir tag..."
                />
                <button
                  onClick={handleAddTag}
                  className="px-4 py-2 bg-accent text-text-primary rounded-lg hover:opacity-90"
                >
                  Añadir
                </button>
              </div>
            </div>

            {/* Arco Narrativo */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-primary mb-2">
                Arco Narrativo
              </label>
              <input
                type="text"
                value={arc}
                onChange={(e) => setArc(e.target.value)}
                className="w-full p-2 bg-bg-primary border border-border rounded-lg text-text-primary"
                placeholder="Nombre del arco narrativo"
              />
            </div>

            {/* Imagen del Episodio */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-primary mb-2">
                Imagen del Episodio
              </label>
              <div 
                className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:bg-bg-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {imagePreview ? (
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Vista previa" 
                      className="max-h-48 mx-auto rounded-lg"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClearImage();
                      }}
                      className="absolute top-2 right-2 bg-bg-primary text-text-primary rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-500 hover:text-white"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 py-4">
                    <svg className="w-12 h-12 mx-auto text-text-primary opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-text-primary opacity-70">
                      Haz clic para subir una imagen
                    </p>
                    <p className="text-text-primary opacity-50 text-xs">
                      O arrastra y suelta una imagen aquí
                    </p>
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </div>

            {/* Botón de Guardar */}
            <button
              onClick={handleSaveEpisode}
              disabled={saving}
              className="w-full mt-4 bg-accent text-text-primary px-6 py-3 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar Episodio'}
            </button>
            </div>
          </div>
        </div>

        {/* Canvas principal (70% o 90% cuando el panel está contraído) */}
        <div className={`transition-all duration-300 ${
          isPanelCollapsed ? 'lg:col-span-9' : 'lg:col-span-7'
        } space-y-6`}>
          <div className="p-6 bg-bg-secondary rounded-lg border border-border">
            <h3 className="text-lg font-semibold mb-4 text-text-primary">Línea de Tiempo</h3>
            <div className="flex border-2 border-border rounded-lg h-[700px] relative overflow-hidden">
              {/* Biblioteca de Episodios (Panel Lateral) */}
              <div className="w-64 border-r border-border">
                <EpisodeLibrary 
                  episodes={episodes}
                  onArchiveToggle={async (episodeId, isArchived) => {
                    try {
                      const { success, error } = await toggleEpisodeArchiveStatus(episodeId, isArchived);
                      
                      if (error) throw error;
                      
                      // Actualizar el estado local
                      setEpisodes(episodes.map(ep => 
                        ep.id === episodeId 
                          ? { ...ep, is_archived: isArchived }
                          : ep
                      ));
                      
                      // Mostrar mensaje de éxito
                      alert(isArchived ? 'Episodio archivado' : 'Episodio desarchivado');
                    } catch (err) {
                      console.error('Error toggling archive status:', err);
                      alert(`Error: ${err.message || 'Error desconocido'}`);
                    }
                  }}
                  onAddToCanvas={(episode) => {
                    // Añadir el episodio al canvas si está archivado
                    if (episode.is_archived) {
                      toggleEpisodeArchiveStatus(episode.id, false)
                        .then(({ success }) => {
                          if (success) {
                            setEpisodes(episodes.map(ep => 
                              ep.id === episode.id 
                                ? { ...ep, is_archived: false }
                                : ep
                            ));
                          }
                        })
                        .catch(err => {
                          console.error('Error adding episode to canvas:', err);
                        });
                    }
                  }}
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
                  onDeleteNode={(nodeId) => {
                    setEpisodeToDelete(nodeId);
                    setIsDeleteModalOpen(true);
                  }}
                />
              </div>
              
              {/* Canvas Principal */}
              <div className="flex-1">
                <TimelineCanvas 
                  episodes={episodes}
                  onUpdatePosition={async (nodeId, x, y) => {
                    try {
                      const { data: episode, error } = await supabase
                        .from('narrative_episodes')
                        .update({
                          position_x: x,
                          position_y: y,
                          updated_at: new Date().toISOString()
                        })
                        .eq('id', nodeId)
                        .single();

                      if (error) throw error;

                      // Actualizar el episodio en el estado local
                      setEpisodes(episodes.map(ep => 
                        ep.id === nodeId 
                          ? { ...ep, position_x: x, position_y: y }
                          : ep
                      ));
                    } catch (err) {
                      console.error('Error updating episode position:', err);
                      alert('Error al actualizar la posición del episodio');
                    }
                  }}
                  onConnect={async (startId, endId) => {
                    try {
                      const { error } = await supabase
                        .from('episode_connections')
                        .insert({
                          from_episode_id: startId,
                          to_episode_id: endId,
                          created_at: new Date().toISOString()
                        });

                      if (error) throw error;

                      // Actualizar las conexiones en el estado local
                      setEpisodes(episodes.map(ep => {
                        if (ep.id === startId) {
                          return {
                            ...ep,
                            connections: [
                              ...(ep.connections || []),
                              { start: startId, end: endId }
                            ]
                          };
                        }
                        return ep;
                      }));
                    } catch (err) {
                      console.error('Error creating connection:', err);
                      alert('Error al conectar los episodios');
                    }
                  }}
                  onUpdateDisplayMode={async (nodeId, displayMode) => {
                    try {
                      const { data: episode, error } = await supabase
                        .from('narrative_episodes')
                        .update({
                          display_mode: displayMode,
                          updated_at: new Date().toISOString()
                        })
                        .eq('id', nodeId)
                        .single();

                      if (error) throw error;

                      // Actualizar el episodio en el estado local
                      setEpisodes(episodes.map(ep => 
                        ep.id === nodeId 
                          ? { ...ep, display_mode: displayMode }
                          : ep
                      ));
                    } catch (err) {
                      console.error('Error updating display mode:', err);
                      alert('Error al actualizar el modo de visualización');
                    }
                  }}
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
                  onDeleteNode={(nodeId) => {
                    setEpisodeToDelete(nodeId);
                    setIsDeleteModalOpen(true);
                  }}
                />
              </div>
            </div>
          </div>

          {/* Filtros y Leyenda */}
          <div className="p-6 bg-bg-secondary rounded-lg border border-border">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4 text-text-primary">Filtros de Tags</h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <button
                    key={index}
                    className="px-3 py-1 bg-bg-primary text-text-primary rounded-lg border border-border hover:bg-accent/20"
                  >
                    {tag}
                  </button>
                ))}
                {tags.length === 0 && (
                  <p className="text-text-primary opacity-50 text-sm">
                    Añade tags arriba para filtrar el contenido
                  </p>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4 text-text-primary">Leyenda</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#1f2937]"></div>
                  <span className="text-sm text-text-primary">Episodio normal</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#4f46e5]"></div>
                  <span className="text-sm text-text-primary">Episodio seleccionado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-[#666]"></div>
                  <span className="text-sm text-text-primary">Conexión entre episodios</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente para las secciones Personal y Behind the Scenes
const SimpleSection = ({ type, accountId }) => {
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Cargar posts al montar el componente
  useEffect(() => {
    const loadPosts = async () => {
      try {
        const { posts: loadedPosts, error } = await getSimplePosts(accountId, type);
        if (error) throw error;
        setPosts(loadedPosts);
      } catch (err) {
        console.error('Error loading posts:', err);
        setError('Error al cargar los posts');
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [accountId, type]);

  // Manejar la selección de imágenes
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido');
      return;
    }

    setImage(file);
    
    // Crear una URL para la vista previa
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Limpiar la imagen seleccionada
  const handleClearImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSavePost = async () => {
    if (!description.trim()) {
      alert('Por favor ingresa una descripción');
      return;
    }

    setSaving(true);
    try {
      // Primero subimos la imagen si existe
      let imageUrl = null;
      if (image) {
        const { url, error: uploadError } = await uploadImageToSupabase(image, 'posts');
        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          throw new Error(`Error al subir la imagen: ${uploadError.message}`);
        }
        imageUrl = url;
      }

      // Luego creamos el post con la URL de la imagen
      const { post, error } = await createSimplePost({
        accountId,
        type,
        description,
        imageUrl
      });

      if (error) throw error;

      // Limpiar el formulario
      setDescription('');
      handleClearImage();

      // Actualizar la lista de posts
      setPosts(prev => [post, ...prev]);

      alert('Post creado exitosamente');
    } catch (err) {
      console.error('Error saving post:', err);
      alert(`Error al guardar el post: ${err.message || 'Error desconocido'}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-4">Cargando posts...</div>;
  if (error) return <div className="text-red-400 py-4">{error}</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="p-6 bg-bg-secondary rounded-lg border border-border">
        <h3 className="text-lg font-semibold mb-4 text-text-primary">
          {type === 'personal' ? 'Post Personal' : 'Behind the Scenes'}
        </h3>
        
        <div className="space-y-4">
          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Descripción
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-40 p-3 bg-bg-primary border border-border rounded-lg resize-none text-text-primary"
              placeholder={type === 'personal' 
                ? "Escribe la descripción de tu post personal..." 
                : "Documenta el proceso creativo..."}
            />
          </div>

          {/* Campo de imagen solo para la sección Personal */}
          {type === 'personal' && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Imagen Destacada
              </label>
              <div 
                className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:bg-bg-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {imagePreview ? (
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Vista previa" 
                      className="max-h-48 mx-auto rounded-lg"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClearImage();
                      }}
                      className="absolute top-2 right-2 bg-bg-primary text-text-primary rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-500 hover:text-white"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 py-4">
                    <svg className="w-12 h-12 mx-auto text-text-primary opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-text-primary opacity-70">
                      Haz clic para subir una imagen
                    </p>
                    <p className="text-text-primary opacity-50 text-xs">
                      O arrastra y suelta una imagen aquí
                    </p>
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </div>
          )}

          {/* Botón de Guardar */}
          <button
            onClick={handleSavePost}
            disabled={saving}
            className="w-full mt-4 bg-accent text-text-primary px-6 py-3 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar Post'}
          </button>
        </div>
      </div>

      {/* Lista de Posts */}
      <div className="space-y-4">
        {posts.map((post) => (
          <div key={post.id} className="p-4 bg-bg-secondary rounded-lg border border-border">
            <p className="text-text-primary">{post.description}</p>
            {post.image_url && (
              <img 
                src={post.image_url} 
                alt="Post" 
                className="mt-4 rounded-lg max-h-64 w-auto"
              />
            )}
            <div className="mt-2 text-sm text-text-primary opacity-70">
              {new Date(post.created_at).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function InstagramPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [account, setAccount] = useState(null);
  const [activeFilter, setActiveFilter] = useState('narrativa'); // Cambiado a 'narrativa' por defecto
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadAccount = async () => {
      if (!params?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('cuentas')
          .select('*')
          .eq('id', params.id)
          .eq('user_id', user.id)
          .single();
        
        if (error || !data) {
          router.push('/');
          return;
        }

        setAccount(data);
      } catch (err) {
        console.error('Error loading account:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadAccount();
  }, [params?.id]);

  if (loading) return <div className="text-center py-4 text-text-primary">Loading account...</div>;
  if (error) return <div className="text-red-400 py-4">Error: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="text-center mb-8">
        <WizardioLogo className="mx-auto mb-6" width={100} height={100} />
      </div>
      
      {/* Account Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2 text-text-primary">{account?.nombre}</h1>
        <p className="text-text-primary opacity-70">{account?.descripcion}</p>
      </div>

      {/* Content Filters */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setActiveFilter('narrativa')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeFilter === 'narrativa'
              ? 'bg-accent text-text-primary'
              : 'bg-bg-secondary text-text-primary hover:bg-accent/20'
          }`}
        >
          Narrativa
        </button>
        <button
          onClick={() => setActiveFilter('personal')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeFilter === 'personal'
              ? 'bg-accent text-text-primary'
              : 'bg-bg-secondary text-text-primary hover:bg-accent/20'
          }`}
        >
          Personal
        </button>
        <button
          onClick={() => setActiveFilter('behindScenes')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeFilter === 'behindScenes'
              ? 'bg-accent text-text-primary'
              : 'bg-bg-secondary text-text-primary hover:bg-accent/20'
          }`}
        >
          Behind the Scenes
        </button>
      </div>

      {/* Sección Activa */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-text-primary">
          Sección {activeFilter === 'narrativa' ? 'Narrativa' : 
                   activeFilter === 'personal' ? 'Personal' : 
                   'Behind the Scenes'}
        </h2>
      </div>

      {/* Contenido Específico de cada Sección */}
      {activeFilter === 'narrativa' ? (
        <NarrativaSection accountId={account.id} />
      ) : (
        <SimpleSection type={activeFilter} accountId={account.id} />
      )}
    </div>
  );
};
