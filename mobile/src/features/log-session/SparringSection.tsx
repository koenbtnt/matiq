import type { Dispatch } from 'react';
import { PixelRatio, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { Stepper } from '../../components/Stepper';
import { Txt } from '../../components/Txt';
import type { Direction, TechniqueRow } from '../../hooks/data';
import { chipRowGap, STACK_FONT_SCALE } from '../../theme/layout';
import { spacing } from '../../theme/tokens';
import { TechniqueAttach } from './TechniqueAttach';
import { namedCount, submissionsOf, type Action, type LogDraft } from './state';

type Panel = { type: 'technique'; refId: string } | { type: 'submission'; direction: Direction } | null;

type Props = { draft: LogDraft; dispatch: Dispatch<Action>; panel: Panel; setPanel: (p: Panel) => void };

const BLOCKS = [
  { direction: 'LANDED', labelKey: 'log.sparring.landedWith', idKey: 'landedWith', field: 'landed', mismatch: 'log.sparring.mismatch.landed' },
  { direction: 'TAKEN', labelKey: 'log.sparring.takenBy', idKey: 'takenBy', field: 'taken', mismatch: 'log.sparring.mismatch.taken' },
] as const;

export function SparringSection({ draft, dispatch, panel, setPanel }: Props) {
  const { t } = useTranslation();
  const stacked = PixelRatio.getFontScale() >= STACK_FONT_SCALE;
  const setCount = (field: 'rounds' | 'landed' | 'taken') => (value: number) => dispatch({ type: 'setCount', field, value });

  return (
    <View style={styles.section}>
      <Txt variant="overline" color="textSecondary" accessibilityRole="header">{t('log.sparring.label')}</Txt>
      <Stepper
        label={t('log.sparring.rounds')} value={draft.rounds} min={0} max={20} unsetText="0" onChange={setCount('rounds')}
        lessLabel={t('log.sparring.rounds.less.a11y')} moreLabel={t('log.sparring.rounds.more.a11y')} testIDPrefix="log.sparring.rounds"
      />
      <View style={[styles.grid, stacked ? styles.col : null]}>
        <View style={styles.flex}>
          <Stepper
            label={t('log.sparring.landed')} value={draft.landed} min={0} max={20} unsetText="0" onChange={setCount('landed')}
            lessLabel={t('log.sparring.landed.less.a11y')} moreLabel={t('log.sparring.landed.more.a11y')} testIDPrefix="log.sparring.landed"
          />
        </View>
        <View style={styles.flex}>
          <Stepper
            label={t('log.sparring.taken')} value={draft.taken} min={0} max={20} unsetText="0" onChange={setCount('taken')}
            lessLabel={t('log.sparring.taken.less.a11y')} moreLabel={t('log.sparring.taken.more.a11y')} testIDPrefix="log.sparring.taken"
          />
        </View>
      </View>

      {BLOCKS.map((b) => {
        const named = submissionsOf(draft, b.direction);
        const count = namedCount(draft, b.direction);
        const stepper = draft[b.field] ?? 0;
        const open = panel?.type === 'submission' && panel.direction === b.direction;
        return (
          <View key={b.direction} style={styles.block}>
            <Txt variant="caption" color="textSecondary">{t(b.labelKey)}</Txt>
            <View style={styles.wrapRow}>
              {named.map((s, i) => (
                <Chip
                  key={`${s.techniqueId}-${i}`}
                  variant="selectable"
                  selected
                  testID={`log.sparring.${b.idKey}.${i}`}
                  label={s.name}
                  accessibilityLabel={t('log.sparring.submission.remove.a11y', { name: s.name })}
                  onPress={() => dispatch({ type: 'removeSubmission', direction: b.direction, index: i })}
                />
              ))}
              <Chip variant="add" testID={`log.sparring.${b.idKey}.add`} label={t('log.sparring.addSubmission')} onPress={() => setPanel({ type: 'submission', direction: b.direction })} />
            </View>
            {open ? (
              <TechniqueAttach
                type="SUBMISSION"
                onPick={(tr: TechniqueRow) => {
                  dispatch({ type: 'addSubmission', submission: { direction: b.direction, techniqueId: tr.id, name: tr.name } });
                  setPanel(null);
                }}
                onClose={() => setPanel(null)}
              />
            ) : null}
            {count > stepper ? (
              <View style={styles.wrapRow}>
                <Txt variant="caption" color="textSecondary">{t(b.mismatch, { count })}</Txt>
                <Button variant="ghost" testID={`log.sparring.useCount.${b.field}`} label={t('log.sparring.useCount', { count })} onPress={() => dispatch({ type: 'setCount', field: b.field, value: count })} />
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing[3] },
  grid: { flexDirection: 'row', gap: spacing[3] },
  col: { flexDirection: 'column' },
  flex: { flex: 1 },
  block: { gap: spacing[2] },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: spacing[2], rowGap: chipRowGap },
});
