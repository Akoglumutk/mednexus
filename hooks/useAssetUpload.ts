// hooks/useAssetUpload.ts
import { supabase } from '@/lib/supabase';

export const useAssetUpload = () => {
  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `vault/${fileName}`;

    const { data, error } = await supabase.storage
      .from('assets') // Supabase'de 'assets' bucket'ı oluşturduğundan emin ol
      .upload(filePath, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('assets')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          return await uploadImage(file);
        }
      }
    }
    return null;
  };

  return { uploadImage, handlePaste };
};