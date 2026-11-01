import { Stack, useLocalSearchParams } from 'expo-router';

import { PositionDetailScreen } from '../../../../src/features/library/PositionDetailScreen';
import { usePosition } from '../../../../src/hooks/data';

export default function PositionRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = usePosition(id);
  return (
    <>
      <Stack.Screen options={{ title: data?.canonicalName ?? '' }} />
      <PositionDetailScreen id={id} />
    </>
  );
}
