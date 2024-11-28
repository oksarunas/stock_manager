// frontend/src/components/hooks/useUser.ts

import { useState, useEffect, useCallback, useMemo } from 'react';
import axios, { AxiosResponse } from 'axios';
import { User } from '../../types/interfaces';

const LOCAL_STORAGE_KEY = 'username';

export const useUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    const username = localStorage.getItem(LOCAL_STORAGE_KEY);

    if (!username) {
      console.warn('No username found in localStorage');
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response: AxiosResponse<User> = await axios.get('/api/users/me', {
        params: { username },
      });

      if (
        response.data &&
        response.data.id &&
        response.data.username &&
        response.data.budget !== undefined &&
        Array.isArray(response.data.portfolio) // Ensure portfolio is an array
      ) {
        setUser(response.data);
      } else {
        setUser(null);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Failed to fetch user:', error.response ? error.response.data : error.message);
        setError(error.response ? error.response.data : error.message);
      } else {
        console.error('An unknown error occurred:', error);
        setError('An unknown error occurred');
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const userMemoized = useMemo(() => ({ user, loading, error }), [user, loading, error]);


  return userMemoized;
};
