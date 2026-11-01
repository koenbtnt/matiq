import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BottomActionBar } from '../../components/BottomActionBar';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { LoadingState } from '../../components/LoadingState';
import { SectionHeader } from '../../components/SectionHeader';
import { Badge, Tag } from '../../components/Tag';
import { Txt } from '../../components/Txt';
import { useSession, type FocusRow, type SessionDetail } from '../../hooks/data';
import { errorKey } from '../../i18n/keys';
import { chipRowGap } from '../../theme/layout';
import { spacing } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';
import { fmt } from '../home/format';

const ORDER = (f: FocusRow) => (f.isPlanned && f.isActual ? 0 : f.isPlanned ? 1 : 2);

export function SessionDetailScreen({ id }: { id: string }) {
  const { t } = useTranslation();
  const { c } = useTheme();
  const { data, error } = useSession(id);

  if (error) {
    return (
      <View testID="session.notFound" style={[styles.fill, { backgroundColor: c.bgBase }]}>
        <EmptyState style={styles.pad} title={t('session.notFound.title')} body={error.code === 'SESSION_NOT_FOUND' ? t('session.notFound.body') : t(errorKey(error.code))} />
      </View>
    );
  }
  if (!data) return <View style={[styles.fill, { backgroundColor: c.bgBase }]}><LoadingState fill /></View>;
  return <Body s={data} />;
}

function Body({ s }: { s: SessionDetail }) {
  const { t } = useTranslation();
  const { c } = useTheme();
  const meta = [
    s.durationMinutes ? t('session.meta.duration', { minutes: s.durationMinutes }) : undefined,
    s.intensity ? t('session.meta.intensity', { value: s.intensity }) : undefined,
    s.energy ? t('session.meta.energy', { value: s.energy }) : undefined,
    s.rating ? t('session.meta.rating', { value: s.rating }) : undefined,
  ].filter(Boolean).join(' · ');
  const focuses = [...s.focuses].sort((a, b) => ORDER(a) - ORDER(b) || a.sortOrder - b.sortOrder);
  const sparring = [
    s.roundsCount ? t('session.sparring.rounds', { count: s.roundsCount }) : undefined,
    s.submissionsLanded ? t('session.sparring.landed', { count: s.submissionsLanded }) : undefined,
    s.submissionsTaken ? t('session.sparring.taken', { count: s.submissionsTaken }) : undefined,
  ].filter(Boolean).join(' · ');
  const names = (d: 'LANDED' | 'TAKEN') => s.submissions.filter((x) => x.direction === d && x.techniqueName).map((x) => x.techniqueName).join(', ');
  const landedWith = names('LANDED');
  const takenBy = names('TAKEN');
  const notes: [string, string | undefined][] = [
    [t('session.notes.whatWorked'), s.whatWorked],
    [t('session.notes.whatFailed'), s.whatFailed],
    [t('session.notes.context'), s.contextNote],
  ];
  const statusOf = (f: FocusRow) =>
    s.status !== 'COMPLETED' ? t('log.focus.planned')
      : f.isPlanned && f.isActual ? t('session.focus.status.plannedTrained')
      : f.isPlanned ? t('session.focus.status.plannedNotTrained')
      : t('session.focus.status.unplannedTrained');

  return (
    <View testID="session.screen" style={[styles.fill, { backgroundColor: c.bgBase }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.block}>
          <Txt variant="overline" color="textSecondary">{`${fmt.dateShort(s.startsAt)} · ${fmt.time(s.startsAt)}`}</Txt>
          <Txt variant="titleL" accessibilityRole="header">{s.sessionTypeName}</Txt>
          {s.status !== 'COMPLETED' ? <Tag label={t(`session.status.${s.status}`)} /> : null}
          {meta ? <Txt variant="caption" color="textSecondary">{meta}</Txt> : null}
        </View>

        <View style={styles.block}>
          <SectionHeader title={t('session.focuses.title')} />
          {focuses.map((f) => (
            <Card key={f.refId} testID={`session.focus.${f.refId}`} padding={spacing[4]}>
              <View style={styles.titleRow}>
                <Txt variant="headline" style={styles.flex}>{f.removed ? t('common.removed', { name: f.name }) : f.name}</Txt>
                {f.needsWork ? <Badge variant="flagged" label={t('common.badge.flagged')} /> : null}
              </View>
              <Txt testID={`session.focus.${f.refId}.status`} variant="caption" color="textSecondary">{statusOf(f)}</Txt>
              {f.rating ? <Txt variant="caption" color="textSecondary">{t('session.focus.rating', { value: f.rating })}</Txt> : null}
              {f.comment ? <Txt variant="body">{f.comment}</Txt> : null}
              {f.hitCount !== undefined || f.caughtCount !== undefined ? (
                <Txt variant="caption" color="textSecondary">{t('session.focus.counts', { hit: f.hitCount ?? 0, caught: f.caughtCount ?? 0 })}</Txt>
              ) : null}
              {f.techniques.length > 0 ? (
                <View style={styles.tags}>{f.techniques.map((x) => <Tag key={x.id} label={x.name} />)}</View>
              ) : null}
            </Card>
          ))}
        </View>

        {sparring || landedWith || takenBy ? (
          <View style={styles.block}>
            <SectionHeader title={t('session.sparring.title')} />
            <Card padding={spacing[4]}>
              {sparring ? <Txt variant="body">{sparring}</Txt> : null}
              {landedWith ? <Txt variant="caption" color="textSecondary">{t('session.sparring.landedWith', { names: landedWith })}</Txt> : null}
              {takenBy ? <Txt variant="caption" color="textSecondary">{t('session.sparring.takenBy', { names: takenBy })}</Txt> : null}
            </Card>
          </View>
        ) : null}

        {notes.filter(([, v]) => !!v).map(([label, v]) => (
          <View key={label} style={styles.note}>
            <Txt variant="overline" color="textSecondary">{label}</Txt>
            <Txt variant="body">{v}</Txt>
          </View>
        ))}
      </ScrollView>

      {s.status === 'SKIPPED' ? null : (
        <BottomActionBar tone="base" absolute={false}>
          {s.status === 'COMPLETED' ? (
            <Button variant="primary" fullWidth testID="session.edit" label={t('session.edit')} onPress={() => router.push({ pathname: '/log-session', params: { mode: 'edit', sessionId: s.id, from: 'session' } })} />
          ) : (
            <Button variant="primary" fullWidth testID="session.logIt" label={t('session.logIt')} onPress={() => router.push({ pathname: '/log-session', params: { mode: 'log', sessionId: s.id, from: 'session' } })} />
          )}
        </BottomActionBar>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  pad: { paddingHorizontal: spacing[5] },
  content: { padding: spacing[5], gap: spacing[4] },
  block: { gap: spacing[3] },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  flex: { flex: 1 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], rowGap: chipRowGap },
  note: { gap: spacing[1] },
});
