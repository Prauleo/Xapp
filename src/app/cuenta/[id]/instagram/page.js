'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../../utils/supabaseClient';
import { useAuth } from '../../../../components/AuthProvider';
import WizardioLogo from '../../../../components/WizardioLogo';

export default function InstagramPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [account, setAccount] = useState(null);
  const [activeFilter, setActiveFilter] = useState('personal');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadAccount = async () => {
      if (!params?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('cuentas')
          .select('*')
          .eq('id', params.id)
          .eq('user_id', user.id)
          .single();
        
        if (error || !data) {
          router.push('/');
          return;
        }

        setAccount(data);
      } catch (err) {
        console.error('Error loading account:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadAccount();
  }, [params?.id]);

  if (loading) return <div className="text-center py-4 text-text-primary">Loading account...</div>;
  if (error) return <div className="text-red-400 py-4">Error: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="text-center mb-8">
        <WizardioLogo className="mx-auto mb-6" width={100} height={100} />
      </div>
      
      {/* Account Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2 text-text-primary">{account?.nombre}</h1>
        <p className="text-text-primary opacity-70">{account?.descripcion}</p>
      </div>

      {/* Content Filters */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setActiveFilter('personal')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeFilter === 'personal'
              ? 'bg-accent text-text-primary'
              : 'bg-bg-secondary text-text-primary hover:bg-accent/20'
          }`}
        >
          Personal
        </button>
        <button
          onClick={() => setActiveFilter('narrativa')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeFilter === 'narrativa'
              ? 'bg-accent text-text-primary'
              : 'bg-bg-secondary text-text-primary hover:bg-accent/20'
          }`}
        >
          Narrativa
        </button>
        <button
          onClick={() => setActiveFilter('behindScenes')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeFilter === 'behindScenes'
              ? 'bg-accent text-text-primary'
              : 'bg-bg-secondary text-text-primary hover:bg-accent/20'
          }`}
        >
          Behind the Scenes
        </button>
      </div>

      {/* Content Creation Button */}
      <button
        className="mb-8 bg-accent text-text-primary px-6 py-3 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
        Create Content
      </button>

      {/* Mock Editor Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Copy Editor and Image Canvas */}
        <div className="space-y-6">
          <div className="p-6 bg-bg-secondary rounded-lg border border-border">
            <h3 className="text-lg font-semibold mb-4 text-text-primary">Copy Editor</h3>
            <textarea
              placeholder="Write your post caption here..."
              className="w-full h-40 p-3 bg-bg-primary border border-border rounded-lg resize-none text-text-primary placeholder-text-primary/50 focus:ring-2 focus:ring-accent focus:border-accent"
            />
          </div>

          <div className="p-6 bg-bg-secondary rounded-lg border border-border">
            <h3 className="text-lg font-semibold mb-4 text-text-primary">Image Canvas</h3>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <div className="space-y-2">
                <svg className="w-12 h-12 mx-auto text-text-primary opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-text-primary opacity-70">Drag and drop images here or click to upload</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Storyboard and Prompt History */}
        <div className="space-y-6">
          <div className="p-6 bg-bg-secondary rounded-lg border border-border">
            <h3 className="text-lg font-semibold mb-4 text-text-primary">Storyboard</h3>
            <div className="space-y-4">
              <div className="p-4 bg-bg-primary rounded-lg border border-border cursor-move">
                Post 1
              </div>
              <div className="p-4 bg-bg-primary rounded-lg border border-border cursor-move">
                Post 2
              </div>
              <div className="p-4 bg-bg-primary rounded-lg border border-border cursor-move">
                Post 3
              </div>
            </div>
          </div>

          <div className="p-6 bg-bg-secondary rounded-lg border border-border">
            <h3 className="text-lg font-semibold mb-4 text-text-primary">Prompt History</h3>
            <div className="space-y-2">
              <div className="p-3 bg-bg-primary rounded-lg border border-border">
                <p className="text-sm text-text-primary">Previous prompt 1</p>
              </div>
              <div className="p-3 bg-bg-primary rounded-lg border border-border">
                <p className="text-sm text-text-primary">Previous prompt 2</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
