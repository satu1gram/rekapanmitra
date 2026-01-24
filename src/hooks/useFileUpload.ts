import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// Allowed MIME types for transfer proofs
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf'
];

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Validate file type and size
const validateFile = (file: File): void => {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Ukuran file maksimal 5MB');
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error('Format file tidak didukung. Gunakan JPG, PNG, WebP, GIF, atau PDF');
  }

  // Additional validation: check file extension matches MIME type
  const ext = file.name.split('.').pop()?.toLowerCase();
  const validExtensions: Record<string, string[]> = {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/webp': ['webp'],
    'image/gif': ['gif'],
    'application/pdf': ['pdf']
  };

  const allowedExts = validExtensions[file.type] || [];
  if (!ext || !allowedExts.includes(ext)) {
    throw new Error('Ekstensi file tidak sesuai dengan tipe file');
  }
};

export function useFileUpload() {
  const { user } = useAuth();

  const uploadTransferProof = async (file: File): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    // Validate file before upload
    validateFile(file);

    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('transfer-proofs')
      .upload(filePath, file, {
        contentType: file.type, // Set proper Content-Type header
        upsert: false
      });

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
