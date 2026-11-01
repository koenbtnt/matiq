import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ListRow } from '../../components/ListRow';
import { Txt } from '../../components/Txt';
import type { SessionSummary } from '../../hooks/data';
import { radius, size } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';
import { fmt } from './format';

export function RecentSessionRow({ session }: { session: SessionSummary }) {
  const { t } = useTranslation();
  const { c } = useTheme();
  const meta = [
    session.durationMinutes ? t('home.recent.meta.duration', { minutes: session.durationMinutes }) : undefined,
    session.rating ? t('home.recent.meta.rating', { value: session.rating }) : undefined,
    session.focusNames.length ? session.focusNames.join(' · ') : undefined,
  ].filter(Boolean).join(' · ');
  return (
    <ListRow
      testID={`home.recent.${session.id}`}
      title={session.sessionTypeName}
      subtitle={[meta]}
      subtitleLines={1}
      leading={
        <View style={[styles.tile, { backgroundColor: c.bgSurface, borderColor: c.borderDefault }]}>
          <Txt variant="overline" color="textSecondary">{fmt.weekday(session.startsAt)}</Txt>
          <Txt variant="statUnit">{fmt.day(session.startsAt)}</Txt>
        </View>
      }
      chevron
      accessibilityLabel={t('home.recent.a11y', { type: session.sessionTypeName, date: fmt.localDateShort(session.localDate), meta })}
      onPress={() => router.push({ pathname: '/session/[id]', params: { id: session.id } })}
    />
  );
}

const styles = StyleSheet.create({
  tile: { width: size.dateTile, height: size.dateTile, borderRadius: radius.md, borderWidth: size.borderWidth, alignItems: 'center', justifyContent: 'center' },
});
