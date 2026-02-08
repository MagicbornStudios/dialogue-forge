'use client';

import { useState } from 'react';

export default function TweakcnAiPage() {
  const [prompt, setPrompt] = useState('Create a cozy dark mode theme for narrative writing with warm accents and high readability.');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/tweakcn/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error || 'Request failed.');
        setResult('');
        return;
      }

      setResult(payload.result || '');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Request failed.');
      setResult('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-df-bg text-df-text-primary p-6">
      <div className="mx-auto max-w-4xl space-y-4">
        <h1 className="text-2xl font-semibold">Tweakcn + AI</h1>
        <p className="text-sm text-df-text-secondary">
          Generate theme suggestions with OpenRouter and copy the JSON into tweakcn.
        </p>

        <div className="rounded-md border border-df-control-border bg-df-surface p-4">
          <p className="text-sm">Open local tweakcn app:</p>
          <a
            className="text-sm underline"
            href="http://localhost:3001"
            target="_blank"
            rel="noreferrer"
          >
            http://localhost:3001
          </a>
        </div>

        <form className="space-y-3" onSubmit={onSubmit}>
          <label className="block text-sm font-medium" htmlFor="prompt">
            Theme prompt
          </label>
          <textarea
            id="prompt"
            className="w-full rounded-md border border-df-control-border bg-df-control-bg p-3 text-sm"
            rows={6}
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-md border border-df-control-border bg-df-control-bg px-3 py-2 text-sm"
          >
            {isLoading ? 'Generating...' : 'Generate suggestion'}
          </button>
        </form>

        {error ? (
          <div className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>
        ) : null}

        <div className="space-y-2">
          <h2 className="text-sm font-medium">AI output</h2>
          <pre className="min-h-48 overflow-auto rounded-md border border-df-control-border bg-df-surface p-3 text-xs">
            {result || 'No result yet.'}
          </pre>
        </div>
      </div>
    </div>
  );
}
