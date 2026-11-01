import { useLocalSearchParams } from 'expo-router';

import { TechniqueDetailScreen } from '../../../../src/features/library/TechniqueDetailScreen';

export default function TechniqueRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <TechniqueDetailScreen id={id} />;
}
