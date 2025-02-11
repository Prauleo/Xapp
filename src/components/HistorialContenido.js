'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from './AuthProvider';

export default function HistorialContenido({ cuentaId }) {
  const { user } = useAuth();
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const borrarContenido = async (id) => {
    const confirmar = window.confirm('¿Estás seguro de que quieres eliminar este contenido?');
    if (!confirmar) return;

    try {
      const { error } = await supabase
        .from('contenido')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Actualizar la lista
      setHistorial(historial.filter(item => item.id !== id));
    } catch (err) {
      console.error('Error borrando contenido:', err);
      alert('Error al borrar el contenido');
    }
  };

  useEffect(() => {
    const cargarHistorial = async () => {
      try {
        const { data, error } = await supabase
          .from('contenido')
          .select('*')
          .eq('cuenta_id', cuentaId)
          .eq('user_id', user.id)
          .order('fecha_creacion', { ascending: false });

        if (error) throw error;
        setHistorial(data || []);
      } catch (err) {
        console.error('Error cargando historial:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (cuentaId && user) {
      cargarHistorial();
    }
  }, [cuentaId]);

  if (loading) return <div className="text-center py-4 text-text-primary">Cargando historial...</div>;
  if (error) return <div className="text-red-400 py-4">Error: {error}</div>;

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4 text-text-primary">Historial de Contenido</h2>
      {historial.length === 0 ? (
        <p className="text-text-primary opacity-60">No hay contenido generado todavía.</p>
      ) : (
        <div className="space-y-4">
          {historial.map((item) => (
            <div key={item.id} className="border border-border rounded-lg p-4 bg-bg-secondary relative group">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm text-text-primary opacity-70">
                  {new Date(item.fecha_creacion).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              
              <button 
                onClick={() => borrarContenido(item.id)}
                className="absolute -top-2 -right-2 bg-red-500/80 hover:bg-red-500 text-text-primary rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 transform hover:scale-110"
                title="Eliminar contenido"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="mb-4">
                <h3 className="font-medium text-text-primary mb-2">Ideas principales:</h3>
                <p className="text-text-primary opacity-80 text-sm">{item.ideas_principales}</p>
              </div>

              <div className="mb-4">
                <h3 className="font-medium text-text-primary mb-2">Contexto utilizado:</h3>
                <p className="text-text-primary opacity-80 text-sm">{item.contexto}</p>
              </div>

              <div>
                <h3 className="font-medium text-text-primary mb-2">Tweets Generados:</h3>
                <div className="space-y-2">
                  {item.tweets && item.tweets.map((tweet, index) => (
                    <div key={index} className="p-3 bg-bg-primary rounded border border-border">
                      <p className="text-text-primary">{tweet}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
