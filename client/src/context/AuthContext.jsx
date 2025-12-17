import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext({
  user: null,
  loading: true,
  refreshUser: () => Promise.resolve(),
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchCurrentUser = useCallback(async (options = {}) => {
    const { silent = false } = options;

    if (!silent && isMountedRef.current) {
      setLoading(true);
    }

    try {
      const res = await axios.get('/auth/api/current_user', { withCredentials: true });
      if (isMountedRef.current) {
        if (res.data && typeof res.data === 'object' && Object.keys(res.data).length > 0) {
          setUser(res.data);
        } else {
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Auth lookup failed:', error);
      if (isMountedRef.current) {
        setUser(null);
      }
    } finally {
      if (!silent && isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const value = useMemo(
    () => ({
      user,
      loading,
      refreshUser: (options) => fetchCurrentUser(options),
    }),
    [user, loading, fetchCurrentUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
