import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Stepper } from '../../components/Stepper';
import { SwitchRow } from '../../components/SwitchRow';
import { Txt } from '../../components/Txt';
import { useSetting } from '../../hooks/data';
import { spacing } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';
import { useWriteSetting } from './useWriteSetting';

/** Suggestion sources (design §4.4.3): one switch per source and the maximum shown (R-09, R-21). */
export function SuggestionsScreen() {
  const { t } = useTranslation();
  const { c } = useTheme();
  const write = useWriteSetting();
  const lastNeedsWork = useSetting('suggest.lastNeedsWork').data;
  const needsWork = useSetting('suggest.needsWork').data;
  const notTrainedLately = useSetting('suggest.notTrainedLately').data;
  const cycle = useSetting('suggest.cycle').data;
  const max = useSetting('suggest.max').data;
  return (
    <ScrollView testID="suggestions.screen" style={{ backgroundColor: c.bgBase }} contentContainerStyle={styles.content}>
      <Txt variant="caption" color="textSecondary">{t('suggestions.intro')}</Txt>
      <SwitchRow testID="suggestions.lastNeedsWork" label={t('suggestions.lastNeedsWork')} hint={t('suggestions.lastNeedsWork.hint')}
        value={lastNeedsWork === true} onValueChange={(v) => write('suggest.lastNeedsWork', v)} />
      <SwitchRow testID="suggestions.needsWork" label={t('suggestions.needsWork')} hint={t('suggestions.needsWork.hint')}
        value={needsWork === true} onValueChange={(v) => write('suggest.needsWork', v)} />
      <SwitchRow testID="suggestions.notTrainedLately" label={t('suggestions.notTrainedLately')} hint={t('suggestions.notTrainedLately.hint')}
        value={notTrainedLately === true} onValueChange={(v) => write('suggest.notTrainedLately', v)} />
      <SwitchRow testID="suggestions.cycle" label={t('suggestions.cycle')} hint={t('suggestions.cycle.hint')}
        value={cycle === true} onValueChange={(v) => write('suggest.cycle', v)} />
      <View style={styles.max}>
        <Txt variant="caption" color="textSecondary">{t('suggestions.max.label')}</Txt>
        <Stepper
          value={typeof max === 'number' ? max : undefined}
          onChange={(v) => write('suggest.max', v)}
          min={0}
          max={10}
          unsetText="0"
          lessLabel={t('suggestions.max.less.a11y')}
          moreLabel={t('suggestions.max.more.a11y')}
          accessibilityLabel={t('suggestions.max.label')}
          testIDPrefix="suggestions.max"
        />
        <Txt variant="caption" color="textSecondary">{t('suggestions.max.hint')}</Txt>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing[5], gap: spacing[3], paddingBottom: spacing[8] },
  max: { gap: spacing[1], marginTop: spacing[2] },
});
