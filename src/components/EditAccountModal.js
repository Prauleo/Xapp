'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { analizarTweet } from '../utils/openai';

export default function EditAccountModal({ account, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    nombre: account.nombre,
    idioma: account.idioma
  });
  const [exampleTweets, setExampleTweets] = useState(account.example_tweets || []);
  const [currentTweet, setCurrentTweet] = useState('');
  const [message, setMessage] = useState('');
  const [tweetAnalyses, setTweetAnalyses] = useState(account.tweet_analyses || {});
  const [analyzing, setAnalyzing] = useState(false);

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
        throw new Error('You must have at least one example tweet');
      }

      // Update the account
      const { error: updateError } = await supabase
        .from('cuentas')
        .update({ 
          ...formData, 
          example_tweets: exampleTweets,
          tweet_analyses: tweetAnalyses
        })
        .eq('id', account.id);

      if (updateError) throw updateError;

      setMessage('Account updated successfully!');
      if (onSuccess) onSuccess();
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      setMessage('Error: ' + error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="max-w-md w-full mx-4 bg-bg-secondary rounded-lg shadow-lg border border-border p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-text-primary">Edit Account</h2>
          <button 
            onClick={onClose}
            className="text-text-primary hover:text-accent"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
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
              <div className="mt-2 space-y-2">
                {exampleTweets.map((tweet, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 rounded bg-bg-primary border border-border">
                    <p className="flex-1 text-sm text-text-primary">
                      {tweet}
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
            Update Account
          </button>
        </form>
      </div>
    </div>
  );
}
