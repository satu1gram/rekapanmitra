/**
 * Loading placeholders. Every screen has a skeleton drawn with the same blocks, spacing and card
 * shapes as the real page, so content replaces it in place without the layout jumping. All bones in
 * one skeleton pulse together (one shared animation); with "reduce motion" on they stay still.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Pressable, StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChevronIcon } from './icons';
import { kitStyles } from './kit';
import { SheetHeader, StickyFooter } from './sheet';
import { colors, radius, space } from './theme';

const PulseContext = createContext<Animated.Value | null>(null);
const BONE = '#E4E4E9';

/** Wrapper for one skeleton: provides the shared pulse and announces "loading" to screen readers. */
export function Skeleton({ label = 'Memuat data', children, style }: { label?: string; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const [opacity] = useState(() => new Animated.Value(1));
  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then(reduce => {
      if (reduce || cancelled) return;
      loop = Animated.loop(Animated.sequence([
        Animated.timing(opacity, { toValue: 0.5, duration: 750, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 750, useNativeDriver: true }),
      ]));
      loop.start();
    });
    return () => {
      cancelled = true;
      loop?.stop();
    };
  }, [opacity]);
  return (
    <PulseContext.Provider value={opacity}>
      <View accessibilityRole="progressbar" accessibilityLabel={label} accessibilityState={{ busy: true }} style={style}>
        {children}
      </View>
    </PulseContext.Provider>
  );
}

/** One grey block. `tone="light"` is for bones drawn on the green hero. */
export function Bone({ w = '100%', h = 14, r = 8, tone, style }: { w?: DimensionValue; h?: number; r?: number; tone?: 'light'; style?: StyleProp<ViewStyle> }) {
  const opacity = useContext(PulseContext);
  return (
    <Animated.View
      style={[{ width: w, height: h, borderRadius: r, backgroundColor: tone === 'light' ? 'rgba(255,255,255,0.3)' : BONE }, opacity ? { opacity } : null, style]}
    />
  );
}

const TEXT_WIDTHS = [118, 92, 136, 104, 126, 98];

function White({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.white, style]}>{children}</View>;
}

/** Rows like OrderListRow / a customer row: round avatar, two text lines, amount on the right. */
export function RowsSkeleton({ rows = 3, avatar = true, right = true, height = 60 }: { rows?: number; avatar?: boolean; right?: boolean; height?: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, i) => (
        <View key={i} style={[styles.row, { minHeight: height }, i > 0 && styles.sep]}>
          {avatar ? <Bone w={38} h={38} r={19} /> : null}
          <View style={{ flex: 1, gap: 7 }}>
            <Bone w={TEXT_WIDTHS[i % TEXT_WIDTHS.length]} h={14} />
            <Bone w={TEXT_WIDTHS[(i + 3) % TEXT_WIDTHS.length] - 30} h={11} />
          </View>
          {right ? (
            <View style={{ alignItems: 'flex-end', gap: 7 }}>
              <Bone w={74} h={14} />
              <Bone w={58} h={11} />
            </View>
          ) : null}
        </View>
      ))}
    </>
  );
}

function ListCard(props: { rows?: number; avatar?: boolean; right?: boolean; height?: number }) {
  return <White style={{ paddingHorizontal: 14 }}><RowsSkeleton {...props} /></White>;
}

function FieldRows({ rows, first = true }: { rows: number; first?: boolean }) {
  return (
    <>
      {Array.from({ length: rows }, (_, i) => (
        <View key={i} style={[styles.field, !(first && i === 0) && styles.sep]}>
          <Bone w={86} h={13} />
          <Bone w={[120, 150, 100, 136][i % 4]} h={14} />
        </View>
      ))}
    </>
  );
}

function SectionBone({ w = 110 }: { w?: number }) {
  return <Bone w={w} h={16} style={{ marginBottom: -2 }} />;
}

function PillsBone({ widths }: { widths: number[] }) {
  return <View style={{ flexDirection: 'row', gap: 8 }}>{widths.map((w, i) => <Bone key={i} w={w} h={34} r={17} />)}</View>;
}

/** Same size as MonthCard (measured): 154 for month + total, then the darker band of 74. */
function MonthCardBone({ band = 2 }: { band?: 1 | 2 }) {
  return (
    <View style={styles.monthCard}>
      <View style={{ height: 154, paddingHorizontal: 16, paddingTop: 12, gap: 10 }}>
        <View style={{ alignItems: 'center' }}><Bone w={140} h={30} r={15} tone="light" /></View>
        <Bone w={96} h={13} tone="light" />
        <Bone w={190} h={30} r={10} tone="light" />
        <Bone w={160} h={13} tone="light" />
      </View>
      <View style={[styles.band, { height: 74 }]}>
        {Array.from({ length: band }, (_, i) => (
          <View key={i} style={[{ flex: 1, paddingHorizontal: 16, gap: 7, justifyContent: 'center' }, i > 0 && { borderLeftWidth: 1, borderColor: 'rgba(255,255,255,0.18)' }]}>
            <Bone w={80} h={12} tone="light" />
            <Bone w={104} h={18} tone="light" />
            <Bone w={band === 2 ? 110 : 150} h={11} tone="light" />
          </View>
        ))}
      </View>
    </View>
  );
}

/* ---------- tab screens (the page title above stays real; only the body is a skeleton) ---------- */

export function HomeHeaderSkeleton() {
  return (
    <Skeleton label="Memuat beranda" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View style={{ flex: 1, gap: 8 }}><Bone w={90} h={14} /><Bone w={140} h={22} /></View>
      <Bone w={44} h={44} r={14} />
      <Bone w={44} h={44} r={22} />
    </Skeleton>
  );
}

export function HomeSkeleton() {
  return (
    <Skeleton label="Memuat data usaha" style={{ gap: space.xl }}>
      <MonthCardBone />
      <View style={styles.tray}>
        {[0, 1, 2, 3].map(i => (
          <View key={i} style={{ flex: 1, alignItems: 'center', gap: 8 }}><Bone w={44} h={44} r={14} /><Bone w={52} h={11} /></View>
        ))}
      </View>
      <View style={{ gap: 10 }}>
        <Bone w={150} h={18} />
        <View style={styles.taskCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Bone w={40} h={40} r={20} />
            <View style={{ flex: 1, gap: 7 }}><Bone w={150} h={14} /><Bone w={120} h={11} /></View>
            <Bone w={76} h={14} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Bone w={120} h={28} />
            <Bone w={124} h={44} r={10} />
          </View>
        </View>
      </View>
      <View style={{ flexDirection: 'row' }}>
        {[0, 1, 2, 3, 4].map(i => <View key={i} style={{ flex: 1, alignItems: 'center', gap: 8 }}><Bone w={48} h={48} r={16} /><Bone w={44} h={11} /></View>)}
      </View>
      <View style={styles.targetCard}>
        <Bone w={130} h={16} />
        {[0, 1, 2].map(i => <View key={i} style={{ gap: 8 }}><Bone w="70%" h={13} /><Bone h={6} r={3} /></View>)}
      </View>
    </Skeleton>
  );
}

export function HistorySkeleton() {
  return (
    <Skeleton label="Memuat order" style={{ gap: space.md }}>
      <MonthCardBone band={1} />
      <Bone h={42} r={12} />
      <PillsBone widths={[64, 120, 76]} />
      <Bone w={96} h={16} style={{ marginTop: 6 }} />
      <ListCard rows={3} />
      <Bone w={80} h={16} style={{ marginTop: 6 }} />
      <ListCard rows={2} />
    </Skeleton>
  );
}

export function StockSkeleton() {
  return (
    <Skeleton label="Memuat stok" style={{ gap: space.lg }}>
      <View style={styles.hero}>
        <View style={{ padding: 16, gap: 10 }}>
          <Bone w={90} h={13} tone="light" />
          <Bone w={110} h={40} r={10} tone="light" />
          <Bone w={200} h={13} tone="light" />
        </View>
        <View style={[styles.band, { padding: 12, gap: 12, alignItems: 'center' }]}>
          <Bone w={36} h={36} r={11} tone="light" />
          <View style={{ flex: 1, gap: 7 }}><Bone w={100} h={14} tone="light" /><Bone w="80%" h={11} tone="light" /></View>
        </View>
      </View>
      <View style={{ gap: 6 }}><Bone h={11} /><Bone w="72%" h={11} /></View>
      <Bone w={120} h={20} />
      <Bone h={46} r={23} />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[0, 1, 2].map(i => <White key={i} style={{ flex: 1, paddingHorizontal: 12, paddingVertical: 10, gap: 8 }}><Bone w={50} h={12} /><Bone w={70} h={15} /></White>)}
      </View>
      <PillsBone widths={[68, 70, 70]} />
      <ListCard rows={3} avatar />
    </Skeleton>
  );
}

export function AccountSkeleton() {
  return (
    <Skeleton label="Memuat akun" style={{ gap: space.lg }}>
      <White style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }}>
        <Bone w={56} h={56} r={28} />
        <View style={{ flex: 1, gap: 8 }}><Bone w={130} h={17} /><Bone w={170} h={12} /><Bone w={80} h={12} /></View>
        <Bone w={72} h={36} r={18} />
      </White>
      <View style={{ gap: space.sm }}>
        <SectionBone />
        <View style={styles.levelCard}>
          <View style={{ flex: 1, gap: 8 }}><Bone w={70} h={17} tone="light" /><Bone w={150} h={12} tone="light" /></View>
          <Bone w={68} h={36} r={18} tone="light" />
        </View>
      </View>
      <View style={{ gap: space.sm }}>
        <SectionBone w={64} />
        <White style={{ paddingHorizontal: 14 }}><MenuRowsBone rows={5} /></White>
      </View>
      <View style={{ gap: space.sm }}>
        <SectionBone w={76} />
        <White style={{ paddingHorizontal: 14 }}><MenuRowsBone rows={3} /></White>
      </View>
    </Skeleton>
  );
}

function MenuRowsBone({ rows }: { rows: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, i) => (
        <View key={i} style={[styles.row, { minHeight: 58 }, i > 0 && styles.sep]}>
          <Bone w={36} h={36} r={11} />
          <View style={{ flex: 1, gap: 7 }}><Bone w={[130, 170, 110, 120, 150][i % 5]} h={14} /><Bone w={[190, 150, 170, 120, 160][i % 5]} h={11} /></View>
          <Bone w={8} h={14} r={4} />
        </View>
      ))}
    </>
  );
}

/* ---------- pushed pages (real PageHeader above) ---------- */

export function CustomersSkeleton() {
  return (
    <Skeleton label="Memuat pelanggan" style={{ gap: space.md, paddingHorizontal: space.lg, paddingTop: space.sm }}>
      <Bone h={42} r={12} />
      <PillsBone widths={[68, 128, 48]} />
      <Bone w={84} h={13} />
      <ListCard rows={6} />
    </Skeleton>
  );
}

export function CustomerDetailSkeleton() {
  return (
    <Skeleton label="Memuat pelanggan" style={{ gap: space.lg, paddingHorizontal: space.lg, paddingTop: space.sm }}>
      <White style={{ padding: 14, gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Bone w={52} h={52} r={26} />
          <View style={{ flex: 1, gap: 8 }}><Bone w={140} h={17} /><Bone w={64} h={18} r={9} /></View>
        </View>
        <View style={{ gap: 6 }}><Bone w={120} h={14} /><Bone w="80%" h={12} /></View>
        <View style={{ flexDirection: 'row', gap: 8 }}><Bone h={58} r={14} style={{ flex: 1, width: undefined }} /><Bone h={58} r={14} style={{ flex: 1, width: undefined }} /></View>
        <View style={{ flexDirection: 'row', gap: 8 }}><Bone h={36} r={18} style={{ flex: 1, width: undefined }} /><Bone h={36} r={18} style={{ flex: 1, width: undefined }} /></View>
      </White>
      <View style={{ gap: space.sm }}>
        <SectionBone w={110} />
        <ListCard rows={3} />
      </View>
    </Skeleton>
  );
}

/** The total card of Pengeluaran/Pemasukan: shown instead of a misleading "Rp0" while entries load. */
export function FinanceTotalSkeleton() {
  return (
    <Skeleton label="Memuat total" style={[styles.white, { padding: 14, gap: 8 }]}>
      <Bone w={170} h={13} />
      <Bone w={150} h={28} r={10} />
      <Bone w="90%" h={12} />
      <Bone w="60%" h={12} />
    </Skeleton>
  );
}

export function FinanceSkeleton() {
  return (
    <Skeleton label="Memuat catatan" style={{ gap: space.sm }}>
      <Bone w={96} h={18} />
      <ListCard rows={4} avatar={false} height={58} />
    </Skeleton>
  );
}

export function TargetSkeleton() {
  return (
    <Skeleton label="Memuat target" style={{ gap: space.lg, paddingHorizontal: space.lg, paddingTop: space.sm }}>
      <Bone h={46} r={23} />
      <View style={{ gap: space.sm }}>
        <SectionBone w={130} />
        <White style={{ padding: 14, gap: 14 }}>
          {[0, 1, 2].map(i => <View key={i} style={{ gap: 8 }}><Bone w="75%" h={13} /><Bone h={6} r={3} /></View>)}
        </White>
      </View>
      <View style={{ gap: space.sm }}>
        <SectionBone w={100} />
        <White style={{ paddingHorizontal: 14 }}><FieldRows rows={3} /></White>
      </View>
    </Skeleton>
  );
}

/** The "Capaian" card on Target, shown while order and stock totals are still loading. */
export function ProgressCardSkeleton() {
  return (
    <Skeleton label="Memuat capaian" style={{ gap: space.sm }}>
      <SectionBone w={130} />
      <White style={{ padding: 14, gap: 14 }}>
        {[0, 1, 2].map(i => <View key={i} style={{ gap: 8 }}><Bone w="75%" h={13} /><Bone h={6} r={3} /></View>)}
      </White>
    </Skeleton>
  );
}

export function StoreSkeleton() {
  return (
    <Skeleton label="Memuat toko" style={{ gap: space.lg, paddingHorizontal: space.lg, paddingTop: space.sm }}>
      <View style={[styles.levelCard, { flexDirection: 'column', alignItems: 'stretch', gap: 12 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Bone w={40} h={40} r={12} tone="light" />
          <View style={{ flex: 1, gap: 8 }}><Bone w={120} h={16} tone="light" /><Bone w={180} h={12} tone="light" /></View>
          <Bone w={50} h={30} r={15} tone="light" />
        </View>
        <Bone h={38} r={12} tone="light" />
        <View style={{ flexDirection: 'row', gap: 8 }}><Bone h={36} r={18} tone="light" style={{ flex: 1, width: undefined }} /><Bone h={36} r={18} tone="light" style={{ flex: 1, width: undefined }} /></View>
      </View>
      <View style={{ gap: space.sm }}>
        <SectionBone w={80} />
        <White style={{ paddingHorizontal: 14 }}><FieldRows rows={3} /></White>
      </View>
      <View style={{ gap: space.sm }}>
        <SectionBone w={130} />
        <Bone h={48} r={18} />
      </View>
    </Skeleton>
  );
}

/* ---------- order detail (green hero) ---------- */

export function OrderDetailSkeleton() {
  const insets = useSafeAreaInsets();
  return (
    <View style={kitStyles.page}>
      <Skeleton label="Memuat order">
        <View style={[styles.detailHero, { paddingTop: insets.top + 4 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Kembali" hitSlop={8} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
              <ChevronIcon direction="left" size={26} color={colors.white} />
            </Pressable>
            <Bone w={120} h={13} tone="light" />
            <Bone w={40} h={16} tone="light" />
          </View>
          <Bone w={180} h={26} r={10} tone="light" />
          <View style={{ gap: 6 }}><Bone w="92%" h={13} tone="light" /><Bone w="64%" h={13} tone="light" /></View>
          <View style={{ flexDirection: 'row', gap: 6 }}>{[0, 1, 2].map(i => <Bone key={i} h={5} r={3} tone="light" style={{ flex: 1, width: undefined }} />)}</View>
        </View>
        <View style={{ marginTop: -30, paddingHorizontal: space.lg, gap: 10 }}>
          <White style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }}>
            <Bone w={44} h={44} r={22} />
            <View style={{ flex: 1, gap: 8 }}><Bone w={120} h={16} /><Bone w={90} h={12} /></View>
            <Bone w={40} h={40} r={20} />
          </White>
          <White style={{ padding: 14, gap: 14 }}>
            {[0, 1, 2].map(i => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <Bone w={24} h={24} r={12} />
                <View style={{ gap: 6 }}><Bone w={[110, 80, 70][i]} h={14} />{i < 2 ? <Bone w={130} h={11} /> : null}</View>
              </View>
            ))}
          </White>
          <White style={{ padding: 14, gap: 12 }}>
            <RowsSkeleton rows={2} right height={44} />
            <Bone h={1} r={0} />
            {[0, 1, 2].map(i => <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Bone w={110} h={13} /><Bone w={80} h={13} /></View>)}
          </White>
          <View style={{ flexDirection: 'row', gap: 8 }}>{[0, 1, 2].map(i => <Bone key={i} h={64} r={16} style={{ flex: 1, width: undefined }} />)}</View>
        </View>
      </Skeleton>
    </View>
  );
}

/* ---------- sheets (order form, restock form, finance form) ---------- */

function SheetScaffold({ title, footer = 'Simpan', children }: { title: string; footer?: string; children: ReactNode }) {
  return (
    <View style={kitStyles.page}>
      <SheetHeader title={title} onClose={() => router.back()} />
      <Skeleton label={`Memuat ${title.toLowerCase()}`} style={{ flex: 1, padding: space.lg, gap: space.lg }}>{children}</Skeleton>
      <StickyFooter>
        <Skeleton label={footer}><Bone h={48} r={24} /></Skeleton>
      </StickyFooter>
    </View>
  );
}

export function OrderFormSkeleton({ title = 'Order baru' }: { title?: string }) {
  return (
    <SheetScaffold title={title}>
      <White style={{ paddingHorizontal: 14 }}>
        {[0, 1].map(i => (
          <View key={i} style={[styles.row, { minHeight: 50 }, i > 0 && styles.sep]}>
            <Bone w={20} h={12} r={6} />
            <View style={{ flex: 1, gap: 6 }}><Bone w={64} h={11} /><Bone w={150} h={15} /></View>
            <Bone w={36} h={13} />
          </View>
        ))}
      </White>
      <View style={{ gap: space.sm }}>
        <SectionBone w={64} />
        <White style={{ paddingHorizontal: 14 }}>
          {[0, 1, 2, 3].map(i => (
            <View key={i} style={[styles.row, { minHeight: 56 }, i > 0 && styles.sep]}>
              <Bone w={44} h={44} r={11} />
              <View style={{ flex: 1, gap: 7 }}><Bone w={[130, 90, 110, 120][i]} h={14} /><Bone w={96} h={11} /></View>
              <Bone w={36} h={36} r={18} />
            </View>
          ))}
        </White>
      </View>
      <View style={{ gap: space.sm }}>
        <SectionBone w={52} />
        <White style={{ padding: 14, gap: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Bone w={120} h={15} /><Bone w={86} h={15} /></View>
          <Bone h={6} r={3} />
        </White>
      </View>
    </SheetScaffold>
  );
}

export function RestockFormSkeleton({ title = 'Catat restok' }: { title?: string }) {
  return (
    <SheetScaffold title={title}>
      <View style={{ gap: space.sm }}>
        <SectionBone w={150} />
        <White style={{ padding: 14, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Bone w={48} h={48} r={24} />
            <View style={{ flex: 1, alignItems: 'center', gap: 6 }}><Bone w={70} h={34} r={10} /><Bone w={40} h={12} /></View>
            <Bone w={48} h={48} r={24} />
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>{[0, 1, 2, 3].map(i => <Bone key={i} h={38} r={19} style={{ flex: 1, width: undefined }} />)}</View>
        </White>
      </View>
      <View style={{ gap: space.sm }}>
        <SectionBone w={80} />
        <White style={{ paddingHorizontal: 14 }}><FieldRows rows={2} /></White>
      </View>
      <View style={{ gap: space.sm }}>
        <SectionBone w={56} />
        <White style={{ paddingHorizontal: 14 }}><FieldRows rows={3} /></White>
      </View>
    </SheetScaffold>
  );
}

export function MoneyFormSkeleton({ title }: { title: string }) {
  return (
    <SheetScaffold title={title}>
      <White style={{ padding: 14, gap: 10 }}><Bone w={60} h={13} /><Bone w={150} h={30} r={10} /></White>
      <White style={{ paddingHorizontal: 14 }}><FieldRows rows={3} /></White>
      <View style={{ gap: space.sm }}>
        <SectionBone w={70} />
        <White style={{ padding: 12, gap: 8, flexDirection: 'row', flexWrap: 'wrap' }}>
          {[96, 74, 80, 98, 82, 78].map((w, i) => <Bone key={i} w={w} h={34} r={17} />)}
        </White>
      </View>
    </SheetScaffold>
  );
}

const styles = StyleSheet.create({
  white: { backgroundColor: colors.white, borderRadius: 18 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  sep: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  field: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 48, justifyContent: 'space-between' },
  monthCard: { borderRadius: radius.xl, overflow: 'hidden', backgroundColor: colors.brand },
  hero: { borderRadius: radius.xl, overflow: 'hidden', backgroundColor: colors.brand },
  band: { flexDirection: 'row', backgroundColor: '#096947' },
  levelCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.brand, borderRadius: 18, padding: 14 },
  tray: { flexDirection: 'row', marginTop: -6, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, paddingVertical: 10, paddingHorizontal: 4 },
  taskCard: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 14, gap: space.md },
  targetCard: { backgroundColor: colors.fill, borderRadius: radius.lg, paddingHorizontal: space.lg, paddingVertical: 14, gap: 12 },
  detailHero: { backgroundColor: colors.brand, paddingHorizontal: space.lg, paddingBottom: 44, gap: 10 },
});
