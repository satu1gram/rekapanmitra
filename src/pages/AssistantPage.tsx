import { useBusinessOverview } from '@/hooks/useBusinessOverview';
import AssistantExperience from '@/components/assistant/AssistantExperience';

export default function AssistantPage({ demo = false }: { demo?: boolean }) {
  const query = useBusinessOverview(demo);
  return <AssistantExperience demo={demo} query={query} />;
}
