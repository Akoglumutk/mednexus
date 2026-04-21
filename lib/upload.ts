import { supabase } from './supabase';

export async function uploadImage(file: File) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random()}.${fileExt}`;
  const filePath = `notes/${fileName}`;

  const { data, error } = await supabase.storage
    .from('mednexus-assets')
    .upload(filePath, file);

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('mednexus-assets')
    .getPublicUrl(filePath);

  return publicUrl;
}