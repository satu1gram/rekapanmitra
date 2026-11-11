import { useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, StyleSheet, View } from 'react-native';

import { pickAndUploadProof } from '~/data/proofs';
import { errorMessage } from '~/lib/supabase';
import { AppText, Button, Notice, Row } from './components';
import { colors, radius, space } from './theme';

/** Attach a transfer proof photo (camera or gallery). The photo is uploaded right away and its URL returned. */
export function ProofPicker({ value, onChange, label = 'Bukti transfer (opsional)' }: { value: string | null; onChange: (url: string | null) => void; label?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = async (source: 'camera' | 'library') => {
    setBusy(true);
    setError(null);
    try {
      const url = await pickAndUploadProof(source);
      if (url) onChange(url);
    } catch (e) {
      setError(errorMessage(e, 'Foto gagal diunggah.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ gap: space.sm }}>
      <AppText variant="small" color={colors.textMuted} style={{ fontWeight: '600' }}>{label}</AppText>
      {error ? <Notice tone="danger">{error}</Notice> : null}
      {value ? (
        <View style={{ gap: space.sm }}>
          <Pressable onPress={() => Linking.openURL(value)} accessibilityRole="imagebutton" accessibilityLabel="Bukti transfer. Ketuk untuk membuka ukuran penuh.">
            <Image source={{ uri: value }} style={styles.preview} resizeMode="cover" />
          </Pressable>
          <Row>
            <Button label="Ganti" tone="secondary" icon="camera-outline" onPress={() => pick('camera')} style={{ flex: 1 }} disabled={busy} />
            <Button label="Hapus" tone="danger" icon="trash-outline" onPress={() => onChange(null)} style={{ flex: 1 }} disabled={busy} />
          </Row>
        </View>
      ) : busy ? (
        <View style={[styles.preview, styles.placeholder]}>
          <ActivityIndicator color={colors.brand} />
          <AppText variant="small" color={colors.textMuted}>Mengunggah foto…</AppText>
        </View>
      ) : (
        <Row>
          <Button label="Kamera" tone="secondary" icon="camera-outline" onPress={() => pick('camera')} style={{ flex: 1 }} />
          <Button label="Galeri" tone="secondary" icon="image-outline" onPress={() => pick('library')} style={{ flex: 1 }} />
        </Row>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  preview: { width: '100%', height: 180, borderRadius: radius.md, backgroundColor: '#F1F5F9' },
  placeholder: { alignItems: 'center', justifyContent: 'center', gap: space.sm },
});
