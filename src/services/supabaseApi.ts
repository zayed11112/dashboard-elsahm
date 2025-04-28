import { supabase } from '../supabase/config';
import { supabaseAuthService } from './supabaseAuthService';

// Definir la interfaz para la propiedad
export interface SupabaseProperty {
  id?: string;
  name: string;              // اسم العقار
  address: string;           // العنوان
  type: string;              // النوع
  price: number;             // السعر
  commission: number;        // العمولة
  bedrooms: number;          // عدد الغرف
  beds: number;              // عدد السراير
  floor: string;             // الطابق
  // تم إزالة حقل المساحة (area) كما هو مطلوب
  is_available: boolean;     // الحالة
  description: string;       // الوصف الطويل
  features: string[];        // المميزات
  images: string[];          // الصور
  videos: string[];          // الفيديوهات
  drive_images?: string[];   // صور درايف (اختياري)
  owner_id?: string;         // معرف المالك (اختياري)
  owner_name?: string;       // اسم المالك (اختياري)
  owner_phone?: string;      // رقم هاتف المالك (اختياري)
  created_at?: string;
  updated_at?: string;
  user_id?: string;          // ID del usuario que creó la propiedad
}

// Servicio para manejar las propiedades en Supabase
export const supabasePropertiesApi = {
  // Duplicar una propiedad existente
  async duplicate(id: string) {
    try {
      // Duplicar la propiedad sin verificar autenticación

      // Obtener la propiedad original
      const { data: originalProperty } = await this.getById(id);
      if (!originalProperty) {
        throw new Error(`No se encontró la propiedad con ID ${id}`);
      }

      // Crear una copia de la propiedad con un nuevo nombre
      // Extraemos solo las propiedades que necesitamos para crear una nueva propiedad
      // Aseguramos que no se incluya el user_id para evitar problemas de tipo de datos
      const newProperty: SupabaseProperty = {
        name: `${originalProperty.name} (مكرر)`,
        address: originalProperty.address,
        type: originalProperty.type,
        price: originalProperty.price,
        commission: originalProperty.commission || 0,
        bedrooms: originalProperty.bedrooms,
        beds: originalProperty.beds,
        floor: originalProperty.floor,
        // تم إزالة حقل المساحة (area) كما هو مطلوب
        is_available: originalProperty.is_available,
        description: originalProperty.description,
        features: originalProperty.features || [],
        images: originalProperty.images || [],
        videos: originalProperty.videos || [],
        drive_images: originalProperty.drive_images || [],
        // Omitimos user_id para evitar el error de tipo de datos
      };

      // Insertar la nueva propiedad
      const result = await this.create(newProperty);
      return result;
    } catch (error) {
      console.error(`Error duplicating property with ID ${id}:`, error);
      throw error;
    }
  },

  // Obtener todas las propiedades
  async getAll(params: Record<string, any> = {}) {
    let query = supabase
      .from('properties')
      .select('*');

    // Aplicar filtros si existen
    if (params.search) {
      query = query.or(`name.ilike.%${params.search}%,address.ilike.%${params.search}%`);
    }

    if (params.type) {
      query = query.eq('type', params.type);
    }

    if (params.isAvailable !== undefined) {
      query = query.eq('is_available', params.isAvailable);
    }

    // Ordenar por fecha de creación (más reciente primero)
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching properties:', error);
      throw error;
    }

    return { data: data || [] };
  },

  // Obtener una propiedad por ID
  async getById(id: string) {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching property with ID ${id}:`, error);
      throw error;
    }

    return { data };
  },

  // Crear una nueva propiedad
  async create(property: SupabaseProperty) {
    try {
      // Insertar la propiedad sin verificar autenticación
      // Esto permite crear propiedades sin necesidad de iniciar sesión
      const { data, error } = await supabase
        .from('properties')
        .insert([{
          ...property,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select();

      if (error) {
        console.error('Error creating property:', error);
        console.error('Property data sent:', {
          ...property,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        throw error;
      }

      return { data: data?.[0] };
    } catch (error) {
      console.error('Error en create property:', error);
      throw error;
    }
  },

  // Actualizar una propiedad existente
  async update(id: string, property: Partial<SupabaseProperty>) {
    try {
      // Actualizar la propiedad sin verificar autenticación
      const { data, error } = await supabase
        .from('properties')
        .update({
          ...property,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();

      if (error) {
        console.error(`Error updating property with ID ${id}:`, error);
        throw error;
      }

      return { data: data?.[0] };
    } catch (error) {
      console.error(`Error en update property with ID ${id}:`, error);
      throw error;
    }
  },

  // Eliminar una propiedad
  async delete(id: string) {
    try {
      // Eliminar la propiedad sin verificar autenticación
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id);

      if (error) {
        console.error(`Error deleting property with ID ${id}:`, error);
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error(`Error en delete property with ID ${id}:`, error);
      throw error;
    }
  }
};

// Servicio para cargar imágenes a ImgBB
export const imgbbApi = {
  async uploadImage(file: File) {
    const apiKey = 'd4c80caf18ac57a20be196713f4245c2';
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to upload image');
      }

      return {
        url: data.data.url,
        display_url: data.data.display_url,
        delete_url: data.data.delete_url,
        thumbnail: data.data.thumb?.url
      };
    } catch (error) {
      console.error('Error uploading image to ImgBB:', error);
      throw error;
    }
  }
};
