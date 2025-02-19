'use client';
import { useState, useEffect, useRef } from 'react';

export default function TimelineCanvas({ episodes = [], onUpdatePosition, onConnect }) {
  const canvasRef = useRef(null);
  const [nodes, setNodes] = useState([]);

  const [tooltip, setTooltip] = useState({ show: false, text: '', x: 0, y: 0 });

  // Convertir episodios a nodos cuando cambian
  useEffect(() => {
    // Convertir episodios a nodos
    const newNodes = episodes.map(episode => ({
      id: episode.id,
      title: episode.title,
      x: episode.position_x || 100, // Valor por defecto si no hay posición
      y: episode.position_y || 100,
      selected: false,
      data: episode
    }));
    setNodes(newNodes);

    // Configurar conexiones desde los episodios
    const newConnections = episodes.reduce((acc, episode) => {
      if (episode.connections) {
        return [...acc, ...episode.connections];
      }
      return acc;
    }, []);
    setConnections(newConnections);
  }, [episodes]);

  // Manejar el movimiento del mouse para tooltips
  const handleMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (dragging) {
      setNodes(nodes.map(node => 
        node.id === dragging 
          ? { ...node, x, y }
          : node
      ));
      return;
    }

    // Verificar si el mouse está sobre un nodo
    const hoveredNode = nodes.find(node => {
      const dx = node.x - x;
      const dy = node.y - y;
      return Math.sqrt(dx * dx + dy * dy) < 20;
    });

    if (hoveredNode) {
      setTooltip({
        show: true,
        text: `${hoveredNode.title}\n${hoveredNode.data.description || ''}\nTipo: ${hoveredNode.data.closure_type}\nArco: ${hoveredNode.data.arc_name || 'N/A'}`,
        x: hoveredNode.x,
        y: hoveredNode.y - 30
      });
    } else {
      setTooltip({ show: false, text: '', x: 0, y: 0 });
    }
  };
  const [dragging, setDragging] = useState(null);
  const [connecting, setConnecting] = useState(null);
  const [connections, setConnections] = useState([]);

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

    // Dibujar el canvas
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Dibujar conexiones
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 2;
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
        ctx.fillStyle = node.selected ? '#4f46e5' : '#1f2937';
        ctx.beginPath();
        ctx.arc(node.x, node.y, 20, 0, Math.PI * 2);
        ctx.fill();
        
        // Texto del nodo
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.title.substring(0, 8), node.x, node.y);
      });
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
      cancelAnimationFrame(animationFrame);
    };
  }, [nodes, connections]);

  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Verificar si se hizo clic en un nodo existente
    const clickedNode = nodes.find(node => {
      const dx = node.x - x;
      const dy = node.y - y;
      return Math.sqrt(dx * dx + dy * dy) < 20;
    });

    if (clickedNode) {
      if (e.shiftKey && !connecting) {
        // Iniciar conexión
        setConnecting(clickedNode.id);
      } else {
        // Iniciar arrastre
        setDragging(clickedNode.id);
        setNodes(nodes.map(node => ({
          ...node,
          selected: node.id === clickedNode.id
        })));
      }
    } else if (!connecting) {
      // No creamos nodos nuevos aquí, ya que los nodos vienen de la base de datos
      return;
    }
  };

  // Manejar cuando se suelta un nodo después de arrastrarlo
  const handleNodeDragEnd = async (nodeId, x, y) => {
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
  };

  // Manejar cuando se crea una nueva conexión
  const handleConnect = async (startId, endId) => {
    if (onConnect) {
      try {
        await onConnect(startId, endId);
        setConnections([...connections, { start: startId, end: endId }]);
      } catch (error) {
        console.error('Error creating connection:', error);
      }
    }
  };

  const handleMouseUp = async (e) => {
    if (connecting) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Verificar si se soltó sobre otro nodo
      const targetNode = nodes.find(node => {
        const dx = node.x - x;
        const dy = node.y - y;
        return Math.sqrt(dx * dx + dy * dy) < 20 && node.id !== connecting;
      });

      if (targetNode) {
        await handleConnect(connecting, targetNode.id);
      }
      setConnecting(null);
    } else if (dragging) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      await handleNodeDragEnd(dragging, x, y);
      setDragging(null);
    }
  };

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
      {/* Instrucciones */}
      <div className="absolute bottom-4 left-4 text-sm text-text-primary opacity-70">
        <p>Shift + Click y arrastrar para conectar episodios</p>
        <p>Click y arrastrar para mover episodios</p>
        <p>Hover sobre un episodio para ver detalles</p>
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
    </div>
  );
}
