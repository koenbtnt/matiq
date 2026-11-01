import { StyleSheet } from 'react-native';

import { vSlop } from '../theme/layout';
import { size } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { Icon, type IconName } from './Icon';
import { Touch } from './Touch';

type Props = {
  icon: IconName;
  accessibilityLabel: string;
  onPress: () => void;
  testID?: string;
  /** No fill or border (search clear). */
  bare?: boolean;
  glyphSize?: number;
};

export function IconButton({ icon, accessibilityLabel, onPress, testID, bare = false, glyphSize = size.iconButtonGlyph }: Props) {
  const { c } = useTheme();
  return (
    <Touch
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={vSlop(size.iconButton)}
      style={[
        styles.base,
        bare ? null : { backgroundColor: c.bgRaised, borderWidth: size.borderWidth, borderColor: c.borderDefault },
      ]}
    >
      <Icon name={icon} size={glyphSize} color="textPrimary" />
    </Touch>
  );
}

const styles = StyleSheet.create({
  base: { width: size.iconButton, height: size.iconButton, borderRadius: size.iconButton / 2, alignItems: 'center', justifyContent: 'center' },
});
