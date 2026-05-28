import { useState } from 'react';

export const useHugoAI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (prompt: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/hugo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json();
      return data.text;
    } catch (err) {
      setError('Error al conectar con Hugo');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { sendMessage, loading, error };
};
