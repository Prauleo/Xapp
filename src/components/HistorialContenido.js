'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from './AuthProvider';

export default function ContentHistory({ cuentaId }) {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const deleteContent = async (id) => {
    const confirm = window.confirm('Are you sure you want to delete this content?');
    if (!confirm) return;

    try {
      const { error } = await supabase
        .from('contenido')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update list
      setHistory(history.filter(item => item.id !== id));
    } catch (err) {
      console.error('Error deleting content:', err);
      alert('Error deleting the content');
    }
  };

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('contenido')
          .select('*')
          .eq('cuenta_id', cuentaId)
          .eq('user_id', user.id)
          .order('fecha_creacion', { ascending: false });

        if (error) throw error;
        setHistory(data || []);
      } catch (err) {
        console.error('Error loading history:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (cuentaId && user) {
      loadHistory();
    }
  }, [cuentaId]);

  if (loading) return <div className="text-center py-4 text-text-primary">Loading history...</div>;
  if (error) return <div className="text-red-400 py-4">Error: {error}</div>;

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4 text-text-primary">Content History</h2>
      {history.length === 0 ? (
        <p className="text-text-primary opacity-60">No content generated yet.</p>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <div key={item.id} className="border border-border rounded-lg p-4 bg-bg-secondary relative group">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm text-text-primary opacity-70">
                  {new Date(item.fecha_creacion).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              
              <button 
                onClick={() => deleteContent(item.id)}
                className="absolute -top-2 -right-2 bg-red-500/80 hover:bg-red-500 text-text-primary rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 transform hover:scale-110"
                title="Delete content"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="mb-4">
                <h3 className="font-medium text-text-primary mb-2">Main Ideas:</h3>
                <p className="text-text-primary opacity-80 text-sm">{item.ideas_principales}</p>
              </div>

              <div className="mb-4">
                <h3 className="font-medium text-text-primary mb-2">Context Used:</h3>
                <p className="text-text-primary opacity-80 text-sm">{item.contexto}</p>
              </div>

              <div>
                <h3 className="font-medium text-text-primary mb-2">Generated Tweets:</h3>
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
