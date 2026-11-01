import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Button } from '../../components/Button';
import { ListRow } from '../../components/ListRow';
import { toast } from '../../components/Toast';
import { useDataActions, type SessionSummary } from '../../hooks/data';
import { spacing } from '../../theme/tokens';
import { fmt } from './format';

type Props = { session: SessionSummary; kind: 'planned' | 'stale' };

/** A PLANNED session needing action: Log it, and (stale only) Skip with Undo (T-14). */
export function StaleSessionRow({ session, kind }: Props) {
  const { t } = useTranslation();
  const actions = useDataActions();
  const id = `home.${kind}.${session.id}`;
  const date = fmt.localDateShort(session.localDate);
  const skip = async () => {
    await actions.skip(session.id);
    toast.show({ message: t('toast.sessionSkipped'), undo: () => void actions.undoSkip(session.id) });
  };
  return (
    <ListRow
      testID={id}
      title={session.sessionTypeName}
      subtitle={[`${date} · ${fmt.time(session.startsAt)}`]}
      wrap
      trailing={
        <View style={styles.actions}>
          <Button variant="ghost" testID={`${id}.logIt`} label={t('home.stale.logIt')} accessibilityLabel={t('home.stale.logIt.a11y', { type: session.sessionTypeName, date })} onPress={() => router.push({ pathname: '/log-session', params: { mode: 'log', sessionId: session.id } })} />
          {kind === 'stale' ? (
            <Button variant="ghost" testID={`${id}.skip`} label={t('home.stale.skip')} accessibilityLabel={t('home.stale.skip.a11y', { type: session.sessionTypeName, date })} onPress={() => void skip()} />
          ) : null}
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({ actions: { flexDirection: 'row' } });
