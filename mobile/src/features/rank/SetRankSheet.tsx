import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { BeltRank, BeltSwatch } from '../../components/BeltRank';
import { BottomActionBar } from '../../components/BottomActionBar';
import { Button } from '../../components/Button';
import { DateTimeField } from '../../components/DateTimeField';
import { ErrorBanner } from '../../components/ErrorBanner';
import { Icon } from '../../components/Icon';
import { ListRow } from '../../components/ListRow';
import { SheetBody, SheetChrome } from '../../components/SheetChrome';
import { Stepper } from '../../components/Stepper';
import { toast } from '../../components/Toast';
import { Txt } from '../../components/Txt';
import { useCurrentRank, useDataActions, useRankHistory, useSetting, type Belt, type RankEntry, type RankScale } from '../../hooks/data';
import { hapticSave } from '../../hooks/haptics';
import { errorKey } from '../../i18n/keys';
import { size, spacing } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';
import { beltsFor, parseLocalDate, rankTitle, toLocalDate } from './format';

/** Set-rank sheet (D-A17, design §4.4.4): belt rows of the active scale, stripes, awarded-on; edit and delete with `entryId`. */
export function SetRankSheet() {
  const { t } = useTranslation();
  const { c } = useTheme();
  const actions = useDataActions();
  const { entryId } = useLocalSearchParams<{ entryId?: string }>();
  const scale: RankScale = useSetting('rank.scale').data === 'KIDS' ? 'KIDS' : 'ADULT';
  const belts = beltsFor(scale);
  const current = useCurrentRank();
  const history = useRankHistory();
  const editing: RankEntry | undefined = entryId ? history.data?.find((e) => e.id === entryId) : undefined;
  const source = entryId ? editing : current.data ?? undefined;
  const pick = (e: RankEntry | undefined): Belt => (e && belts.includes(e.belt) ? e.belt : belts[0]!);

  const [belt, setBelt] = useState<Belt>(pick(source));
  const [stripes, setStripes] = useState<number>(source?.stripes ?? 0);
  const [awarded, setAwarded] = useState<Date>(source ? parseLocalDate(source.awardedOn) : new Date());
  // The reads are async: prefill once when they land (no entry = keep the defaults).
  const hydrated = useRef(source !== undefined);
  useEffect(() => {
    if (hydrated.current || source === undefined) return;
    hydrated.current = true;
    setBelt(pick(source));
    setStripes(source.stripes);
    setAwarded(parseLocalDate(source.awardedOn));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const maxStripes = belt === 'BLACK' ? 6 : 4;
  const shown = Math.min(stripes, maxStripes);

  const save = async () => {
    setBusy(true);
    setError(undefined);
    const input = { scale, belt, stripes: shown, awardedOn: toLocalDate(awarded) };
    try {
      if (entryId) await actions.updateRank(entryId, input);
      else await actions.addRank(input);
      hapticSave();
      router.back();
      toast.show({ message: t('toast.rankSaved') });
    } catch (e) {
      setError(t(errorKey((e as { code?: string }).code)));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!entryId) return;
    setBusy(true);
    try {
      await actions.deleteRank(entryId);
      router.back();
      toast.show({ message: t('toast.rankDeleted'), undo: () => void actions.undoDeleteRank(entryId) });
    } catch (e) {
      setError(t(errorKey((e as { code?: string }).code)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.fill, { backgroundColor: c.bgSurface }]}>
      <SheetChrome title={t(entryId ? 'rank.sheet.title.edit' : 'rank.sheet.title')} onCancel={() => router.back()} cancelTestID="rank.cancel" titleTestID="rank.title" />
      <SheetBody>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View accessibilityLiveRegion="polite" style={styles.preview}>
          <BeltRank belt={belt} stripes={shown} />
          <Txt variant="titleM">{rankTitle(t, belt, shown)}</Txt>
        </View>

        <View>
          <Txt variant="overline" color="textSecondary" accessibilityRole="header">{t('rank.sheet.belt')}</Txt>
          <View accessibilityRole="radiogroup">
            {belts.map((b) => (
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
          label={t('rank.sheet.stripes')} value={shown} min={0} max={maxStripes} unsetText="0"
          onChange={setStripes}
          lessLabel={t('rank.sheet.stripes.less.a11y')} moreLabel={t('rank.sheet.stripes.more.a11y')} testIDPrefix="rank.stripes"
        />

        <View style={styles.date}>
          <Txt variant="overline" color="textSecondary" accessibilityRole="header">{t('rank.sheet.awardedOn')}</Txt>
          <View style={styles.row}>
            <DateTimeField mode="date" testID="rank.awardedOn" value={awarded} maximumDate={new Date()} onChange={setAwarded} />
          </View>
        </View>

        {entryId ? (
          <Button variant="destructive" fullWidth testID="rank.delete" label={t('rank.sheet.delete')} disabled={busy} onPress={() => void remove()} style={styles.delete} />
        ) : null}
      </ScrollView>
      </SheetBody>
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
  delete: { marginTop: spacing[5] },
});
