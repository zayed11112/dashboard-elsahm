import { supabase } from '../supabase/config';

// Interfaz para el usuario autenticado de Supabase
export interface SupabaseAuthUser {
  id: string;
  email: string;
  role?: string;
}

// Servicio de autenticación para Supabase
export const supabaseAuthService = {
  // Iniciar sesión con correo y contraseña
  async signIn(email: string, password: string): Promise<SupabaseAuthUser> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error('No se pudo iniciar sesión');
      }

      return {
        id: data.user.id,
        email: data.user.email || '',
        role: 'admin', // Asumimos que todos los usuarios que pueden iniciar sesión son administradores
      };
    } catch (error) {
      console.error('Error al iniciar sesión con Supabase:', error);
      throw error;
    }
  },

  // Registrar un nuevo usuario
  async signUp(email: string, password: string): Promise<SupabaseAuthUser> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error('No se pudo registrar el usuario');
      }

      return {
        id: data.user.id,
        email: data.user.email || '',
        role: 'admin',
      };
    } catch (error) {
      console.error('Error al registrar usuario con Supabase:', error);
      throw error;
    }
  },

  // Cerrar sesión
  async signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error al cerrar sesión con Supabase:', error);
      throw error;
    }
  },

  // Obtener el usuario actual
  async getCurrentUser(): Promise<SupabaseAuthUser | null> {
    try {
      const { data } = await supabase.auth.getUser();
      
      if (!data.user) {
        return null;
      }

      return {
        id: data.user.id,
        email: data.user.email || '',
        role: 'admin',
      };
    } catch (error) {
      console.error('Error al obtener el usuario actual de Supabase:', error);
      return null;
    }
  },

  // Verificar si hay una sesión activa
  async isAuthenticated(): Promise<boolean> {
    try {
      const { data } = await supabase.auth.getSession();
      return !!data.session;
    } catch (error) {
      console.error('Error al verificar autenticación con Supabase:', error);
      return false;
    }
  },
};
