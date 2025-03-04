"use client";

import { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from './AuthProvider';
import { analizarTweet, generarVozCuenta } from '../utils/openai';

export default function CuentaForm({ onSuccess }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    nombre: '',
    idioma: 'en'  // Changed default to English
  });
  const [exampleTweets, setExampleTweets] = useState([]);
  const [currentTweet, setCurrentTweet] = useState('');
  const [message, setMessage] = useState('');
  const [tweetAnalyses, setTweetAnalyses] = useState({});
  const [analyzing, setAnalyzing] = useState(false);
  const [expandedTweet, setExpandedTweet] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Verify analyzed tweets
      if (Object.keys(tweetAnalyses).length === 0) {
        throw new Error('You must add at least one example tweet');
      }

      // First create the account
      const { data: cuentaData, error: cuentaError } = await supabase
        .from('cuentas')
        .insert([{ 
          ...formData, 
          user_id: user.id,
          example_tweets: exampleTweets,
          tweet_analyses: tweetAnalyses
        }])
        .select();

      if (cuentaError) throw cuentaError;

      // Generate account voice
      setMessage('Generating account voice profile...');
      const analysesText = Object.values(tweetAnalyses).join('\n');
      const voiceProfile = await generarVozCuenta(analysesText);

      // Save voice in voces_cuenta table
      const { error: vozError } = await supabase
        .from('voces_cuenta')
        .insert([{
          cuenta_id: cuentaData[0].id,
          voz: voiceProfile
        }]);

      if (vozError) throw vozError;

      setMessage('Account created successfully! Voice profile generated.');
      setFormData({
        nombre: '',
        idioma: 'en'
      });
      setExampleTweets([]);
      setCurrentTweet('');
      setTweetAnalyses({});
      if (onSuccess) onSuccess();
    } catch (error) {
      setMessage('Error: ' + error.message);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-bg-secondary rounded-lg shadow-lg border border-border">
      <h2 className="text-2xl font-semibold mb-6 text-text-primary">Create New Account</h2>
      
      {message && (
        <div className={`p-4 mb-4 rounded border ${message.includes('Error') ? 'border-red-500 bg-bg-primary text-red-400' : 'border-green-500 bg-bg-primary text-green-400'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-primary">Account Name</label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-border bg-bg-primary text-text-primary shadow-sm focus:border-accent focus:ring-accent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary">Example Tweets</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={currentTweet}
              onChange={(e) => setCurrentTweet(e.target.value)}
              placeholder="Enter an example tweet"
              className="flex-1 rounded-md border-border bg-bg-primary text-text-primary shadow-sm focus:border-accent focus:ring-accent"
              disabled={analyzing}
            />
            <button
              type="button"
              onClick={async () => {
                if (currentTweet.trim()) {
                  const tweet = currentTweet.trim();
                  setAnalyzing(true);
                  try {
                    const analysis = await analizarTweet(tweet, { tone: 'analyzing' });
                    setTweetAnalyses(prev => ({
                      ...prev,
                      [tweet]: analysis
                    }));
                    setExampleTweets([...exampleTweets, tweet]);
                    setCurrentTweet('');
                    setMessage('');
                  } catch (error) {
                    setMessage('Error analyzing tweet: ' + error.message);
                  }
                  setAnalyzing(false);
                }
              }}
              disabled={analyzing}
              className={`bg-accent text-text-primary py-2 px-4 rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent ${analyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {analyzing ? 'Analyzing...' : 'Add'}
            </button>
          </div>
          
          {exampleTweets.length > 0 && (
            <div className="mt-2 space-y-2 max-h-60 overflow-y-auto pr-2">
              {exampleTweets.map((tweet, index) => (
                <div key={index} className="flex items-center gap-2 p-2 rounded bg-bg-primary border border-border">
                  <p className="flex-1 text-sm text-text-primary">
                    {tweet.length > 100 ? (
                      <>
                        {expandedTweet === index ? tweet : tweet.substring(0, 100) + '...'}
                        <button 
                          className="text-accent ml-1 text-xs" 
                          onClick={() => setExpandedTweet(expandedTweet === index ? null : index)}
                        >
                          {expandedTweet === index ? 'Show less' : 'Read more'}
                        </button>
                      </>
                    ) : (
                      tweet
                    )}
                    {tweetAnalyses[tweet] && (
                      <span className="hidden">{tweetAnalyses[tweet]}</span>
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const tweetToRemove = exampleTweets[index];
                      setExampleTweets(exampleTweets.filter((_, i) => i !== index));
                      setTweetAnalyses(prev => {
                        const newAnalyses = { ...prev };
                        delete newAnalyses[tweetToRemove];
                        return newAnalyses;
                      });
                    }}
                    className="text-red-400 hover:text-red-500"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary">Publishing Language</label>
          <select
            name="idioma"
            value={formData.idioma}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-border bg-bg-primary text-text-primary shadow-sm focus:border-accent focus:ring-accent"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-accent text-text-primary py-2 px-4 rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-primary transition-opacity"
        >
          Create Account
        </button>
      </form>
    </div>
  );
}
