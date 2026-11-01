import { useLocalSearchParams } from 'expo-router';

import { SessionDetailScreen } from '../../src/features/session/SessionDetailScreen';

export default function SessionRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <SessionDetailScreen id={id} />;
}
