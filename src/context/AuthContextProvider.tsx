import {ReactNode, useEffect, useState} from 'react';
import {AuthContext} from './AuthContext';
import {Token, User} from '@/types';
import {QUERY_KEYS} from '@/lib/react-query/queryKeys';
import {jwtDecode} from 'jwt-decode';

const AuthContextProvider = ({children}: {children: ReactNode}) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [token, setToken] = useState<Token | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('token') || localStorage.getItem(QUERY_KEYS.TOKEN);
      if (!raw) return;
      const localToken = typeof raw === 'string' && (raw.startsWith('{') || raw.startsWith('['))
        ? JSON.parse(raw)
        : raw;

      const accessToken = localToken?.accessToken || (typeof localToken === 'string' ? localToken : null);

      if (accessToken) {
        const decodedToken: any = jwtDecode(accessToken);

        if (decodedToken.exp && decodedToken.exp * 1000 < Date.now()) {
          localStorage.removeItem('token');
          localStorage.removeItem(QUERY_KEYS.TOKEN);
          setToken(null);
          setUser(null);
          setRole(null);
          setIsSuperAdmin(false);
          setIsAuthenticated(false);
        } else {
          setToken(localToken);
          setUser(decodedToken);
          const userRole = decodedToken.role || localToken?.user?.role || '';
          setRole(userRole);
          setIsSuperAdmin(userRole?.toUpperCase() === 'SUPERADMIN');
          setIsAuthenticated(true);
        }
      }
    } catch (e) {
      console.warn('AuthContextProvider decode token error:', e);
    }
  }, []);

  // Value of the context
  const contextValue = {
    user,
    setUser,
    role,
    setRole,
    token,
    setToken,
    isAuthenticated,
    setIsAuthenticated,
    isSuperAdmin,
    setIsSuperAdmin,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export default AuthContextProvider;
