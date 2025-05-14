import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { authService, AuthUser } from '../firebase/services/auth';

// Define the User type
interface User {
  id: string;
  name?: string;
  email: string;
  role?: string;
  avatar?: string;
}

// Define the context type
interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

// Create the auth context with default values
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  loading: true,
  login: async () => {},
  logout: () => {},
});

// Hook for using the auth context
export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

// Static password for dashboard access
const STATIC_PASSWORD = "Okaeslam2020###";

export const AuthProvider = ({ children }: AuthProviderProps) => {
  // Estado inicial
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Verificar autenticación al cargar el componente
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if we have a stored authentication token
        const authToken = localStorage.getItem('authToken');
        
        if (authToken) {
          // Simple mock user for our password-only system
          const userData: User = {
            id: 'admin',
            email: 'admin@elsahm.com',
            name: 'Admin',
            role: 'admin',
          };

          setUser(userData);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error al verificar autenticación:', error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Función de inicio de sesión
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);

      // Check if the password matches our static password
      if (password === STATIC_PASSWORD) {
        // Simple mock user for our password-only system
        const userData: User = {
          id: 'admin',
          email: email || 'admin@elsahm.com',
          name: 'Admin',
          role: 'admin',
        };

        // Store authentication token (simple implementation)
        localStorage.setItem('authToken', 'authenticated');
        
        // Actualizar estado
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        throw new Error('Invalid password');
      }
    } catch (error: any) {
      console.error('Error al iniciar sesión:', error);
      throw new Error(error.message || 'فشل تسجيل الدخول. يرجى التحقق من البريد الإلكتروني وكلمة المرور.');
    } finally {
      setLoading(false);
    }
  };

  // Función de cierre de sesión
  const logout = async () => {
    try {
      setLoading(true);

      // Remove authentication token
      localStorage.removeItem('authToken');

      // Actualizar estado
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};