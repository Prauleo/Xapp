'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '../../../../utils/supabaseClient';
import { generarTweetsAutomaticos } from '../../../../utils/openai';
import HistorialContenido from '../../../../components/HistorialContenido';

export default function ContenidoPage() {
  const params = useParams();
  const [cuenta, setCuenta] = useState(null);
  const [inputs, setInputs] = useState({
    ideasPrincipales: '',
    contexto: ''
  });
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputs(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generarContenido = async () => {
    if (!inputs.ideasPrincipales.trim()) {
      setError('Por favor, ingresa tus ideas principales');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const tweetsGenerados = await generarTweetsAutomaticos({
        ideasPrincipales: inputs.ideasPrincipales,
        contexto: inputs.contexto
      }, cuenta);
      setTweets(tweetsGenerados);

      // Guardar en Supabase
      const { error: guardarError } = await supabase
        .from('contenido')
        .insert([{
          cuenta_id: params.id,
          ideas_principales: inputs.ideasPrincipales,
          contexto: inputs.contexto,
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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Panel de entrada */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Generar Contenido</h2>
            
            {/* Ideas Principales */}
            <div className="mb-6">
              <label className="block text-lg font-semibold text-gray-700 mb-2">
                Ideas Principales ★
              </label>
              <p className="text-sm text-gray-600 mb-2">
                Escribe aquí tus ideas principales. Este contenido tendrá la máxima prioridad.
              </p>
              <textarea
                name="ideasPrincipales"
                value={inputs.ideasPrincipales}
                onChange={handleInputChange}
                placeholder="Escribe tus ideas principales aquí..."
                className="w-full h-40 p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Contexto */}
            <div className="mb-6">
              <label className="block text-lg font-semibold text-gray-700 mb-2">
                Contexto de Referencia
              </label>
              <p className="text-sm text-gray-600 mb-2">
                Pega aquí artículos o información relevante para dar más contexto a tus ideas.
              </p>
              <textarea
                name="contexto"
                value={inputs.contexto}
                onChange={handleInputChange}
                placeholder="Pega aquí artículos o tweets relevantes..."
                className="w-full h-40 p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

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
        </div>

        {/* Panel de resultados */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Tweets Generados</h2>
            {tweets.length > 0 ? (
              <div className="space-y-3">
                {tweets.map((tweet, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-white">
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

          {/* Historial de contenido */}
          <HistorialContenido cuentaId={params.id} />
        </div>
      </div>
    </div>
  );
}
