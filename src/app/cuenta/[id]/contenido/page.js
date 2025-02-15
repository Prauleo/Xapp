'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../../utils/supabaseClient';
import { useAuth } from '../../../../components/AuthProvider';
import { generarTweetsAutomaticos } from '../../../../utils/openai';
import HistorialContenido from '../../../../components/HistorialContenido';

export default function ContenidoPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [cuenta, setCuenta] = useState(null);
  const [inputs, setInputs] = useState({
    ideasPrincipales: '',
    contexto: '',
    longitud: 'mediano',
    esThread: false
  });
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [vozCuenta, setVozCuenta] = useState(null);

  useEffect(() => {
    const cargarCuenta = async () => {
      if (!params?.id) return;
      
      try {
        // Cargar la cuenta y su voz
        const [cuentaResult, vozResult] = await Promise.all([
          supabase
            .from('cuentas')
            .select('*')
            .eq('id', params.id)
            .eq('user_id', user.id)
            .single(),
          supabase
            .from('voces_cuenta')
            .select('voz')
            .eq('cuenta_id', params.id)
            .single()
        ]);
        
        if (cuentaResult.error || !cuentaResult.data) {
          router.push('/');
          return;
        }

        setCuenta(cuentaResult.data);
        if (!vozResult.error && vozResult.data) {
          setVozCuenta(vozResult.data.voz);
        }
      } catch (err) {
        console.error('Error cargando cuenta:', err);
        setError(err.message);
      }
    };

    cargarCuenta();
  }, [params?.id]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setInputs(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
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
        ideas: inputs.ideasPrincipales,
        contexto: inputs.contexto,
        longitud: inputs.longitud,
        esThread: inputs.esThread
      }, cuenta, vozCuenta);
      setTweets(tweetsGenerados);

      // Guardar en Supabase
      const { error: guardarError } = await supabase
        .from('contenido')
        .insert([{
          cuenta_id: params.id,
          user_id: user.id,
          ideas_principales: inputs.ideasPrincipales,
          contexto: inputs.contexto,
          tweets: tweetsGenerados,
          longitud: inputs.longitud,
          es_thread: inputs.esThread,
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

  if (!cuenta) return <div className="text-center py-4 text-text-primary">Cargando cuenta...</div>;
  if (error) return <div className="text-red-400 py-4">Error: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2 text-text-primary">{cuenta.nombre}</h1>
        <p className="text-text-primary opacity-70">{cuenta.descripcion}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Panel de entrada */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4 text-text-primary">Generar Contenido</h2>
            
            {/* Ideas Principales */}
            <div className="mb-6">
              <label className="block text-lg font-semibold text-text-primary mb-2">
                Ideas Principales ★
              </label>
              <p className="text-sm text-text-primary opacity-70 mb-2">
                Escribe aquí tus ideas principales. Este contenido tendrá la máxima prioridad.
              </p>
              <textarea
                name="ideasPrincipales"
                value={inputs.ideasPrincipales}
                onChange={handleInputChange}
                placeholder="Escribe tus ideas principales aquí..."
                className="w-full h-40 p-3 bg-bg-primary border border-border rounded-lg resize-none text-text-primary placeholder-text-primary/50 focus:ring-2 focus:ring-accent focus:border-accent"
                required
              />
            </div>

            {/* Contexto */}
            <div className="mb-6">
              <label className="block text-lg font-semibold text-text-primary mb-2">
                Contexto de Referencia
              </label>
              <p className="text-sm text-text-primary opacity-70 mb-2">
                Pega aquí artículos o información relevante para dar más contexto a tus ideas.
              </p>
              <textarea
                name="contexto"
                value={inputs.contexto}
                onChange={handleInputChange}
                placeholder="Pega aquí artículos o tweets relevantes..."
                className="w-full h-40 p-3 bg-bg-primary border border-border rounded-lg resize-none text-text-primary placeholder-text-primary/50 focus:ring-2 focus:ring-accent focus:border-accent"
              />
            </div>

            {/* Opciones de Tweet */}
            <div className="mb-6 space-y-4">
              <div>
                <label className="block text-lg font-semibold text-text-primary mb-2">
                  Longitud del Tweet
                </label>
                <select
                  name="longitud"
                  value={inputs.longitud}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-bg-primary border border-border rounded-lg text-text-primary focus:ring-2 focus:ring-accent focus:border-accent"
                >
                  <option value="corto">Corto (hasta 180 caracteres)</option>
                  <option value="mediano">Mediano (180-280 caracteres)</option>
                  <option value="largo">Largo (280-500 caracteres)</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="esThread"
                  checked={inputs.esThread}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-accent border-border rounded focus:ring-accent"
                />
                <label className="text-text-primary">
                  Generar como Thread
                </label>
              </div>
            </div>

            <button
              onClick={generarContenido}
              disabled={loading}
              className={`w-full py-2 px-4 rounded-lg text-text-primary transition-opacity ${
                loading ? 'bg-accent opacity-50 cursor-not-allowed' : 'bg-accent hover:opacity-90'
              }`}
            >
              {loading ? 'Generando...' : 'Generar Tweets'}
            </button>
          </div>
        </div>

        {/* Panel de resultados */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4 text-text-primary">Tweets Generados</h2>
            {tweets.length > 0 ? (
              <div className="space-y-3">
                {tweets.map((tweet, index) => (
                  <div key={index} className="p-4 border border-border rounded-lg bg-bg-secondary">
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-text-primary flex-grow">
                        {inputs.esThread ? tweet : tweet.replace(/^\d+\.\s*/, '')}
                      </p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(tweet.trim());
                          // Opcional: Mostrar una notificación de copiado exitoso
                          const el = document.createElement('div');
                          el.className = 'fixed top-4 right-4 bg-accent text-text-primary px-4 py-2 rounded-lg shadow-lg';
                          el.textContent = '¡Copiado!';
                          document.body.appendChild(el);
                          setTimeout(() => el.remove(), 2000);
                        }}
                        className="p-2 text-text-primary hover:bg-accent/20 rounded-lg transition-colors"
                        title="Copiar tweet"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-primary opacity-60">
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
