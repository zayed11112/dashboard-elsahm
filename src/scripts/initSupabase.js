// Script para inicializar la base de datos de Supabase con un usuario administrador
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://cxntsoxkldjoblehmdpo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4bnRzb3hrbGRqb2JsZWhtZHBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3MDA1MDMsImV4cCI6MjA2MTI3NjUwM30.XEuVHmJrWNX1XYphBZKpwyZqRf_HMsNg6IMJLiIu-ks';

// Crear cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Función para registrar un usuario administrador
async function createAdminUser() {
  try {
    // Registrar usuario
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'admin@elsahm.com',
      password: 'Admin123!',
    });

    if (authError) {
      console.error('Error al registrar usuario:', authError);
      return;
    }

    console.log('Usuario registrado exitosamente:', authData.user);

    // Esperar un momento para que se complete el registro
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Iniciar sesión con el usuario creado
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'admin@elsahm.com',
      password: 'Admin123!',
    });

    if (signInError) {
      console.error('Error al iniciar sesión:', signInError);
      return;
    }

    console.log('Sesión iniciada exitosamente:', signInData.session);

    // Crear políticas de seguridad para la tabla properties
    // Esto normalmente se haría desde la interfaz de Supabase, pero aquí mostramos cómo hacerlo programáticamente
    const { error: policyError } = await supabase.rpc('create_rls_policy', {
      table_name: 'properties',
      policy_name: 'Enable all for authenticated users',
      definition: 'auth.uid() IS NOT NULL',
      operation: 'ALL',
    });

    if (policyError) {
      console.error('Error al crear política de seguridad:', policyError);
    } else {
      console.log('Política de seguridad creada exitosamente');
    }

    console.log('Inicialización completada');
  } catch (error) {
    console.error('Error general:', error);
  }
}

// Ejecutar la función
createAdminUser();
