import axios from 'axios';

interface UploadResponse {
  success: boolean;
  url: string | null;
  error?: string;
}

/**
 * Uploads an image to ImgBB, falls back to Freeimage.host if ImgBB fails
 * @param imageFile - The image file to upload
 * @returns Promise with upload response containing success status and URL
 */
export const uploadImage = async (imageFile: File): Promise<UploadResponse> => {
  // Try uploading to ImgBB first
  try {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('key', 'd4c80caf18ac57a20be196713f4245c2');
    
    const response = await axios.post('https://api.imgbb.com/1/upload', formData);
    
    if (response.data && response.data.success) {
      return {
        success: true,
        url: response.data.data.url
      };
    } else {
      throw new Error('ImgBB upload failed');
    }
  } catch (error) {
    console.error('ImgBB upload failed, trying Freeimage.host', error);
    
    // Fall back to Freeimage.host
    try {
      const formData = new FormData();
      formData.append('source', imageFile);
      formData.append('key', '6d207e02198a847aa98d0a2a901485a5');
      
      const response = await axios.post('https://freeimage.host/api/1/upload', formData);
      
      if (response.data && response.data.status_code === 200) {
        return {
          success: true,
          url: response.data.image.url
        };
      } else {
        throw new Error('Freeimage.host upload failed');
      }
    } catch (freeImageError) {
      console.error('Both image uploads failed', freeImageError);
      return {
        success: false,
        url: null,
        error: 'فشل رفع الصورة على جميع الخدمات'
      };
    }
  }
}; 