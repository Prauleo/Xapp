'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../../utils/supabaseClient';
import { useAuth } from '../../../../components/AuthProvider';
import { generarTweetsAutomaticos } from '../../../../utils/openai';
import HistorialContenido from '../../../../components/HistorialContenido';
import PromptGenerator from '../../../../components/PromptGenerator';
import WizardioLogo from '../../../../components/WizardioLogo';

export default function ContentPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [account, setAccount] = useState(null);
  const [inputs, setInputs] = useState({
    mainIdeas: '',
    context: '',
    length: 'medium',
    isThread: false
  });
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [accountVoice, setAccountVoice] = useState(null);

  useEffect(() => {
    const loadAccount = async () => {
      if (!params?.id) return;
      
      try {
        // Load account and its voice
        const [accountResult, voiceResult] = await Promise.all([
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
        
        if (accountResult.error || !accountResult.data) {
          router.push('/');
          return;
        }

        setAccount(accountResult.data);
        if (!voiceResult.error && voiceResult.data) {
          setAccountVoice(voiceResult.data.voz);
        }
      } catch (err) {
        console.error('Error loading account:', err);
        setError(err.message);
      }
    };

    loadAccount();
  }, [params?.id]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setInputs(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const generateContent = async () => {
    if (!inputs.mainIdeas.trim()) {
      setError('Please enter your main ideas');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const generatedTweets = await generarTweetsAutomaticos({
        ideas: inputs.mainIdeas,
        contexto: inputs.context,
        longitud: inputs.length,
        esThread: inputs.isThread
      }, account, accountVoice);

      // Save to Supabase
      const { data: savedContent, error: saveError } = await supabase
        .from('contenido')
        .insert([{
          cuenta_id: params.id,
          user_id: user.id,
          ideas_principales: inputs.mainIdeas,
          contexto: inputs.context,
          tweets: generatedTweets,
          longitud: inputs.length,
          es_thread: inputs.isThread,
          necesita_imagen: false,
          fecha_creacion: new Date().toISOString()
        }])
        .select()
        .single();

      if (saveError) throw saveError;
      
      // Update state with the saved content ID
      setTweets(generatedTweets.map(tweet => ({
        text: tweet,
        contentId: savedContent.id
      })));
    } catch (err) {
      console.error('Error generating content:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!account) return <div className="text-center py-4 text-text-primary">Loading account...</div>;
  if (error) return <div className="text-red-400 py-4">Error: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="text-center mb-8">
        <WizardioLogo className="mx-auto mb-6" width={100} height={100} />
      </div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2 text-text-primary">{account.nombre}</h1>
        <p className="text-text-primary opacity-70">{account.descripcion}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Panel */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4 text-text-primary">Generate Content</h2>
            
            {/* Main Ideas */}
            <div className="mb-6">
              <label className="block text-lg font-semibold text-text-primary mb-2">
                Main Ideas ★
              </label>
              <p className="text-sm text-text-primary opacity-70 mb-2">
                Write your main ideas here. This content will have the highest priority.
              </p>
              <textarea
                name="mainIdeas"
                value={inputs.mainIdeas}
                onChange={handleInputChange}
                placeholder="Write your main ideas here..."
                className="w-full h-40 p-3 bg-bg-primary border border-border rounded-lg resize-none text-text-primary placeholder-text-primary/50 focus:ring-2 focus:ring-accent focus:border-accent"
                required
              />
            </div>

            {/* Context */}
            <div className="mb-6">
              <label className="block text-lg font-semibold text-text-primary mb-2">
                Reference Context
              </label>
              <p className="text-sm text-text-primary opacity-70 mb-2">
                Paste relevant articles or information here to provide more context to your ideas.
              </p>
              <textarea
                name="context"
                value={inputs.context}
                onChange={handleInputChange}
                placeholder="Paste relevant articles or tweets here..."
                className="w-full h-40 p-3 bg-bg-primary border border-border rounded-lg resize-none text-text-primary placeholder-text-primary/50 focus:ring-2 focus:ring-accent focus:border-accent"
              />
            </div>

            {/* Tweet Options */}
            <div className="mb-6 space-y-4">
              <div>
                <label className="block text-lg font-semibold text-text-primary mb-2">
                  Tweet Length
                </label>
                <select
                  name="length"
                  value={inputs.length}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-bg-primary border border-border rounded-lg text-text-primary focus:ring-2 focus:ring-accent focus:border-accent"
                >
                  <option value="short">Short (up to 180 characters)</option>
                  <option value="medium">Medium (180-280 characters)</option>
                  <option value="long">Long (280-500 characters)</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="isThread"
                  checked={inputs.isThread}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-accent border-border rounded focus:ring-accent"
                />
                <label className="text-text-primary">
                  Generate as Thread
                </label>
              </div>
            </div>

            <button
              onClick={generateContent}
              disabled={loading}
              className={`w-full py-2 px-4 rounded-lg text-text-primary transition-opacity ${
                loading ? 'bg-accent opacity-50 cursor-not-allowed' : 'bg-accent hover:opacity-90'
              }`}
            >
              {loading ? 'Generating...' : 'Generate Tweets'}
            </button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4 text-text-primary">Generated Tweets</h2>
            {tweets.length > 0 ? (
              <div className="space-y-3">
                {tweets.map((tweetObj, index) => (
                  <div key={index} className="space-y-4">
                    <div className="p-4 border border-border rounded-lg bg-bg-secondary">
                      <div className="flex justify-between items-start gap-2">
                        <p className="text-text-primary flex-grow">
                          {inputs.isThread ? tweetObj.text : tweetObj.text.replace(/^\d+\.\s*/, '')}
                        </p>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(tweetObj.text.trim());
                            // Optional: Show copy success notification
                            const el = document.createElement('div');
                            el.className = 'fixed top-4 right-4 bg-accent text-text-primary px-4 py-2 rounded-lg shadow-lg';
                            el.textContent = 'Copied!';
                            document.body.appendChild(el);
                            setTimeout(() => el.remove(), 2000);
                          }}
                          className="p-2 text-text-primary hover:bg-accent/20 rounded-lg transition-colors"
                          title="Copy tweet"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <PromptGenerator 
                      tweetText={tweetObj.text} 
                      onSavePrompt={async (prompt) => {
                        // Update the content in Supabase with the new prompt
                        const { error } = await supabase
                          .from('contenido')
                          .update({ image_prompt: prompt })
                          .eq('id', tweetObj.contentId);
                        
                        if (error) throw error;
                      }} 
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-primary opacity-60">
                Generated tweets will appear here...
              </p>
            )}
          </div>

          {/* Content History */}
          <HistorialContenido cuentaId={params.id} />
        </div>
      </div>
    </div>
  );
}
