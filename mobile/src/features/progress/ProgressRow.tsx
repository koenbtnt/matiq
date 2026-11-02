import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon } from '../../components/Icon';
import { Badge } from '../../components/Tag';
import { Touch } from '../../components/Touch';
import { Txt } from '../../components/Txt';
import type { ProgressResult } from '../../hooks/data';
import { hit } from '../../theme/layout';
import { size, spacing } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';
import { ruleSentence } from './format';

type Props = { result: ProgressResult; params: Record<string, number> };

/** One focus with its state and rule sentence (design §4.2.2); tap opens the why sheet. */
export function ProgressRow({ result, params }: Props) {
  const { t } = useTranslation();
  const { c } = useTheme();
  const { ref } = result;
  const id = `progress.row.${ref.kind}.${ref.refId}`;
  const name = result.removed ? t('common.removed', { name: result.name }) : result.name;
  const state = t(`progress.state.${result.state}`);
  const summary = ruleSentence(t, result, params);
  const subtitle = t('progress.row.subtitle', { state, summary });
  return (
    <Touch
      testID={id}
      accessibilityRole="button"
      accessibilityLabel={t('progress.row.a11y', { name, state, summary, flagged: result.flagged ? t('progress.row.flagged.a11y') : '' }).replace(/\s+/g, ' ')}
      onPress={() => router.push({ pathname: '/progress-why', params: { kind: ref.kind, refId: ref.refId } })}
      style={[styles.row, { borderBottomColor: c.borderDefault }]}
    >
      <View style={styles.text}>
        <Txt variant="rowTitle" numberOfLines={2}>{name}</Txt>
        <Txt testID={`${id}.state`} variant="caption" color="textSecondary" numberOfLines={2}>{subtitle}</Txt>
      </View>
      {result.flagged ? <Badge variant="flagged" label={t('common.badge.flagged')} testID={`${id}.flagged`} /> : null}
      <Icon name="chevron" size={size.iconChevron} color="textSecondary" emphasis />
    </Touch>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: Math.max(size.listRowMinHeight, hit), paddingVertical: spacing[2], flexDirection: 'row', alignItems: 'center', gap: spacing[3],
    flexWrap: 'wrap', borderBottomWidth: size.borderWidth,
  },
  text: { flex: 1, minWidth: 0, gap: spacing[1] },
});
