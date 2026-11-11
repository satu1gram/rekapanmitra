import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';

import { supabase } from '~/lib/supabase';
import { requireUserId } from './db';

const BUCKET = 'transfer-proofs';
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Let the user take or choose a photo, then upload it to the same storage bucket and path
 * pattern the web app uses ("<user id>/<timestamp>.jpg"). Returns null when the user cancels.
 */
export async function pickAndUploadProof(source: 'camera' | 'library'): Promise<string | null> {
  const permission = source === 'camera'
    ? await ImagePicker.requestCameraPermissionsAsync()
    : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error(source === 'camera'
      ? 'Izin kamera ditolak. Aktifkan di Pengaturan HP untuk memotret bukti.'
      : 'Izin galeri ditolak. Aktifkan di Pengaturan HP untuk memilih foto.');
  }

  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.6, base64: true, exif: false };
  const result = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  if (!asset.base64) throw new Error('Foto tidak bisa dibaca. Coba foto lain.');
  const bytes = decode(asset.base64);
  if (bytes.byteLength > MAX_BYTES) throw new Error('Ukuran foto maksimal 5MB.');

  const isPng = asset.mimeType === 'image/png';
  const userId = await requireUserId();
  const path = `${userId}/${Date.now()}.${isPng ? 'png' : 'jpg'}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
    contentType: isPng ? 'image/png' : 'image/jpeg',
    upsert: false,
  });
  if (error) throw error;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
