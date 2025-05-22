import { supabase } from '../supabase/config';

// تعريف نوع البيانات للقسم
export interface Category {
  id: number;
  name: string;
  icon_url: string;
  order_index: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// تعريف نوع البيانات للعلاقة بين العقار والقسم
export interface PropertyCategory {
  id?: string;
  property_id: string;
  category_id: number;
  created_at?: string;
}

// خدمة API للأقسام
export const categoriesApi = {
  // الحصول على جميع الأقسام
  async getAll(params: Record<string, any> = {}) {
    let query = supabase
      .from('categories')
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
      console.error('Error fetching categories:', error);
      throw error;
    }

    return { data: data || [] };
  },

  // الحصول على قسم بواسطة المعرف
  async getById(id: number) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching category with ID ${id}:`, error);
      throw error;
    }

    return { data };
  },

  // إنشاء قسم جديد
  async create(category: Omit<Category, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('categories')
      .insert([{
        ...category,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select();

    if (error) {
      console.error('Error creating category:', error);
      throw error;
    }

    return { data: data?.[0] };
  },

  // تحديث قسم
  async update(id: number, category: Partial<Omit<Category, 'id' | 'created_at'>>) {
    const { data, error } = await supabase
      .from('categories')
      .update({
        ...category,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error) {
      console.error(`Error updating category with ID ${id}:`, error);
      throw error;
    }

    return { data: data?.[0] };
  },

  // حذف قسم
  async delete(id: number) {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting category with ID ${id}:`, error);
      throw error;
    }

    return { success: true };
  },

  // تغيير حالة نشاط القسم
  async toggleActive(id: number, isActive: boolean) {
    const { data, error } = await supabase
      .from('categories')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error) {
      console.error(`Error toggling category status with ID ${id}:`, error);
      throw error;
    }

    return { data: data?.[0] };
  },

  // تحديث ترتيب القسم
  async updateOrder(id: number, orderIndex: number) {
    const { data, error } = await supabase
      .from('categories')
      .update({
        order_index: orderIndex,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error) {
      console.error(`Error updating category order with ID ${id}:`, error);
      throw error;
    }

    return { data: data?.[0] };
  },

  // جلب الأقسام المرتبطة بعقار معين
  async getCategoriesForProperty(propertyId: string) {
    try {
      // الحصول على روابط الأقسام للعقار المحدد
      const { data: categoryLinks, error: linksError } = await supabase
        .from('property_categories')
        .select('category_id')
        .eq('property_id', propertyId);

      if (linksError) {
        console.error('Error fetching property category links:', linksError);
        throw linksError;
      }

      if (!categoryLinks || categoryLinks.length === 0) {
        return { data: [] };
      }

      // استخراج معرفات الأقسام
      const categoryIds = categoryLinks.map(link => link.category_id);

      // الحصول على تفاصيل الأقسام
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .in('id', categoryIds);

      if (categoriesError) {
        console.error('Error fetching categories by ids:', categoriesError);
        throw categoriesError;
      }

      return { data: categories || [] };
    } catch (error) {
      console.error('Error in getCategoriesForProperty:', error);
      throw error;
    }
  },

  // ربط عقار بعدة أقسام
  async linkPropertyToCategories(propertyId: string, categoryIds: number[]) {
    try {
      // حذف الروابط القديمة أولاً
      const { error: deleteError } = await supabase
        .from('property_categories')
        .delete()
        .eq('property_id', propertyId);

      if (deleteError) {
        console.error('Error deleting old property category links:', deleteError);
        throw deleteError;
      }

      // إضافة الروابط الجديدة
      if (categoryIds.length > 0) {
        const links = categoryIds.map(categoryId => ({
          property_id: propertyId,
          category_id: categoryId,
        }));

        const { error: insertError } = await supabase
          .from('property_categories')
          .insert(links);

        if (insertError) {
          console.error('Error linking property to categories:', insertError);
          throw insertError;
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error in linkPropertyToCategories:', error);
      throw error;
    }
  }
};
