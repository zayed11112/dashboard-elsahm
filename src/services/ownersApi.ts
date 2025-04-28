import { supabase } from '../supabase/config';
import { supabaseAuthService } from './supabaseAuthService';

// تعريف واجهة المالك
export interface SupabaseOwner {
  id?: string;
  name: string;              // اسم المالك
  phone: string;             // رقم الهاتف
  email?: string;            // البريد الإلكتروني (اختياري)
  address?: string;          // العنوان (اختياري)
  notes?: string;            // ملاحظات (اختياري)
  created_at?: string;
  updated_at?: string;
  user_id?: string;          // معرف المستخدم الذي أنشأ المالك
}

// خدمة API للمُلاك
export const supabaseOwnersApi = {
  // الحصول على جميع المُلاك
  async getAll(params: Record<string, any> = {}) {
    let query = supabase
      .from('owners')
      .select('*');

    // تطبيق عوامل التصفية إذا وجدت
    if (params.search) {
      query = query.or(`name.ilike.%${params.search}%,phone.ilike.%${params.search}%,email.ilike.%${params.search}%`);
    }

    // ترتيب حسب تاريخ الإنشاء (الأحدث أولاً)
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching owners:', error);
      throw error;
    }

    return { data: data || [] };
  },

  // الحصول على مالك بواسطة المعرف
  async getById(id: string) {
    const { data, error } = await supabase
      .from('owners')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching owner with ID ${id}:`, error);
      throw error;
    }

    return { data };
  },

  // إنشاء مالك جديد
  async create(owner: SupabaseOwner) {
    try {
      // إدخال المالك الجديد بدون التحقق من المصادقة
      // هذا يسمح بإنشاء ملاك جدد بدون الحاجة لتسجيل الدخول
      const { data, error } = await supabase
        .from('owners')
        .insert([{
          ...owner,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select();

      if (error) {
        console.error('Error creating owner:', error);
        throw error;
      }

      return { data: data?.[0] };
    } catch (error) {
      console.error('Error in create owner:', error);
      throw error;
    }
  },

  // تحديث مالك موجود
  async update(id: string, owner: Partial<SupabaseOwner>) {
    try {
      // تحديث المالك بدون التحقق من المصادقة
      const { data, error } = await supabase
        .from('owners')
        .update({
          ...owner,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();

      if (error) {
        console.error(`Error updating owner with ID ${id}:`, error);
        throw error;
      }

      return { data: data?.[0] };
    } catch (error) {
      console.error('Error in update owner:', error);
      throw error;
    }
  },

  // حذف مالك
  async delete(id: string) {
    try {
      // التحقق من وجود عقارات مرتبطة بالمالك
      const { data: properties } = await supabase
        .from('properties')
        .select('id')
        .eq('owner_id', id);

      // إذا كان هناك عقارات مرتبطة بالمالك
      if (properties && properties.length > 0) {
        // تحديث العقارات لإزالة ارتباطها بالمالك
        const { error: updateError } = await supabase
          .from('properties')
          .update({
            owner_id: null,
            owner_name: null,
            owner_phone: null,
            updated_at: new Date().toISOString()
          })
          .eq('owner_id', id);

        if (updateError) {
          console.error(`Error updating properties for owner ${id}:`, updateError);
          throw updateError;
        }
      }

      // حذف المالك بعد إزالة الارتباطات
      const { error } = await supabase
        .from('owners')
        .delete()
        .eq('id', id);

      if (error) {
        console.error(`Error deleting owner with ID ${id}:`, error);
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Error in delete owner:', error);
      throw error;
    }
  },

  // الحصول على العقارات المرتبطة بمالك معين
  async getOwnerProperties(ownerId: string) {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`Error fetching properties for owner ${ownerId}:`, error);
      throw error;
    }

    return { data: data || [] };
  },

  // البحث عن المُلاك
  async searchOwners(searchTerm: string) {
    const { data, error } = await supabase
      .from('owners')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
      .order('name', { ascending: true })
      .limit(10);

    if (error) {
      console.error('Error searching owners:', error);
      throw error;
    }

    return { data: data || [] };
  },

  // إنشاء مالك جديد إذا لم يكن موجوداً
  async createIfNotExists(ownerName: string, ownerPhone: string) {
    if (!ownerName || !ownerPhone) {
      return { data: null };
    }

    try {
      // البحث عن المالك بالاسم ورقم الهاتف
      const { data: existingOwners } = await supabase
        .from('owners')
        .select('*')
        .eq('name', ownerName)
        .eq('phone', ownerPhone);

      // إذا وجد المالك، أعد المالك الموجود
      if (existingOwners && existingOwners.length > 0) {
        return { data: existingOwners[0] };
      }

      // إذا لم يوجد المالك، قم بإنشاء مالك جديد
      const { data, error } = await supabase
        .from('owners')
        .insert([{
          name: ownerName,
          phone: ownerPhone,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select();

      if (error) {
        console.error('Error creating owner:', error);
        throw error;
      }

      return { data: data?.[0] || null };
    } catch (error) {
      console.error('Error in createIfNotExists:', error);
      throw error;
    }
  }
};
