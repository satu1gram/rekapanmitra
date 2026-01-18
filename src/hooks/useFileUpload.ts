import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useFileUpload() {
  const { user } = useAuth();

  const uploadTransferProof = async (file: File): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('transfer-proofs')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('transfer-proofs')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const deleteTransferProof = async (url: string) => {
    if (!user) throw new Error('User not authenticated');

    // Extract file path from URL
    const urlParts = url.split('/transfer-proofs/');
    if (urlParts.length < 2) return;
    
    const filePath = urlParts[1];

    await supabase.storage
      .from('transfer-proofs')
      .remove([filePath]);
  };

  return {
    uploadTransferProof,
    deleteTransferProof
  };
}
