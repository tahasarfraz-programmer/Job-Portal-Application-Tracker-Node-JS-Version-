import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { unwrap } from '../services/api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem('token'));

  const refresh = useCallback(async () => {
    try { setUser(await unwrap(api.get('/auth/me'))); } catch { localStorage.removeItem('token'); setUser(null); } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (localStorage.getItem('token')) refresh(); }, [refresh]);

  const authenticate = async (path, body) => {
    const data = await unwrap(api.post(path, body));
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data.user;
  };

  const value = useMemo(() => ({
    user, loading, refresh, setUser,
    login: (b) => authenticate('/auth/login', b),
    register: (b) => authenticate('/auth/register', b),
    logout: () => { localStorage.removeItem('token'); setUser(null); },
  }), [user, loading, refresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
