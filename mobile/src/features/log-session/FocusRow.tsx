import { useState, type Dispatch } from 'react';
import { PixelRatio, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Chip } from '../../components/Chip';
import { IconButton } from '../../components/IconButton';
import { ScalePicker } from '../../components/ScalePicker';
import { Stepper } from '../../components/Stepper';
import { TextArea } from '../../components/TextArea';
import { Txt } from '../../components/Txt';
import type { TechniqueRow } from '../../hooks/data';
import { chipRowGap, STACK_FONT_SCALE } from '../../theme/layout';
import { spacing } from '../../theme/tokens';
import { TechniqueAttach } from './TechniqueAttach';
import type { Action, FocusDraft, LogMode } from './state';

type Props = {
  focus: FocusDraft;
  mode: LogMode;
  dispatch: Dispatch<Action>;
  techniquePanelOpen: boolean;
  onToggleTechniquePanel: (open: boolean) => void;
};

/** One focus card (DSR-18): name, status line, trained toggle / remove, body for trained rows. */
export function FocusRow({ focus: f, mode, dispatch, techniquePanelOpen, onToggleTechniquePanel }: Props) {
  const { t } = useTranslation();
  const id = `log.focus.${f.refId}`;
  const hasDetails = !!f.comment || f.hitCount !== undefined || f.caughtCount !== undefined || f.techniques.length > 0;
  const [detailsOpen, setDetailsOpen] = useState(hasDetails);
  const stacked = PixelRatio.getFontScale() >= STACK_FONT_SCALE;

  const status = mode === 'plan' ? t('log.focus.planned')
    : f.planned ? (f.actual ? t('log.focus.planned') : t('log.focus.plannedNotTrained'))
    : t('log.focus.added');
  const name = f.removed ? t('common.removed', { name: f.name }) : f.name;
  const showToggle = mode !== 'plan' && f.planned;
  const showBody = mode !== 'plan' && f.actual;

  const patch = (p: Extract<Action, { type: 'focusPatch' }>['patch']) => dispatch({ type: 'focusPatch', refId: f.refId, patch: p });

  return (
    <Card testID={id} padding={spacing[4]}>
      <View style={styles.header}>
        <View style={styles.flex}>
          <Txt variant="headline" numberOfLines={2}>{name}</Txt>
          <Txt testID={`${id}.status`} variant="caption" color="textSecondary">{status}</Txt>
        </View>
        {showToggle ? (
          <Chip
            variant="selectable"
            testID={`${id}.trained`}
            label={t('log.focus.trained')}
            accessibilityLabel={t('log.focus.trained.a11y', { name: f.name })}
            selected={f.actual}
            onPress={() => dispatch({ type: 'toggleTrained', refId: f.refId })}
          />
        ) : (
          <IconButton testID={`${id}.remove`} icon="close" accessibilityLabel={t('log.focus.remove.a11y', { name: f.name })} onPress={() => dispatch({ type: 'removeFocus', refId: f.refId })} />
        )}
      </View>

      {showBody ? (
        <View style={styles.body}>
          <ScalePicker
            value={f.rating}
            onChange={(v) => patch({ rating: v })}
            label={f.rating ? t('log.focus.rating.value', { value: f.rating }) : t('log.focus.rating.label')}
            groupLabel={t('log.focus.rating.a11yGroup', { name: f.name })}
            optionKind="log.label.rating"
            testIDPrefix={`${id}.rating`}
          />
          <View style={styles.wrapRow}>
            <Chip
              variant="selectable"
              testID={`${id}.needsWork`}
              label={t('log.focus.needsWork')}
              accessibilityLabel={t('log.focus.needsWork.a11y', { name: f.name })}
              selected={f.needsWork}
              onPress={() => patch({ needsWork: !f.needsWork })}
            />
            <Button
              variant="ghost"
              testID={`${id}.details`}
              label={detailsOpen ? t('log.focus.details.hide') : t('log.focus.details.show')}
              onPress={() => setDetailsOpen((o) => !o)}
            />
          </View>
          {detailsOpen ? (
            <View style={styles.body}>
              <TextArea testID={`${id}.comment`} label={t('log.focus.comment.label')} placeholder={t('log.focus.comment.placeholder')} value={f.comment} onChangeText={(v) => patch({ comment: v })} />
              <View style={[styles.grid, stacked ? styles.col : null]}>
                <View style={styles.flex}>
                  <Stepper
                    label={t('log.focus.hit.label')} value={f.hitCount} min={0} max={99} unsetText="0"
                    onChange={(v) => patch({ hitCount: v })}
                    lessLabel={t('log.focus.hit.less.a11y', { name: f.name })} moreLabel={t('log.focus.hit.more.a11y', { name: f.name })}
                    testIDPrefix={`${id}.hit`}
                  />
                </View>
                <View style={styles.flex}>
                  <Stepper
                    label={t('log.focus.caught.label')} value={f.caughtCount} min={0} max={99} unsetText="0"
                    onChange={(v) => patch({ caughtCount: v })}
                    lessLabel={t('log.focus.caught.less.a11y', { name: f.name })} moreLabel={t('log.focus.caught.more.a11y', { name: f.name })}
                    testIDPrefix={`${id}.caught`}
                  />
                </View>
              </View>
              <View style={styles.techniques}>
                <Txt variant="overline" color="textSecondary" accessibilityRole="header">{t('log.focus.techniques.label')}</Txt>
                <View style={styles.wrapRow}>
                  {f.techniques.map((tech) => (
                    <Chip
                      key={tech.id}
                      variant="selectable"
                      selected
                      testID={`${id}.technique.${tech.id}`}
                      label={tech.name}
                      accessibilityLabel={t('log.focus.technique.remove.a11y', { technique: tech.name, name: f.name })}
                      onPress={() => dispatch({ type: 'detachTechnique', refId: f.refId, techniqueId: tech.id })}
                    />
                  ))}
                  <Chip variant="add" testID={`${id}.addTechnique`} label={t('log.focus.techniques.add')} onPress={() => onToggleTechniquePanel(true)} />
                </View>
                {techniquePanelOpen ? (
                  <TechniqueAttach
                    focusRefId={f.refId}
                    onPick={(tr: TechniqueRow) => {
                      dispatch({ type: 'attachTechnique', refId: f.refId, technique: { id: tr.id, name: tr.name } });
                      onToggleTechniquePanel(false);
                    }}
                    onClose={() => onToggleTechniquePanel(false)}
                  />
                ) : null}
              </View>
            </View>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  flex: { flex: 1 },
  body: { gap: spacing[3] },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: spacing[2], rowGap: chipRowGap },
  grid: { flexDirection: 'row', gap: spacing[3] },
  col: { flexDirection: 'column' },
  techniques: { gap: spacing[2] },
});
