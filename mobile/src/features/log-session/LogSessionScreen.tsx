import { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { BottomActionBar } from '../../components/BottomActionBar';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { LoadingState } from '../../components/LoadingState';
import { SheetChrome } from '../../components/SheetChrome';
import { useHome, useSession, useSessionTypes } from '../../hooks/data';
import { errorKey } from '../../i18n/keys';
import { spacing } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';
import { LogForm } from './LogForm';
import { heldDraft } from './heldDraft';
import { blankDraft, draftFromSession, parseFocusParam, reducer, type LogDraft, type LogMode } from './state';

export type LogSessionParams = { mode?: string; sessionId?: string; typeId?: string; focus?: string; restore?: string; from?: string };

/** Loads everything the sheet needs, then mounts the form with its initial draft (D-A8, D-A9). */
export function LogSessionScreen({ params }: { params: LogSessionParams }) {
  const { t } = useTranslation();
  const { c } = useTheme();
  const mode: LogMode = params.mode === 'plan' || params.mode === 'edit' ? params.mode : 'log';
  const types = useSessionTypes();
  const home = useHome();
  const session = useSession(params.sessionId);
  const loadingSession = !!params.sessionId && !session.data && !session.error;
  const loading = !types.data || !home.data || loadingSession;

  const initial = useMemo<LogDraft | undefined>(() => {
    if (loading || !types.data) return undefined;
    if (params.restore) {
      const held = heldDraft.take();
      if (held) return held;
    }
    if (session.data) return draftFromSession(session.data, mode);
    const typeId = params.typeId ?? home.data?.lastUsedTypeId ?? [...types.data].sort((a, b) => a.sortOrder - b.sortOrder)[0]?.id;
    let d = blankDraft(mode, typeId);
    const f = parseFocusParam(params.focus);
    if (f) {
      const name = home.data?.suggestions.find((s) => s.ref.refId === f.refId)?.name ?? f.refId;
      d = reducer(d, { type: 'addFocus', kind: f.kind, refId: f.refId, name, actual: true });
    }
    return d;
    // The draft is created once per mount; later store updates must not reset the form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const close = () => router.back();
  const frame = (body: React.ReactNode, saveShown = true) => (
    <View testID="log.sheet" style={[styles.fill, { backgroundColor: c.bgSurface }]}>
      <SheetChrome title={t('log.title.log')} onCancel={close} cancelTestID="log.cancel" titleTestID="log.title" />
      {body}
      {saveShown ? (
        <BottomActionBar>
          <Button variant="primary" fullWidth disabled testID="log.save" label={t('log.save.log')} />
        </BottomActionBar>
      ) : null}
    </View>
  );

  if (session.error) {
    return frame(
      <EmptyState
        style={styles.pad}
        title={t('session.notFound.title')}
        body={t(errorKey(session.error.code))}
        action={<Button variant="ghost" testID="log.notFound.cancel" label={t('common.cancel')} onPress={close} />}
      />,
      false,
    );
  }
  if (!initial) return frame(<LoadingState fill />);

  return <LogForm initial={initial} types={types.data ?? []} home={home.data} fromSession={params.from === 'session'} />;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  pad: { paddingHorizontal: spacing[5] },
});
