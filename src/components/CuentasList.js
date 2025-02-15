'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from './AuthProvider';
import Link from 'next/link';

export default function CuentasList() {
  const { user } = useAuth();
  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const deleteAccount = async (id) => {
    const confirm = window.confirm('Are you sure you want to delete this account?');
    if (!confirm) return;

    try {
      const { error } = await supabase
        .from('cuentas')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update accounts list
      setCuentas(cuentas.filter(account => account.id !== id));
    } catch (err) {
      console.error('Error deleting account:', err);
      alert('Error deleting the account');
    }
  };

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const { data, error } = await supabase
          .from('cuentas')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setCuentas(data || []);
      } catch (err) {
        console.error('Error loading accounts:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadAccounts();
  }, []);

  if (loading) return <div className="text-center py-4 text-text-primary">Loading accounts...</div>;
  if (error) return <div className="text-red-400 py-4">Error: {error}</div>;

  return (
    <div className="space-y-4 mt-8">
      <h2 className="text-xl font-semibold mb-4 text-text-primary">Available Accounts</h2>
      {cuentas.length === 0 ? (
        <p className="text-text-primary opacity-60">No accounts created yet.</p>
      ) : (
        <div className="grid gap-4">
          {cuentas.map((account) => (
            <div key={account.id} className="group relative">
              <Link
                href={`/cuenta/${account.id}/contenido`}
                className="block p-4 border border-border rounded-lg bg-bg-secondary hover:bg-accent/10 transition-colors"
              >
                <h3 className="font-medium text-lg text-text-primary">{account.nombre}</h3>
                <p className="text-text-primary opacity-70 mt-1">{account.descripcion}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-xs bg-accent/20 text-text-primary px-2 py-1 rounded border border-accent/30">
                    {account.idioma === 'es' ? '🇪🇸 Spanish' : '🇺🇸 English'}
                  </span>
                  {account.example_tweets?.length > 0 && (
                    <span className="text-xs bg-accent/20 text-text-primary px-2 py-1 rounded border border-accent/30">
                      {account.example_tweets.length} example tweets
                    </span>
                  )}
                </div>
              </Link>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  deleteAccount(account.id);
                }}
                className="absolute -top-2 -right-2 bg-red-500/80 hover:bg-red-500 text-text-primary rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 transform hover:scale-110"
                title="Delete account"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
