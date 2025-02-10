'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import Link from 'next/link';

export default function CuentasList() {
  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarCuentas = async () => {
      try {
        const { data, error } = await supabase
          .from('cuentas')
          .select('*')
          .order('creado_en', { ascending: false });
        
        if (error) throw error;
        setCuentas(data || []);
      } catch (err) {
        console.error('Error cargando cuentas:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    cargarCuentas();
  }, []);

  if (loading) return <div className="text-center py-4">Cargando cuentas...</div>;
  if (error) return <div className="text-red-500 py-4">Error: {error}</div>;

  return (
    <div className="space-y-4 mt-8">
      <h2 className="text-xl font-semibold mb-4">Cuentas Disponibles</h2>
      {cuentas.length === 0 ? (
        <p className="text-gray-500">No hay cuentas creadas todavía.</p>
      ) : (
        <div className="grid gap-4">
          {cuentas.map((cuenta) => (
            <Link
              key={cuenta.id}
              href={`/cuenta/${cuenta.id}/contenido`}
              className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-medium text-lg">{cuenta.nombre}</h3>
              <p className="text-gray-600 mt-1">{cuenta.descripcion}</p>
              <div className="flex gap-2 mt-2">
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {cuenta.tono}
                </span>
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                  {cuenta.estilo_visual || 'minimalista'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
