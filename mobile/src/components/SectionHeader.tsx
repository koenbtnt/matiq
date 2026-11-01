import { StyleSheet, View } from 'react-native';

import { hit } from '../theme/layout';
import { Txt } from './Txt';

export function SectionHeader({ title, testID }: { title: string; testID?: string }) {
  return (
    <View style={styles.row}>
      <Txt testID={testID} variant="titleM" accessibilityRole="header">{title}</Txt>
    </View>
  );
}

const styles = StyleSheet.create({ row: { minHeight: hit, justifyContent: 'center' } });
