'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '../../../../utils/supabaseClient';
import { generarTweetsAutomaticos } from '../../../../utils/openai';

export default function ContenidoPage() {
  const params = useParams();
  const [cuenta, setCuenta] = useState(null);
  const [contexto, setContexto] = useState('');
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarCuenta = async () => {
      if (!params?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('cuentas')
          .select('*')
          .eq('id', params.id)
          .single();
        
        if (error) throw error;
        setCuenta(data);
      } catch (err) {
        console.error('Error cargando cuenta:', err);
        setError(err.message);
      }
    };

    cargarCuenta();
  }, [params?.id]);

  const generarContenido = async () => {
    if (!contexto.trim()) {
      setError('Por favor, ingresa algún contexto para generar tweets');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const tweetsGenerados = await generarTweetsAutomaticos(contexto, cuenta);
      setTweets(tweetsGenerados);

      // Guardar en Supabase
      const { error: guardarError } = await supabase
        .from('contenido')
        .insert([{
          cuenta_id: params.id,
          contexto: contexto,
          tweets: tweetsGenerados,
          necesita_imagen: false,
          fecha_creacion: new Date().toISOString()
        }]);

      if (guardarError) throw guardarError;
    } catch (err) {
      console.error('Error generando contenido:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!cuenta) return <div className="text-center py-4">Cargando cuenta...</div>;
  if (error) return <div className="text-red-500 py-4">Error: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">{cuenta.nombre}</h1>
        <p className="text-gray-600">{cuenta.descripcion}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Panel de entrada */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Generar Contenido</h2>
          <textarea
            value={contexto}
            onChange={(e) => setContexto(e.target.value)}
            placeholder="Pega aquí el contexto para generar tweets..."
            className="w-full h-48 p-3 border rounded-lg resize-none"
          />
          <button
            onClick={generarContenido}
            disabled={loading}
            className={`w-full py-2 px-4 rounded-lg text-white ${
              loading ? 'bg-blue-300' : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {loading ? 'Generando...' : 'Generar Tweets'}
          </button>
        </div>

        {/* Panel de resultados */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Tweets Generados</h2>
          {tweets.length > 0 ? (
            <div className="space-y-3">
              {tweets.map((tweet, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <p>{tweet}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">
              Los tweets generados aparecerán aquí...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
