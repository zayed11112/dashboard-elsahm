import { supabase } from '../supabase/config';

// تعريف نوع البيانات للمكان
export interface AvailablePlace {
  id: number;
  name: string;
  icon_url: string;
  order_index: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// تعريف نوع البيانات للعلاقة بين العقار والمكان
export interface PropertyPlace {
  id?: string;
  property_id: string;
  place_id: number;
  created_at?: string;
}

// خدمة API للأماكن المتاحة
export const availablePlacesApi = {
  // الحصول على جميع الأماكن
  async getAll(params: Record<string, any> = {}) {
    let query = supabase
      .from('available_places')
      .select('*');

    // تطبيق عوامل التصفية إذا وجدت
    if (params.search) {
      query = query.ilike('name', `%${params.search}%`);
    }

    if (params.isActive !== undefined) {
      query = query.eq('is_active', params.isActive);
    }

    // ترتيب حسب الترتيب المخصص ثم تاريخ الإنشاء
    query = query.order('order_index', { ascending: true }).order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching available places:', error);
      throw error;
    }

    return { data: data || [] };
  },

  // الحصول على مكان بواسطة المعرف
  async getById(id: number) {
    const { data, error } = await supabase
      .from('available_places')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching place by id:', error);
      throw error;
    }

    return { data };
  },

  // إضافة مكان جديد
  async create(placeData: Omit<AvailablePlace, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('available_places')
      .insert(placeData)
      .select();

    if (error) {
      console.error('Error creating place:', error);
      throw error;
    }

    return { data: data[0] };
  },

  // تحديث مكان
  async update(id: number, placeData: Partial<Omit<AvailablePlace, 'id' | 'created_at' | 'updated_at'>>) {
    const { data, error } = await supabase
      .from('available_places')
      .update(placeData)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating place:', error);
      throw error;
    }

    return { data: data[0] };
  },

  // حذف مكان
  async delete(id: number) {
    const { error } = await supabase
      .from('available_places')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting place:', error);
      throw error;
    }

    return { success: true };
  },

  // تغيير حالة المكان (نشط/غير نشط)
  async toggleActive(id: number, isActive: boolean) {
    const { data, error } = await supabase
      .from('available_places')
      .update({ is_active: isActive })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error toggling place status:', error);
      throw error;
    }

    return { data: data[0] };
  },

  // تحديث ترتيب مكان
  async updateOrder(id: number, orderIndex: number) {
    const { data, error } = await supabase
      .from('available_places')
      .update({ order_index: orderIndex })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating place order:', error);
      throw error;
    }

    return { data: data[0] };
  },

  // جلب الأماكن المرتبطة بعقار معين
  async getPlacesForProperty(propertyId: string) {
    try {
      // الحصول على روابط الأماكن للعقار المحدد
      const { data: placeLinks, error: linksError } = await supabase
        .from('property_available_places')
        .select('place_id')
        .eq('property_id', propertyId);

      if (linksError) {
        console.error('Error fetching property place links:', linksError);
        throw linksError;
      }

      if (!placeLinks || placeLinks.length === 0) {
        return { data: [] };
      }

      // استخراج معرفات الأماكن
      const placeIds = placeLinks.map(link => link.place_id);

      // الحصول على تفاصيل الأماكن
      const { data: places, error: placesError } = await supabase
        .from('available_places')
        .select('*')
        .in('id', placeIds);

      if (placesError) {
        console.error('Error fetching places by ids:', placesError);
        throw placesError;
      }

      return { data: places || [] };
    } catch (error) {
      console.error('Error in getPlacesForProperty:', error);
      throw error;
    }
  },

  // ربط عقار بعدة أماكن
  async linkPropertyToPlaces(propertyId: string, placeIds: number[]) {
    try {
      // حذف الروابط القديمة أولاً
      const { error: deleteError } = await supabase
        .from('property_available_places')
        .delete()
        .eq('property_id', propertyId);

      if (deleteError) {
        console.error('Error deleting old property place links:', deleteError);
        throw deleteError;
      }

      // إضافة الروابط الجديدة
      if (placeIds.length > 0) {
        const links = placeIds.map(placeId => ({
          property_id: propertyId,
          place_id: placeId,
        }));

        const { error: insertError } = await supabase
          .from('property_available_places')
          .insert(links);

        if (insertError) {
          console.error('Error linking property to places:', insertError);
          throw insertError;
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error in linkPropertyToPlaces:', error);
      throw error;
    }
  }
}; 