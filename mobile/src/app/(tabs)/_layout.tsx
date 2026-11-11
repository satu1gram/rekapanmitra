import { NativeTabs } from 'expo-router/native-tabs';
import { colors } from '~/ui/theme';

export default function TabsLayout() {
  return (
    <NativeTabs tintColor={colors.brand} iconColor={{ default: colors.textSubtle, selected: colors.brand }} labelStyle={{ selected: { color: colors.brandDark } }} indicatorColor={colors.brandSoft}>
      <NativeTabs.Trigger name="(beranda)">
        <NativeTabs.Trigger.Label>Beranda</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="riwayat">
        <NativeTabs.Trigger.Label>Riwayat</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'list.bullet.rectangle', selected: 'list.bullet.rectangle.fill' }} md="receipt_long" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="stok">
        <NativeTabs.Trigger.Label>Stok</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'shippingbox', selected: 'shippingbox.fill' }} md="inventory_2" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="akun">
        <NativeTabs.Trigger.Label>Akun</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }} md="account_circle" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
