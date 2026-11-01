import type { Dispatch } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '../../components/Button';
import { ScalePicker } from '../../components/ScalePicker';
import { Stepper } from '../../components/Stepper';
import { TextArea } from '../../components/TextArea';
import { Txt } from '../../components/Txt';
import { spacing } from '../../theme/tokens';
import type { Action, LogDraft } from './state';

type Props = { draft: LogDraft; dispatch: Dispatch<Action>; onDelete?: () => void };

/** Duration · rating · intensity · energy · notes (+ Delete in edit). */
export function SessionSection({ draft, dispatch, onDelete }: Props) {
  const { t } = useTranslation();
  const scale = (field: 'rating' | 'intensity' | 'energy') => (value: number | undefined) => dispatch({ type: 'setScale', field, value });
  const text = (field: 'contextNote' | 'whatWorked' | 'whatFailed') => (value: string) => dispatch({ type: 'setText', field, value });
  const level = draft.intensity ? t(`log.session.intensityLevel.${draft.intensity as 1 | 2 | 3 | 4 | 5}`) : undefined;

  return (
    <View style={styles.section}>
      <Txt variant="overline" color="textSecondary" accessibilityRole="header">{t('log.session.label')}</Txt>
      <Stepper
        label={t('log.session.duration')} value={draft.durationMinutes} min={15} max={240} step={15} firstValue={60}
        unsetText={t('log.notSet.short')} unit={t('common.minutes')}
        onChange={(v) => dispatch({ type: 'setCount', field: 'durationMinutes', value: v })}
        lessLabel={t('log.session.duration.less.a11y')} moreLabel={t('log.session.duration.more.a11y')} testIDPrefix="log.session.duration"
      />
      <ScalePicker
        value={draft.rating} onChange={scale('rating')} optionKind="log.label.rating" testIDPrefix="log.session.rating"
        label={draft.rating ? t('log.session.rating.value', { value: draft.rating }) : t('log.session.rating')}
        groupLabel={t('log.session.rating')}
      />
      <ScalePicker
        value={draft.intensity} onChange={scale('intensity')} optionKind="log.label.intensity" testIDPrefix="log.session.intensity"
        label={level ? t('log.session.intensity.value', { level }) : t('log.session.intensity')}
        groupLabel={t('log.session.intensity')}
      />
      <ScalePicker
        value={draft.energy} onChange={scale('energy')} optionKind="log.label.energy" testIDPrefix="log.session.energy"
        label={draft.energy ? t('log.session.energy.value', { value: draft.energy }) : t('log.session.energy')}
        groupLabel={t('log.session.energy')}
      />
      <TextArea testID="log.session.whatWorked" label={t('log.session.whatWorked.label')} placeholder={t('log.session.whatWorked.placeholder')} value={draft.whatWorked} onChangeText={text('whatWorked')} />
      <TextArea testID="log.session.whatFailed" label={t('log.session.whatFailed.label')} placeholder={t('log.session.whatFailed.placeholder')} value={draft.whatFailed} onChangeText={text('whatFailed')} />
      <TextArea testID="log.session.context" label={t('log.session.context.label')} placeholder={t('log.session.context.placeholder')} value={draft.contextNote} onChangeText={text('contextNote')} />
      {onDelete ? <DeleteButton mode={draft.mode} onPress={onDelete} /> : null}
    </View>
  );
}

export function DeleteButton({ mode, onPress }: { mode: LogDraft['mode']; onPress: () => void }) {
  const { t } = useTranslation();
  return (
    <Button
      variant="destructive"
      fullWidth
      testID="log.delete"
      label={mode === 'plan' ? t('log.delete.plan') : t('log.delete.session')}
      onPress={onPress}
      style={styles.delete}
    />
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing[4] },
  delete: { marginTop: spacing[5] },
});
