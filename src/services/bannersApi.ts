import { supabase } from '../supabase/client';

// Define the Banner interface
export interface SupabaseBanner {
  id?: number;
  image_url: string;
  order_index: number;
  title?: string;
  description?: string;
  action_url?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// Service to handle banners in Supabase
export const supabseBannersApi = {
  // Get all banners
  async getAll(params: Record<string, any> = {}) {
    let query = supabase
      .from('banners')
      .select('*');

    // Apply filters if they exist
    if (params.isActive !== undefined) {
      query = query.eq('is_active', params.isActive);
    }

    // Order by order_index
    query = query.order('order_index', { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching banners:', error);
      throw error;
    }

    return { data: data || [] };
  },

  // Get a banner by ID
  async getById(id: number) {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching banner with ID ${id}:`, error);
      throw error;
    }

    return { data };
  },

  // Create a new banner
  async create(banner: SupabaseBanner) {
    try {
      const { data, error } = await supabase
        .from('banners')
        .insert([{
          ...banner,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select();

      if (error) {
        console.error('Error creating banner:', error);
        throw error;
      }

      return { data: data?.[0] };
    } catch (error) {
      console.error('Error in create banner:', error);
      throw error;
    }
  },

  // Update an existing banner
  async update(id: number, banner: Partial<SupabaseBanner>) {
    try {
      const { data, error } = await supabase
        .from('banners')
        .update({
          ...banner,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();

      if (error) {
        console.error(`Error updating banner with ID ${id}:`, error);
        throw error;
      }

      return { data: data?.[0] };
    } catch (error) {
      console.error('Error in update banner:', error);
      throw error;
    }
  },

  // Delete a banner
  async delete(id: number) {
    try {
      const { error } = await supabase
        .from('banners')
        .delete()
        .eq('id', id);

      if (error) {
        console.error(`Error deleting banner with ID ${id}:`, error);
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error(`Error in delete banner with ID ${id}:`, error);
      throw error;
    }
  },

  // Upload a banner image using ImgBB API with FreeImage.host fallback
  async uploadImage(file: File) {
    try {
      // First, try uploading with ImgBB API
      const formData = new FormData();
      formData.append('image', file);
      formData.append('key', 'd4c80caf18ac57a20be196713f4245c2');

      const imgbbResponse = await fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        body: formData,
      });

      const imgbbData = await imgbbResponse.json();

      if (imgbbData.success) {
        return { publicUrl: imgbbData.data.url };
      }

      // If ImgBB upload failed, try with FreeImage.host as fallback
      console.log('ImgBB upload failed, trying FreeImage.host as fallback');
      
      const freeImageFormData = new FormData();
      freeImageFormData.append('image', file);
      freeImageFormData.append('key', '6d207e02198a847aa98d0a2a901485a5');

      const freeImageResponse = await fetch('https://freeimage.host/api/1/upload', {
        method: 'POST',
        body: freeImageFormData,
      });

      const freeImageData = await freeImageResponse.json();

      if (freeImageData.success) {
        return { publicUrl: freeImageData.image.url };
      }

      throw new Error('Both image upload services failed');
    } catch (error) {
      console.error('Error in uploadImage:', error);
      throw error;
    }
  }
}; 