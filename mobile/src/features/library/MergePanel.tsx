import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BottomActionBar } from '../../components/BottomActionBar';
import { Button } from '../../components/Button';
import { ErrorBanner } from '../../components/ErrorBanner';
import { Icon } from '../../components/Icon';
import { ListRow } from '../../components/ListRow';
import { SearchField } from '../../components/SearchField';
import { toast } from '../../components/Toast';
import { Txt } from '../../components/Txt';
import { useDataActions, useLibraryPositions, useSubjects, useTechniqueSearch, type TaxonomyKind } from '../../hooks/data';
import { hapticSave } from '../../hooks/haptics';
import { useDebounced } from '../../hooks/useDebounced';
import { errorKey } from '../../i18n/keys';
import { motion, size, spacing } from '../../theme/tokens';

type Candidate = { id: string; name: string; alias?: string };
type Props = { kind: TaxonomyKind; fromId: string; fromName: string; fromIsSubmission: boolean; onBack: () => void };
type Source = { query: string; fromId: string; fromIsSubmission: boolean; children: (rows: Candidate[] | undefined) => React.ReactElement };

const MAX_RESULTS = 8;

function PositionSource({ query, fromId, children }: Source) {
  const r = useLibraryPositions(query || undefined);
  return children(r.data?.filter((p) => p.id !== fromId).map((p) => ({ id: p.id, name: p.canonicalName, alias: p.matchedAlias })));
}
function TechniqueSource({ query, fromId, fromIsSubmission, children }: Source) {
  const r = useTechniqueSearch(query);
  return children(r.data?.filter((x) => x.id !== fromId && (x.type === 'SUBMISSION') === fromIsSubmission).map((x) => ({ id: x.id, name: x.name, alias: x.matchedAlias })));
}
function SubjectSource({ query, fromId, children }: Source) {
  const r = useSubjects();
  const q = query.toLowerCase();
  return children(r.data?.filter((s) => s.id !== fromId && (!q || s.name.toLowerCase().includes(q))).map((s) => ({ id: s.id, name: s.name })));
}
const SOURCE = { POSITION: PositionSource, TECHNIQUE: TechniqueSource, SUBJECT: SubjectSource } as const;

/** Inline merge panel of the edit sheet (design §4.5.4, P-17): pick the survivor, confirm, Undo in a toast. */
export function MergePanel({ kind, fromId, fromName, fromIsSubmission, onBack }: Props) {
  const { t } = useTranslation();
  const actions = useDataActions();
  const [input, setInput] = useState('');
  const query = useDebounced(input.trim(), motion.durationState.duration);
  const [picked, setPicked] = useState<Candidate>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const Source = SOURCE[kind];

  const confirm = async () => {
    if (!picked) return;
    setBusy(true);
    setError(undefined);
    try {
      const result = await actions.merge(kind, fromId, picked.id);
      hapticSave();
      router.dismissTo('/library');
      toast.show({
        message: t('toast.merged', { name: picked.name }),
        undo: () => {
          actions.undoMerge(result.mergeId).then(
            () => toast.show({ message: t('toast.mergeUndone') }),
            (e: unknown) => toast.show({ message: t(errorKey((e as { code?: string }).code)) }),
          );
        },
      });
    } catch (e) {
      setError(t(errorKey((e as { code?: string }).code)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View testID="libraryEdit.merge.panel" style={styles.fill}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Txt variant="body">{t(`libraryEdit.merge.body.${kind}`, { name: fromName })}</Txt>
        <SearchField
          label={t('libraryEdit.merge.search.label')}
          placeholder={t('libraryEdit.merge.search.placeholder')}
          value={input}
          onChangeText={setInput}
          testID="libraryEdit.merge.search.input"
          clearTestID="libraryEdit.merge.search.clear"
          autoFocus
        />
        <Source query={query} fromId={fromId} fromIsSubmission={fromIsSubmission}>
          {(rows) => (
            <View accessibilityRole="radiogroup">
              {(rows ?? []).slice(0, MAX_RESULTS).map((c) => (
                <ListRow
                  key={c.id}
                  testID={`libraryEdit.merge.result.${c.id}`}
                  title={c.name}
                  subtitle={[c.alias ? t('library.row.alias', { alias: c.alias }) : undefined]}
                  accessibilityRole="radio"
                  checked={picked?.id === c.id}
                  accessibilityLabel={t('libraryEdit.merge.result.a11y', { name: c.name })}
                  trailing={picked?.id === c.id ? <Icon name="check" size={size.iconCheck} emphasis /> : undefined}
                  onPress={() => setPicked(c)}
                />
              ))}
              {rows && rows.length === 0 ? <Txt variant="caption" color="textSecondary">{t('libraryEdit.merge.empty', { query })}</Txt> : null}
            </View>
          )}
        </Source>
        {picked ? (
          <Txt variant="headline" accessibilityLiveRegion="polite">{t('libraryEdit.merge.selected', { from: fromName, into: picked.name })}</Txt>
        ) : null}
        <View style={styles.start}>
          <Button variant="ghost" testID="libraryEdit.merge.back" label={t('libraryEdit.merge.back')} onPress={onBack} />
        </View>
      </ScrollView>
      <BottomActionBar absolute={false}>
        {error ? <ErrorBanner testID="libraryEdit.error" message={error} /> : null}
        {!picked ? <Txt variant="caption" color="textSecondary">{t('libraryEdit.merge.confirm.disabled')}</Txt> : null}
        <Button
          variant="primary"
          fullWidth
          testID="libraryEdit.merge.confirm"
          label={t('libraryEdit.merge.confirm', { name: picked?.name ?? '' }).trim()}
          disabled={!picked}
          busy={busy}
          onPress={() => void confirm()}
        />
      </BottomActionBar>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { paddingHorizontal: spacing[5], paddingTop: spacing[2], paddingBottom: spacing[5], gap: spacing[4] },
  start: { alignItems: 'flex-start' },
});
