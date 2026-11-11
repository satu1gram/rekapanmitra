import { View } from 'react-native';
import { AppText, Row } from './components';
import { colors, radius } from './theme';

export function ProgressBar({ label, valueText, pct }: { label: string; valueText: string; pct: number }) {
  return (
    <View style={{ gap: 6 }} accessibilityLabel={`${label}: ${valueText}, ${pct} persen`}>
      <Row style={{ justifyContent: 'space-between' }}>
        <AppText variant="small" color={colors.textMuted}>{label}</AppText>
        <AppText variant="small" style={{ fontWeight: '700' }}>{valueText}</AppText>
      </Row>
      <View style={{ height: 8, borderRadius: radius.pill, backgroundColor: '#E2E8F0', overflow: 'hidden' }}>
        <View style={{ width: `${pct}%`, height: '100%', backgroundColor: pct >= 100 ? colors.brand : '#34D399', borderRadius: radius.pill }} />
      </View>
    </View>
  );
}
