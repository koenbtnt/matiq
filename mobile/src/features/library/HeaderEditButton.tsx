import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Touch } from '../../components/Touch';
import { Txt } from '../../components/Txt';
import { hit } from '../../theme/layout';
import { spacing } from '../../theme/tokens';

type Props = { testID: string; accessibilityLabel: string; onPress: () => void };

/** Native `headerRight` text button (design §4.5.2): `button` style in `accentText`, min `hit` × `hit`. */
export function HeaderEditButton({ testID, accessibilityLabel, onPress }: Props) {
  const { t } = useTranslation();
  return (
    <Touch testID={testID} accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress} style={styles.btn}>
      <Txt variant="button" color="accentText">{t('common.edit')}</Txt>
    </Touch>
  );
}

const styles = StyleSheet.create({ btn: { minHeight: hit, minWidth: hit, paddingHorizontal: spacing[2], alignItems: 'center', justifyContent: 'center' } });
