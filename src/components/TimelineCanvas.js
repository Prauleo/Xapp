'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

export default function TimelineCanvas({ episodes = [], onUpdatePosition, onConnect, onUpdateDisplayMode, onEditNode, onDeleteNode }) {
  const canvasRef = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [tooltip, setTooltip] = useState({ show: false, text: '', x: 0, y: 0 });
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, nodeId: null });
  const [isInstructionsCollapsed, setIsInstructionsCollapsed] = useState(false);
  
  // Referencia para el estado de panorámica
  const [isPanning, setIsPanning] = useState(false);
  const [startPanPos, setStartPanPos] = useState({ x: 0, y: 0 });
  
  // Estados para arrastrar y conectar nodos
  const [dragging, setDragging] = useState(null);
  const [connecting, setConnecting] = useState(null);
  const [connections, setConnections] = useState([]);
  
  // Cargar imágenes para los nodos
  const [nodeImages, setNodeImages] = useState({});

  // Convertir coordenadas del mouse a coordenadas del canvas
  const mouseToCanvas = useCallback((mouseX, mouseY) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (mouseX - rect.left - offset.x) / scale,
      y: (mouseY - rect.top - offset.y) / scale
    };
  }, [offset, scale]);

  // Convertir coordenadas del canvas a coordenadas del mouse
  const canvasToMouse = useCallback((canvasX, canvasY) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: canvasX * scale + offset.x + rect.left,
      y: canvasY * scale + offset.y + rect.top
    };
  }, [offset, scale]);

  useEffect(() => {
    // Filtrar episodios archivados si no se están mostrando
    const filteredEpisodes = showArchived 
      ? episodes 
      : episodes.filter(episode => !episode.is_archived);
    
    // Convertir episodios a nodos
    const newNodes = filteredEpisodes.map(episode => ({
      id: episode.id,
      title: episode.title,
      x: episode.position_x || 100, // Valor por defecto si no hay posición
      y: episode.position_y || 100,
      selected: selectedNodes.includes(episode.id),
      data: episode,
      imageUrl: episode.image_url,
      displayMode: episode.display_mode || 'compact',
      isArchived: episode.is_archived || false
    }));
    setNodes(newNodes);

    // Configurar conexiones desde los episodios
    const newConnections = filteredEpisodes.reduce((acc, episode) => {
      if (episode.connections) {
        return [...acc, ...episode.connections];
      }
      return acc;
    }, []);
    setConnections(newConnections);

    // Precargar imágenes para los nodos que tienen URL de imagen
    const loadImages = async () => {
      const images = {};
      for (const episode of filteredEpisodes) {
        if (episode.image_url) {
          try {
            const img = new Image();
            img.src = episode.image_url;
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
            });
            images[episode.id] = img;
          } catch (error) {
            console.error('Error loading image for episode:', episode.id, error);
          }
        }
      }
      setNodeImages(images);
    };

    loadImages();
  }, [episodes, selectedNodes, showArchived]);

  // Manejar el zoom con la rueda del mouse
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const { deltaY } = e;
    const scaleChange = deltaY > 0 ? 0.9 : 1.1; // Reducir o aumentar escala
    
    // Limitar el zoom entre 0.2 y 3
    const newScale = Math.max(0.2, Math.min(3, scale * scaleChange));
    
    // Ajustar el offset para que el zoom se centre en la posición del mouse
    const mousePos = { x: e.clientX, y: e.clientY };
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseCanvasPos = {
      x: mousePos.x - rect.left,
      y: mousePos.y - rect.top
    };
    
    const newOffset = {
      x: mouseCanvasPos.x - (mouseCanvasPos.x - offset.x) * (newScale / scale),
      y: mouseCanvasPos.y - (mouseCanvasPos.y - offset.y) * (newScale / scale)
    };
    
    setScale(newScale);
    setOffset(newOffset);
  }, [scale, offset]);

  // Manejar el movimiento del mouse para tooltips y arrastre
  const handleMouseMove = useCallback((e) => {
    const canvasPos = mouseToCanvas(e.clientX, e.clientY);
    
    // Si estamos en modo panorámica
    if (isPanning) {
      const dx = e.clientX - startPanPos.x;
      const dy = e.clientY - startPanPos.y;
      setOffset({
        x: offset.x + dx,
        y: offset.y + dy
      });
      setStartPanPos({ x: e.clientX, y: e.clientY });
      return;
    }
    
    // Si estamos arrastrando nodos
    if (dragging) {
      // Si hay múltiples nodos seleccionados, moverlos todos
      if (selectedNodes.length > 1 && selectedNodes.includes(dragging)) {
        const draggedNode = nodes.find(node => node.id === dragging);
        const dx = canvasPos.x - draggedNode.x;
        const dy = canvasPos.y - draggedNode.y;
        
        setNodes(nodes.map(node => 
          selectedNodes.includes(node.id)
            ? { ...node, x: node.x + dx, y: node.y + dy }
            : node
        ));
      } else {
        // Si solo hay un nodo, moverlo normalmente
        setNodes(nodes.map(node => 
          node.id === dragging 
            ? { ...node, x: canvasPos.x, y: canvasPos.y }
            : node
        ));
      }
      return;
    }

    // Verificar si el mouse está sobre un nodo
    const hoveredNode = nodes.find(node => {
      const dx = node.x - canvasPos.x;
      const dy = node.y - canvasPos.y;
      const nodeRadius = node.displayMode === 'detailed' ? 30 : 20;
      return Math.sqrt(dx * dx + dy * dy) < nodeRadius;
    });

    if (hoveredNode) {
      const tooltipPos = canvasToMouse(hoveredNode.x, hoveredNode.y);
      setTooltip({
        show: true,
        text: `${hoveredNode.title}\n${hoveredNode.data.description || ''}\nTipo: ${hoveredNode.data.closure_type}\nArco: ${hoveredNode.data.arc_name || 'N/A'}`,
        x: tooltipPos.x,
        y: tooltipPos.y - 30
      });
    } else {
      setTooltip({ show: false, text: '', x: 0, y: 0 });
    }
  }, [canvasToMouse, dragging, isPanning, mouseToCanvas, nodes, offset, selectedNodes, startPanPos.x, startPanPos.y]);

  // Efecto para dibujar el canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Ajustar el tamaño del canvas al contenedor
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Prevenir el comportamiento predeterminado del wheel para evitar el scroll de la página
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    // Dibujar el canvas
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Aplicar transformaciones para zoom y panorámica
      ctx.save();
      ctx.translate(offset.x, offset.y);
      ctx.scale(scale, scale);
      
      // Dibujar una cuadrícula de fondo para referencia visual (casi invisible)
      drawGrid(ctx, canvas.width, canvas.height);
      
      // Dibujar conexiones
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 2 / scale; // Ajustar grosor según escala
      connections.forEach(conn => {
        const start = nodes.find(n => n.id === conn.start);
        const end = nodes.find(n => n.id === conn.end);
        if (start && end) {
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.stroke();
        }
      });

      // Dibujar nodos
      nodes.forEach(node => {
        // Determinar el radio según el modo de visualización (aumentado para mejor visibilidad)
        const nodeRadius = node.displayMode === 'detailed' ? 35 : 25;
        
        // Dibujar círculo de fondo o imagen
        if (nodeImages[node.id]) {
          // Si hay una imagen, dibujarla dentro de un círculo
          ctx.save();
          ctx.beginPath();
          ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2);
          ctx.clip(); // Recortar la imagen en forma de círculo
          
          // Dibujar la imagen
          const img = nodeImages[node.id];
          const size = nodeRadius * 2;
          ctx.drawImage(img, node.x - nodeRadius, node.y - nodeRadius, size, size);
          
          // Dibujar borde
          ctx.strokeStyle = node.selected ? '#4f46e5' : node.isArchived ? '#9ca3af' : '#1f2937';
          ctx.lineWidth = 3 / scale;
          ctx.stroke();
          
          ctx.restore();
        } else {
          // Si no hay imagen, dibujar un círculo de color con sombra
          // Agregar sombra para dar profundidad
          ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
          ctx.shadowBlur = 5;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;
          
          ctx.fillStyle = node.selected ? '#4f46e5' : node.isArchived ? '#9ca3af' : '#1f2937';
          ctx.beginPath();
          ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2);
          ctx.fill();
          
          // Resetear sombra para el resto de elementos
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          
          // Texto del nodo
          ctx.fillStyle = '#fff';
          ctx.font = `${12 / scale}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(node.title.substring(0, 8), node.x, node.y);
        }
        
        // Etiqueta con el título debajo del nodo
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${12 / scale}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        
        // Fondo para el texto
        const textWidth = ctx.measureText(node.title.substring(0, 12)).width + 10 / scale;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(node.x - textWidth/2, node.y + nodeRadius + 2 / scale, textWidth, 18 / scale);
        
        // Texto
        ctx.fillStyle = '#fff';
        ctx.fillText(node.title.substring(0, 12), node.x, node.y + nodeRadius + 5 / scale);
        
        // Si está en modo detallado, mostrar más información
        if (node.displayMode === 'detailed') {
          // Mostrar tipo de cierre con un icono
          const closureIcon = node.data.closure_type === 'complete' ? '✓' : '→';
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(node.x - 15, node.y - nodeRadius - 20 / scale, 30, 18 / scale);
          ctx.fillStyle = node.data.closure_type === 'complete' ? '#4ade80' : '#f97316';
          ctx.fillText(closureIcon, node.x, node.y - nodeRadius - 12 / scale);
          
          // Mostrar tags si existen
          if (node.data.tags && node.data.tags.length > 0) {
            const tagColors = {
              'personaje': '#ec4899',
              'lugar': '#3b82f6',
              'evento': '#f97316',
              'trama': '#8b5cf6'
            };
            
            let tagY = node.y + nodeRadius + 25 / scale;
            node.data.tags.slice(0, 2).forEach((tag, index) => {
              const tagColor = tagColors[tag.toLowerCase()] || '#6b7280';
              const tagWidth = ctx.measureText(tag).width + 10 / scale;
              
              ctx.fillStyle = tagColor;
              ctx.fillRect(node.x - tagWidth/2, tagY, tagWidth, 16 / scale);
              ctx.fillStyle = '#fff';
              ctx.fillText(tag, node.x, tagY + 8 / scale);
              
              tagY += 18 / scale;
            });
          }
        }
      });
      
      ctx.restore();
    };

    // Función para dibujar una cuadrícula de fondo
    const drawGrid = (ctx, width, height) => {
      const gridSize = 50; // Tamaño de la celda de la cuadrícula
      const offsetX = offset.x % (gridSize * scale);
      const offsetY = offset.y % (gridSize * scale);
      
      ctx.strokeStyle = 'rgba(200, 200, 200, 0.05)';
      ctx.lineWidth = 0.5 / scale;
      
      // Líneas verticales
      for (let x = offsetX / scale; x < width / scale; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height / scale);
        ctx.stroke();
      }
      
      // Líneas horizontales
      for (let y = offsetY / scale; y < height / scale; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width / scale, y);
        ctx.stroke();
      }
    };

    // Animación
    let animationFrame;
    const animate = () => {
      draw();
      animationFrame = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('wheel', handleWheel);
      cancelAnimationFrame(animationFrame);
    };
  }, [handleWheel, nodes, connections, offset, scale]);

  // Función para detectar si un punto está dentro de un nodo
  const isPointInNode = useCallback((x, y, node) => {
    const dx = node.x - x;
    const dy = node.y - y;
    // Radio de detección más grande para facilitar el clic
    const nodeRadius = node.displayMode === 'detailed' ? 40 : 30;
    return Math.sqrt(dx * dx + dy * dy) < nodeRadius;
  }, []);

  const handleMouseDown = useCallback((e) => {
    // Obtener las coordenadas del canvas
    const canvasPos = mouseToCanvas(e.clientX, e.clientY);
    
    // Si se hace clic en el menú contextual, no hacer nada
    if (contextMenu.show && e.target.closest('.context-menu')) {
      return;
    }
    
    // Si se hace clic fuera del menú contextual, cerrarlo
    if (contextMenu.show) {
      setContextMenu({ show: false, x: 0, y: 0, nodeId: null });
      
      // Si el clic no fue derecho, no continuar con el resto de la lógica
      if (e.button !== 2) {
        return;
      }
    }
    
    // Manejar clic derecho (menú contextual)
    if (e.button === 2) {
      e.preventDefault(); // Prevenir el menú contextual del navegador
      
      // Buscar si se hizo clic en un nodo
      const clickedNode = nodes.find(node => isPointInNode(canvasPos.x, canvasPos.y, node));
      
      if (clickedNode) {
        // Mostrar el menú contextual
        setContextMenu({
          show: true,
          x: e.clientX,
          y: e.clientY,
          nodeId: clickedNode.id
        });
        return;
      }
      
      return; // Si fue clic derecho pero no en un nodo, no hacer nada más
    }
    
    // Si se presiona la tecla espaciadora, iniciar modo panorámica
    if (e.buttons === 1 && e.altKey) {
      setIsPanning(true);
      setStartPanPos({ x: e.clientX, y: e.clientY });
      return;
    }
    
    // Verificar si se hizo clic en un nodo existente
    const clickedNode = nodes.find(node => {
      const dx = node.x - canvasPos.x;
      const dy = node.y - canvasPos.y;
      const nodeRadius = node.displayMode === 'detailed' ? 30 : 20;
      return Math.sqrt(dx * dx + dy * dy) < nodeRadius;
    });

    if (clickedNode) {
      if (e.shiftKey && !connecting) {
        // Iniciar conexión
        setConnecting(clickedNode.id);
      } else {
        // Iniciar arrastre
        setDragging(clickedNode.id);
        
        // Manejar selección múltiple con Ctrl/Cmd
        if (e.ctrlKey || e.metaKey) {
          setSelectedNodes(prev => 
            prev.includes(clickedNode.id)
              ? prev.filter(id => id !== clickedNode.id)
              : [...prev, clickedNode.id]
          );
        } else if (!selectedNodes.includes(clickedNode.id)) {
          // Si no se presiona Ctrl/Cmd y el nodo no está seleccionado,
          // seleccionar solo este nodo
          setSelectedNodes([clickedNode.id]);
        }
        
        // Actualizar el estado visual de los nodos
        setNodes(nodes.map(node => ({
          ...node,
          selected: e.ctrlKey || e.metaKey
            ? selectedNodes.includes(node.id) || node.id === clickedNode.id
            : node.id === clickedNode.id || selectedNodes.includes(node.id)
        })));
      }
    } else if (!connecting) {
      // Si se hace clic en un espacio vacío sin Ctrl/Cmd, deseleccionar todos los nodos
      if (!e.ctrlKey && !e.metaKey) {
        setSelectedNodes([]);
        setNodes(nodes.map(node => ({
          ...node,
          selected: false
        })));
      }
    }
  }, [mouseToCanvas, nodes, connecting, selectedNodes]);
  
  // Agregar manejador para cerrar el menú al hacer clic en cualquier parte
  const handleCloseContextMenu = useCallback((e) => {
    // No cerrar el menú si el clic fue dentro del menú contextual
    if (e && e.target && e.target.closest('.context-menu')) {
      return;
    }
    setContextMenu({ show: false, x: 0, y: 0, nodeId: null });
  }, []);
  
  // Manejar el evento contextmenu (clic derecho)
  const handleContextMenu = useCallback((e) => {
    e.preventDefault(); // Prevenir el menú contextual del navegador
    
    // El resto de la lógica se maneja en handleMouseDown
  }, []);
  
  // Añadir event listeners
  useEffect(() => {
    // Usamos mousedown en lugar de click para mejor respuesta
    window.addEventListener('mousedown', handleCloseContextMenu);
    
    // Prevenir el menú contextual del navegador
    canvasRef.current?.addEventListener('contextmenu', handleContextMenu);
    
    return () => {
      window.removeEventListener('mousedown', handleCloseContextMenu);
      canvasRef.current?.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [handleCloseContextMenu, handleContextMenu]);

  // Manejar cuando se suelta un nodo después de arrastrarlo
  const handleNodeDragEnd = useCallback(async (nodeId, x, y) => {
    if (onUpdatePosition) {
      try {
        await onUpdatePosition(nodeId, x, y);
      } catch (error) {
        console.error('Error updating node position:', error);
        // Revertir la posición si hay error
        setNodes(nodes.map(node => 
          node.id === nodeId
            ? { ...node, x: node.data.position_x, y: node.data.position_y }
            : node
        ));
      }
    }
  }, [nodes, onUpdatePosition]);

  // Manejar cuando se crea una nueva conexión
  const handleConnect = useCallback(async (startId, endId) => {
    if (onConnect) {
      try {
        await onConnect(startId, endId);
        setConnections([...connections, { start: startId, end: endId }]);
      } catch (error) {
        console.error('Error creating connection:', error);
      }
    }
  }, [connections, onConnect]);

  // Cambiar el modo de visualización de un nodo
  const toggleDisplayMode = useCallback(async (nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    const newMode = node.displayMode === 'compact' ? 'detailed' : 'compact';
    
    if (onUpdateDisplayMode) {
      try {
        await onUpdateDisplayMode(nodeId, newMode);
        // Actualizar el nodo localmente
        setNodes(nodes.map(n => 
          n.id === nodeId ? { ...n, displayMode: newMode } : n
        ));
      } catch (error) {
        console.error('Error updating display mode:', error);
      }
    }
  }, [nodes, onUpdateDisplayMode]);

  // Manejar doble clic para cambiar el modo de visualización
  const handleDoubleClick = useCallback((e) => {
    const canvasPos = mouseToCanvas(e.clientX, e.clientY);
    
    // Verificar si se hizo doble clic en un nodo
    const clickedNode = nodes.find(node => {
      const dx = node.x - canvasPos.x;
      const dy = node.y - canvasPos.y;
      const nodeRadius = node.displayMode === 'detailed' ? 30 : 20;
      return Math.sqrt(dx * dx + dy * dy) < nodeRadius;
    });

    if (clickedNode) {
      toggleDisplayMode(clickedNode.id);
    }
  }, [mouseToCanvas, nodes, toggleDisplayMode]);

  const handleMouseUp = useCallback(async (e) => {
    // Finalizar modo panorámica si estaba activo
    if (isPanning) {
      setIsPanning(false);
      return;
    }
    
    if (connecting) {
      const canvasPos = mouseToCanvas(e.clientX, e.clientY);
      
      // Verificar si se soltó sobre otro nodo
      const targetNode = nodes.find(node => {
        const dx = node.x - canvasPos.x;
        const dy = node.y - canvasPos.y;
        const nodeRadius = node.displayMode === 'detailed' ? 30 : 20;
        return Math.sqrt(dx * dx + dy * dy) < nodeRadius && node.id !== connecting;
      });

      if (targetNode) {
        await handleConnect(connecting, targetNode.id);
      }
      setConnecting(null);
    } else if (dragging) {
      // Si hay múltiples nodos seleccionados, actualizar la posición de todos
      if (selectedNodes.length > 1 && selectedNodes.includes(dragging)) {
        for (const nodeId of selectedNodes) {
          const node = nodes.find(n => n.id === nodeId);
          if (node) {
            await handleNodeDragEnd(nodeId, node.x, node.y);
          }
        }
      } else {
        // Si solo hay un nodo, actualizar su posición
        const node = nodes.find(n => n.id === dragging);
        if (node) {
          await handleNodeDragEnd(dragging, node.x, node.y);
        }
      }
      setDragging(null);
    }
  }, [connecting, dragging, handleConnect, handleNodeDragEnd, isPanning, mouseToCanvas, nodes, selectedNodes]);

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-4 right-4 z-10 flex space-x-2">
        <button
          onClick={() => setScale(prev => Math.min(prev * 1.2, 3))}
          className="p-2 bg-bg-secondary text-text-primary rounded-lg hover:bg-accent/20"
          title="Acercar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
        <button
          onClick={() => setScale(prev => Math.max(prev / 1.2, 0.2))}
          className="p-2 bg-bg-secondary text-text-primary rounded-lg hover:bg-accent/20"
          title="Alejar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 12H6" />
          </svg>
        </button>
        <button
          onClick={() => {
            setScale(1);
            setOffset({ x: 0, y: 0 });
          }}
          className="p-2 bg-bg-secondary text-text-primary rounded-lg hover:bg-accent/20"
          title="Restablecer vista"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
          </svg>
        </button>
        <button
          onClick={() => setShowArchived(prev => !prev)}
          className={`p-2 text-text-primary rounded-lg ${
            showArchived ? 'bg-accent' : 'bg-bg-secondary hover:bg-accent/20'
          }`}
          title={showArchived ? "Ocultar archivados" : "Mostrar archivados"}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
        </button>
      </div>
      
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDoubleClick}
      />
      {/* Instrucciones colapsables */}
      <div className={`absolute bottom-4 left-4 bg-bg-secondary/80 rounded-lg p-3 border border-border transition-all duration-300 ${
        isInstructionsCollapsed ? 'w-10 h-10 overflow-hidden' : 'max-w-xs'
      }`}>
        {/* Botón para colapsar/expandir */}
        <button 
          onClick={() => setIsInstructionsCollapsed(!isInstructionsCollapsed)}
          className="absolute top-2 right-2 p-1 text-text-primary/70 hover:text-text-primary rounded-full bg-bg-primary/50 hover:bg-bg-primary"
          title={isInstructionsCollapsed ? "Mostrar instrucciones" : "Ocultar instrucciones"}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={
              isInstructionsCollapsed 
                ? "M13 10V3L4 14h7v7l9-11h-7z" // Flecha expandir
                : "M19 9l-7 7-7-7" // Flecha colapsar
            } />
          </svg>
        </button>
        
        {/* Contenido de instrucciones */}
        <div className={`text-sm text-text-primary opacity-70 transition-opacity duration-300 ${
          isInstructionsCollapsed ? 'opacity-0' : 'opacity-100'
        }`}>
          <h4 className="font-semibold mb-2">Instrucciones</h4>
          <p>Shift + Click y arrastrar para conectar episodios</p>
          <p>Click y arrastrar para mover episodios</p>
          <p>Ctrl/Cmd + Click para selección múltiple</p>
          <p>Alt + Click y arrastrar para mover el canvas</p>
          <p>Doble click en episodio para cambiar vista</p>
          <p>Rueda del mouse para zoom</p>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip.show && (
        <div 
          className="absolute bg-bg-secondary text-text-primary p-2 rounded-lg border border-border text-sm whitespace-pre-line"
          style={{ 
            left: tooltip.x + 30,
            top: tooltip.y,
            transform: 'translateY(-50%)',
            maxWidth: '200px',
            pointerEvents: 'none'
          }}
        >
          {tooltip.text}
        </div>
      )}

      {/* Menú contextual */}
      {contextMenu.show && (
        <div 
          className="absolute z-50 bg-bg-secondary border border-border rounded-lg shadow-lg overflow-hidden context-menu"
          style={{ 
            left: contextMenu.x,
            top: contextMenu.y,
            pointerEvents: 'auto' // Asegurar que reciba eventos de mouse
          }}
          onClick={(e) => {
            e.stopPropagation(); // Evitar que se cierre al hacer clic en el menú
            e.preventDefault(); // Prevenir comportamiento por defecto
          }}
          onContextMenu={(e) => {
            e.preventDefault(); // Prevenir menú contextual del navegador
            e.stopPropagation();
          }}
        >
          <div className="flex flex-col min-w-[150px] context-menu">
            <button
              className="p-2 hover:bg-accent/20 text-text-primary text-left flex items-center gap-2 context-menu"
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
              className="p-2 hover:bg-accent/20 text-text-primary text-left flex items-center gap-2 context-menu"
              onClick={() => {
                // Lógica para eliminar
                onDeleteNode && onDeleteNode(contextMenu.nodeId);
                setContextMenu({ show: false, x: 0, y: 0, nodeId: null });
              }}
            >
              <svg className="w-4 h-4 context-menu" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span className="context-menu">Eliminar</span>
            </button>
            <button
              className="p-2 hover:bg-accent/20 text-text-primary text-left flex items-center gap-2 context-menu"
              onClick={() => {
                // Lógica para cambiar modo de visualización
                toggleDisplayMode(contextMenu.nodeId);
                setContextMenu({ show: false, x: 0, y: 0, nodeId: null });
              }}
            >
              <svg className="w-4 h-4 context-menu" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span className="context-menu">Cambiar vista</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
