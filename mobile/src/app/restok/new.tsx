import { useLocalSearchParams } from 'expo-router';
import { RestockForm } from '~/ui/RestockForm';

export default function NewRestockScreen() {
  const { qty } = useLocalSearchParams<{ qty?: string }>();
  const parsed = qty ? parseInt(qty, 10) : NaN;
  return <RestockForm initialQuantity={Number.isInteger(parsed) && parsed > 0 ? parsed : undefined} />;
}
