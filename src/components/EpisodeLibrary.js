'use client';
import { useState, useEffect, useCallback } from 'react';

export default function EpisodeLibrary({ 
  episodes = [], 
  onArchiveToggle, 
  onAddToCanvas,
  onEditNode,
  onDeleteNode,
  className = ''
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [filterArc, setFilterArc] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [availableTags, setAvailableTags] = useState([]);
  const [availableArcs, setAvailableArcs] = useState([]);

  // Extraer todos los tags y arcos únicos de los episodios
  useEffect(() => {
    const tags = new Set();
    const arcs = new Set();

    episodes.forEach(episode => {
      // Añadir tags
      if (episode.tags && episode.tags.length > 0) {
        episode.tags.forEach(tag => tags.add(tag));
      }
      
      // Añadir arco narrativo
      if (episode.arc_name) {
        arcs.add(episode.arc_name);
      }
    });

    setAvailableTags(Array.from(tags).sort());
    setAvailableArcs(Array.from(arcs).sort());
  }, [episodes]);

  // Filtrar episodios según los criterios
  const filteredEpisodes = useCallback(() => {
    return episodes.filter(episode => {
      // Filtrar por estado de archivo
      if (!showArchived && episode.is_archived) {
        return false;
      }
      
      // Filtrar por término de búsqueda
      if (searchTerm && !episode.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !episode.description?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Filtrar por tag
      if (filterTag && (!episode.tags || !episode.tags.includes(filterTag))) {
        return false;
      }
      
      // Filtrar por arco narrativo
      if (filterArc && episode.arc_name !== filterArc) {
        return false;
      }
      
      return true;
    });
  }, [episodes, searchTerm, filterTag, filterArc, showArchived]);

  // Manejar el inicio de arrastre
  const handleDragStart = (e, episode) => {
    e.dataTransfer.setData('application/json', JSON.stringify(episode));
    e.dataTransfer.effectAllowed = 'copy';
  };

  // Obtener el color para un tag
  const getTagColor = (tag) => {
    const tagColors = {
      'personaje': '#ec4899',
      'lugar': '#3b82f6',
      'evento': '#f97316',
      'trama': '#8b5cf6'
    };
    
    return tagColors[tag.toLowerCase()] || '#6b7280';
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Barra de búsqueda y filtros */}
      <div className="p-4 bg-bg-secondary border-b border-border">
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
      </div>
      
      {/* Lista de episodios */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredEpisodes().length === 0 ? (
          <div className="text-center py-8 text-text-primary opacity-70">
            No se encontraron episodios con los filtros actuales
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEpisodes().map(episode => (
              <div
                key={episode.id}
                className={`p-3 rounded-lg border ${
                  episode.is_archived 
                    ? 'bg-bg-primary/50 border-border/50' 
                    : 'bg-bg-secondary border-border'
                } cursor-grab transition-colors hover:border-accent`}
                draggable
                onDragStart={(e) => handleDragStart(e, episode)}
                onClick={() => onAddToCanvas && onAddToCanvas(episode)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className={`font-medium ${episode.is_archived ? 'text-text-primary/70' : 'text-text-primary'}`}>
                    {episode.title}
                  </h3>
                  
                  <div className="flex space-x-1">
                    {/* Botón Editar */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditNode && onEditNode(episode.id);
                      }}
                      className="p-1 text-text-primary/70 hover:text-text-primary"
                      title="Editar episodio"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    
                    {/* Botón Eliminar */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteNode && onDeleteNode(episode.id);
                      }}
                      className="p-1 text-text-primary/70 hover:text-red-400"
                      title="Eliminar episodio"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    
                    {/* Botón Archivar */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onArchiveToggle && onArchiveToggle(episode.id, !episode.is_archived);
                      }}
                      className="p-1 text-text-primary/70 hover:text-text-primary"
                      title={episode.is_archived ? "Desarchivar" : "Archivar"}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {episode.is_archived ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        )}
                      </svg>
                    </button>
                  </div>
                </div>
                
                {episode.description && (
                  <p className={`text-sm mb-2 line-clamp-2 ${episode.is_archived ? 'text-text-primary/50' : 'text-text-primary/70'}`}>
                    {episode.description}
                  </p>
                )}
                
                <div className="flex flex-wrap gap-1 mt-2">
                  {/* Tipo de cierre */}
                  <span 
                    className={`px-2 py-0.5 text-xs rounded-full ${
                      episode.closure_type === 'complete' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-orange-500/20 text-orange-400'
                    }`}
                  >
                    {episode.closure_type === 'complete' ? 'Completo' : 'Cliffhanger'}
                  </span>
                  
                  {/* Arco narrativo */}
                  {episode.arc_name && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-purple-500/20 text-purple-400">
                      {episode.arc_name}
                    </span>
                  )}
                  
                  {/* Tags */}
                  {episode.tags && episode.tags.map(tag => (
                    <span 
                      key={tag} 
                      className="px-2 py-0.5 text-xs rounded-full"
                      style={{ 
                        backgroundColor: `${getTagColor(tag)}20`, 
                        color: getTagColor(tag) 
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
