import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { BeltRank, BeltSwatch } from '../../components/BeltRank';
import { BottomActionBar } from '../../components/BottomActionBar';
import { Button } from '../../components/Button';
import { DateTimeField } from '../../components/DateTimeField';
import { ErrorBanner } from '../../components/ErrorBanner';
import { Icon } from '../../components/Icon';
import { ListRow } from '../../components/ListRow';
import { SheetChrome } from '../../components/SheetChrome';
import { Stepper } from '../../components/Stepper';
import { toast } from '../../components/Toast';
import { Txt } from '../../components/Txt';
import { useCurrentRank, useDataActions, type AdultBelt } from '../../hooks/data';
import { hapticSave } from '../../hooks/haptics';
import { errorKey } from '../../i18n/keys';
import { size, spacing } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';
import { BELTS, adultBelt, parseLocalDate, rankTitle, toLocalDate } from './format';

/** Set-rank sheet (D-A17): belt rows, stripes stepper, awarded-on date. */
export function SetRankSheet() {
  const { t } = useTranslation();
  const { c } = useTheme();
  const actions = useDataActions();
  const current = useCurrentRank();
  const [belt, setBelt] = useState<AdultBelt>(current.data ? adultBelt(current.data.belt) : 'WHITE');
  const [stripes, setStripes] = useState<number>(current.data?.stripes ?? 0);
  const [awarded, setAwarded] = useState<Date>(current.data ? parseLocalDate(current.data.awardedOn) : new Date());
  // The rank read is async: prefill once when it lands (null = no rank yet, keep the defaults).
  const hydrated = useRef(current.data !== undefined);
  useEffect(() => {
    if (hydrated.current || current.data === undefined) return;
    hydrated.current = true;
    if (current.data) {
      setBelt(adultBelt(current.data.belt));
      setStripes(current.data.stripes);
      setAwarded(parseLocalDate(current.data.awardedOn));
    }
  }, [current.data]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const maxStripes = belt === 'BLACK' ? 6 : 4;

  const save = async () => {
    setBusy(true);
    setError(undefined);
    try {
      await actions.addRank({ scale: 'ADULT', belt, stripes: Math.min(stripes, maxStripes), awardedOn: toLocalDate(awarded) });
      hapticSave();
      router.back();
      toast.show({ message: t('toast.rankSaved') });
    } catch (e) {
      setError(t(errorKey((e as { code?: string }).code)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.fill, { backgroundColor: c.bgSurface }]}>
      <SheetChrome title={t('rank.sheet.title')} onCancel={() => router.back()} cancelTestID="rank.cancel" titleTestID="rank.title" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View accessibilityLiveRegion="polite" style={styles.preview}>
          <BeltRank belt={belt} stripes={Math.min(stripes, maxStripes)} />
          <Txt variant="titleM">{rankTitle(t, belt, Math.min(stripes, maxStripes))}</Txt>
        </View>

        <View>
          <Txt variant="overline" color="textSecondary" accessibilityRole="header">{t('rank.sheet.belt')}</Txt>
          <View accessibilityRole="radiogroup">
            {BELTS.map((b) => (
              <ListRow
                key={b}
                testID={`rank.belt.${b}`}
                title={t('rank.beltName', { belt: t(`rank.belt.${b}`) })}
                accessibilityRole="radio"
                checked={belt === b}
                leading={<BeltSwatch belt={b} />}
                trailing={belt === b ? <Icon name="check" size={size.iconCheck} emphasis /> : undefined}
                onPress={() => setBelt(b)}
                style={styles.beltRow}
              />
            ))}
          </View>
        </View>

        <Stepper
          label={t('rank.sheet.stripes')} value={Math.min(stripes, maxStripes)} min={0} max={maxStripes} unsetText="0"
          onChange={setStripes}
          lessLabel={t('rank.sheet.stripes.less.a11y')} moreLabel={t('rank.sheet.stripes.more.a11y')} testIDPrefix="rank.stripes"
        />

        <View style={styles.date}>
          <Txt variant="overline" color="textSecondary" accessibilityRole="header">{t('rank.sheet.awardedOn')}</Txt>
          <View style={styles.row}>
            <DateTimeField mode="date" testID="rank.awardedOn" value={awarded} maximumDate={new Date()} onChange={setAwarded} />
          </View>
        </View>
      </ScrollView>
      <BottomActionBar absolute={false}>
        {error ? <ErrorBanner testID="rank.error" message={error} /> : null}
        <Button variant="primary" fullWidth testID="rank.save" label={t('rank.sheet.save')} busy={busy} onPress={() => void save()} />
      </BottomActionBar>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { paddingHorizontal: spacing[5], paddingTop: spacing[2], paddingBottom: spacing[5], gap: spacing[5] },
  preview: { gap: spacing[3] },
  beltRow: { gap: spacing[3] },
  date: { gap: spacing[2] },
  row: { flexDirection: 'row' },
});
