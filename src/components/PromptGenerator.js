'use client';
import { useState } from 'react';
import { generateImagePrompt } from '../utils/openai';

export default function PromptGenerator({ tweetText, onSavePrompt }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  const generatePrompt = async () => {
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      const generatedPrompt = await generateImagePrompt(tweetText);
      setPrompt(generatedPrompt);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (onSavePrompt) {
        await onSavePrompt(prompt);
        setSaved(true);
        // Show save success notification
        const el = document.createElement('div');
        el.className = 'fixed top-4 right-4 bg-accent text-text-primary px-4 py-2 rounded-lg shadow-lg';
        el.textContent = 'Prompt saved!';
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 2000);
      }
    } catch (err) {
      setError('Error saving prompt: ' + err.message);
    }
  };

  return (
    <div className="mt-4 p-4 border border-border rounded-lg bg-bg-secondary">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-text-primary">Image Prompt Generator</h3>
        <div className="flex gap-2">
          <button
            onClick={generatePrompt}
            disabled={loading}
            className={`py-2 px-4 rounded-lg text-text-primary transition-opacity ${
              !prompt ? 'bg-accent hover:opacity-90' : 'bg-accent/80 hover:bg-accent'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Generating...' : prompt ? 'Regenerate' : 'Generate Prompt'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-500">{error}</p>
        </div>
      )}

      {prompt && (
        <div className="space-y-3">
          <div className="p-3 bg-bg-primary rounded-lg border border-border">
            <p className="text-text-primary whitespace-pre-wrap">{prompt}</p>
          </div>
          <div className="flex justify-between items-center">
            <button
              onClick={() => {
                navigator.clipboard.writeText(prompt);
                // Show copy success notification
                const el = document.createElement('div');
                el.className = 'fixed top-4 right-4 bg-accent text-text-primary px-4 py-2 rounded-lg shadow-lg';
                el.textContent = 'Prompt copied!';
                document.body.appendChild(el);
                setTimeout(() => el.remove(), 2000);
              }}
              className="text-sm text-text-primary opacity-70 hover:opacity-100 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              Copy prompt
            </button>
            <button
              onClick={handleSave}
              disabled={saved}
              className={`text-sm flex items-center gap-1 py-1 px-3 rounded ${
                saved 
                  ? 'bg-green-500/20 text-green-500 cursor-not-allowed'
                  : 'bg-accent/20 text-text-primary hover:bg-accent/30'
              }`}
            >
              <svg 
                className="w-4 h-4" 
                fill={saved ? "currentColor" : "none"} 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
              {saved ? 'Saved' : 'Save Prompt'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
