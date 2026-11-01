import { StyleSheet, View } from 'react-native';

import { vSlop } from '../theme/layout';
import { radius, semantic, size, spacing } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { Touch } from './Touch';
import { Txt } from './Txt';

type Option<K extends string> = { key: K; label: string; testID: string };

type Props<K extends string> = {
  options: Option<K>[];
  value: K;
  onChange: (k: K) => void;
  accessibilityLabel: string;
};

export function SegmentedControl<K extends string>({ options, value, onChange, accessibilityLabel }: Props<K>) {
  const { c } = useTheme();
  return (
    <View accessibilityRole="tablist" accessibilityLabel={accessibilityLabel} style={[styles.track, { backgroundColor: c.bgRaised }]}>
      {options.map((o) => {
        const selected = o.key === value;
        return (
          <Touch
            key={o.key}
            testID={o.testID}
            accessibilityRole="tab"
            accessibilityLabel={o.label}
            accessibilityState={{ selected }}
            hitSlop={vSlop(size.segmentHeight)}
            onPress={() => onChange(o.key)}
            style={[styles.seg, selected ? { backgroundColor: c[semantic.segmentSelected.bg] } : null]}
          >
            <Txt variant="chip" style={{ color: selected ? c[semantic.segmentSelected.text] : c.textSecondary }}>{o.label}</Txt>
          </Touch>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', padding: spacing[1], gap: spacing[1], borderRadius: radius.md },
  seg: { flex: 1, height: size.segmentHeight, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
});
