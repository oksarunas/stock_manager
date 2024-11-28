import { useState, useEffect } from 'react';

export const useFetchData = <T,>(
  fetchFunction: () => Promise<T>, 
  dependencies: React.DependencyList = []
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError('');

    fetchFunction()
      .then((response) => {
        if (isMounted) {
          setData(response);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const errorMessage = err instanceof Error ? err.message : 'An error occurred';
          setError(errorMessage);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [fetchFunction, ...dependencies]); // Spread dependencies directly

  return { data, loading, error };
};
