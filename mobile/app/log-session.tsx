import { useLocalSearchParams } from 'expo-router';

import { LogSessionScreen, type LogSessionParams } from '../src/features/log-session/LogSessionScreen';

export default function LogSessionRoute() {
  const params = useLocalSearchParams<LogSessionParams>();
  return <LogSessionScreen params={params} />;
}
