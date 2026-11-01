import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BottomActionBar } from '../../components/BottomActionBar';
import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { EmptyState } from '../../components/EmptyState';
import { ErrorBanner } from '../../components/ErrorBanner';
import { LoadingState } from '../../components/LoadingState';
import { SegmentedControl } from '../../components/SegmentedControl';
import { SheetBody, SheetChrome } from '../../components/SheetChrome';
import { TextArea } from '../../components/TextArea';
import { TextField } from '../../components/TextField';
import { toast } from '../../components/Toast';
import { Txt } from '../../components/Txt';
import {
  usePosition, useSubjects, useTechnique, useDataActions,
  type AliasRow, type AppliesTo, type LiveResult, type Perspective, type TaxonomyKind, type TechniqueType,
} from '../../hooks/data';
import { hapticSave } from '../../hooks/haptics';
import { errorKey } from '../../i18n/keys';
import { chipRowGap } from '../../theme/layout';
import { spacing } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';
import { AliasesBlock } from './AliasesBlock';
import { MergePanel } from './MergePanel';
import { PositionPicker, type PickedPosition } from './PositionPicker';

const TYPES: TechniqueType[] = ['TRANSITION', 'GUARD_PASS', 'SWEEP', 'ESCAPE', 'TAKEDOWN', 'SUBMISSION'];
type PerspectiveChoice = 'ANY' | Perspective;

/** What the form starts from (a blank row in create mode). */
type Initial = {
  name: string;
  description: string;
  notes: string;
  parent?: PickedPosition;
  type?: TechniqueType;
  from?: PickedPosition;
  to?: PickedPosition;
  appliesTo: AppliesTo;
  perspective: PerspectiveChoice;
};
const BLANK: Initial = { name: '', description: '', notes: '', appliesTo: 'BOTH', perspective: 'ANY' };

const ADDED = { POSITION: 'toast.positionAdded', TECHNIQUE: 'toast.techniqueAdded', SUBJECT: 'toast.subjectAdded' } as const;
const DELETED = { POSITION: 'toast.positionDeleted', TECHNIQUE: 'toast.techniqueDeleted', SUBJECT: 'toast.subjectDeleted' } as const;

type FormProps = { kind: TaxonomyKind; id?: string; initial: Initial; aliasRows: AliasRow[] };

function EditForm({ kind, id, initial, aliasRows }: FormProps) {
  const { t } = useTranslation();
  const { c } = useTheme();
  const actions = useDataActions();
  const editing = !!id;
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [notes, setNotes] = useState(initial.notes);
  const [parent, setParent] = useState(initial.parent);
  const [type, setType] = useState(initial.type);
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [appliesTo, setAppliesTo] = useState(initial.appliesTo);
  const [perspective, setPerspective] = useState(initial.perspective);
  const [keepAlias, setKeepAlias] = useState(true);
  const [merging, setMerging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const isTechnique = kind === 'TECHNIQUE';
  const isSubmission = type === 'SUBMISSION';
  const trimmed = name.trim();
  const renamed = editing && kind !== 'SUBJECT' && trimmed !== '' && trimmed !== initial.name;
  const disabledReason = !trimmed
    ? t('libraryEdit.save.disabled.name')
    : isTechnique && (!type || !from)
      ? t('libraryEdit.save.disabled.from')
      : isTechnique && !isSubmission && !to
        ? t('libraryEdit.save.disabled.to')
        : undefined;

  const dismiss = (message: string, undo?: () => void) => {
    hapticSave();
    router.back();
    toast.show({ message, undo });
  };
  const fail = (e: unknown) => setError(t(errorKey((e as { code?: string }).code)));

  const save = async () => {
    setBusy(true);
    setError(undefined);
    try {
      if (kind === 'POSITION') {
        const base = { canonicalName: trimmed, parentId: parent?.id ?? null, description: description.trim(), notes: notes.trim() };
        if (id) {
          await actions.updatePosition(id, { ...base, keepOldNameAsAlias: renamed ? keepAlias : undefined });
          dismiss(t('toast.changesSaved'));
        } else {
          const row = await actions.createPosition(base);
          dismiss(t(ADDED.POSITION), () => void actions.deleteTaxonomy('POSITION', row.id));
        }
      } else if (kind === 'TECHNIQUE') {
        const base = {
          name: trimmed, type: type!, fromPositionId: from!.id, toPositionId: isSubmission ? null : to!.id, appliesTo,
          perspective: perspective === 'ANY' ? null : perspective, description: description.trim(), notes: notes.trim(),
        };
        if (id) {
          await actions.updateTechnique(id, { ...base, keepOldNameAsAlias: renamed ? keepAlias : undefined });
          dismiss(t('toast.changesSaved'));
        } else {
          const row = await actions.createTechnique(base);
          dismiss(t(ADDED.TECHNIQUE), () => void actions.deleteTaxonomy('TECHNIQUE', row.id));
        }
      } else if (id) {
        await actions.updateSubject(id, { name: trimmed, description: description.trim() });
        dismiss(t('toast.changesSaved'));
      } else {
        const row = await actions.createSubject({ name: trimmed, description: description.trim() });
        dismiss(t(ADDED.SUBJECT), () => void actions.deleteTaxonomy('SUBJECT', row.id));
      }
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!id) return;
    setBusy(true);
    setError(undefined);
    try {
      await actions.deleteTaxonomy(kind, id);
      hapticSave();
      router.dismissTo('/library');
      toast.show({ message: t(DELETED[kind]), undo: () => void actions.undoDeleteTaxonomy(kind, id) });
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  const title = merging
    ? t('libraryEdit.merge.title', { name: initial.name })
    : t(`libraryEdit.title.${editing ? 'edit' : 'create'}.${kind}`);

  return (
    <View testID="libraryEdit.sheet" style={[styles.fill, { backgroundColor: c.bgSurface }]}>
      <SheetChrome title={title} onCancel={() => router.back()} cancelTestID="libraryEdit.cancel" titleTestID="libraryEdit.title" />
      {merging && id ? (
        <MergePanel kind={kind} fromId={id} fromName={initial.name} fromIsSubmission={initial.type === 'SUBMISSION'} onBack={() => setMerging(false)} />
      ) : (
        <>
          <SheetBody>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
            <TextField
              label={t('libraryEdit.name.label')}
              placeholder={t(`libraryEdit.name.placeholder.${kind}`)}
              testID="libraryEdit.field.name"
              value={name}
              onChangeText={setName}
              autoFocus={!editing}
              autoCapitalize="sentences"
            />
            {renamed ? (
              <Chip
                testID="libraryEdit.keepAlias"
                variant="selectable"
                selected={keepAlias}
                label={t('libraryEdit.keepAlias', { name: initial.name })}
                accessibilityLabel={t('libraryEdit.keepAlias.a11y', { name: initial.name })}
                onPress={() => setKeepAlias(!keepAlias)}
              />
            ) : null}

            {isTechnique ? (
              <>
                <View style={styles.field}>
                  <Txt variant="overline" color="textSecondary" accessibilityRole="header">{t('libraryEdit.type.label')}</Txt>
                  <View accessibilityRole="radiogroup" style={styles.chips}>
                    {TYPES.map((x) => (
                      <Chip
                        key={x}
                        testID={`libraryEdit.type.${x}`}
                        variant="filter"
                        selected={type === x}
                        label={t(`library.technique.type.${x}`)}
                        onPress={() => {
                          setType(x);
                          if (x === 'SUBMISSION') setTo(undefined);
                        }}
                      />
                    ))}
                  </View>
                </View>
                <PositionPicker field="from" label={t('libraryEdit.from.label')} value={from} onChange={setFrom} />
                {isSubmission ? null : <PositionPicker field="to" label={t('libraryEdit.to.label')} value={to} onChange={setTo} />}
                <View style={styles.field}>
                  <Txt variant="caption" color="textSecondary">{t('libraryEdit.appliesTo.label')}</Txt>
                  <SegmentedControl<AppliesTo>
                    accessibilityLabel={t('libraryEdit.appliesTo.label')}
                    value={appliesTo}
                    onChange={setAppliesTo}
                    options={[
                      { key: 'GI', label: t('libraryEdit.appliesTo.GI'), testID: 'libraryEdit.appliesTo.GI' },
                      { key: 'NOGI', label: t('libraryEdit.appliesTo.NOGI'), testID: 'libraryEdit.appliesTo.NOGI' },
                      { key: 'BOTH', label: t('libraryEdit.appliesTo.BOTH'), testID: 'libraryEdit.appliesTo.BOTH' },
                    ]}
                  />
                </View>
                <View style={styles.field}>
                  <Txt variant="caption" color="textSecondary">{t('libraryEdit.perspective.label')}</Txt>
                  <SegmentedControl<PerspectiveChoice>
                    accessibilityLabel={t('libraryEdit.perspective.label')}
                    value={perspective}
                    onChange={setPerspective}
                    options={[
                      { key: 'ANY', label: t('libraryEdit.perspective.ANY'), testID: 'libraryEdit.perspective.ANY' },
                      { key: 'TOP', label: t('libraryEdit.perspective.TOP'), testID: 'libraryEdit.perspective.TOP' },
                      { key: 'BOTTOM', label: t('libraryEdit.perspective.BOTTOM'), testID: 'libraryEdit.perspective.BOTTOM' },
                    ]}
                  />
                </View>
              </>
            ) : null}

            {kind === 'POSITION' ? <PositionPicker field="parent" label={t('libraryEdit.parent.label')} value={parent} onChange={setParent} excludeId={id} /> : null}

            <TextArea
              label={t('libraryEdit.description.label')}
              placeholder={t('libraryEdit.description.placeholder')}
              testID="libraryEdit.field.description"
              value={description}
              onChangeText={setDescription}
            />
            {kind !== 'SUBJECT' ? (
              <TextArea
                label={t('libraryEdit.notes.label')}
                placeholder={t('libraryEdit.notes.placeholder')}
                testID="libraryEdit.field.notes"
                value={notes}
                onChangeText={setNotes}
              />
            ) : null}

            {kind !== 'SUBJECT' ? <AliasesBlock kind={kind} id={id} aliases={aliasRows} /> : null}

            {editing ? (
              <>
                <Button variant="secondary" fullWidth testID="libraryEdit.merge" label={t(`libraryEdit.merge.open.${kind}`)} onPress={() => setMerging(true)} />
                <Button variant="destructive" fullWidth testID="libraryEdit.delete" label={t(`libraryEdit.delete.${kind}`)} disabled={busy} onPress={() => void remove()} style={styles.delete} />
              </>
            ) : null}
          </ScrollView>
          </SheetBody>
          <BottomActionBar absolute={false}>
            {error ? <ErrorBanner testID="libraryEdit.error" message={error} /> : null}
            {!error && disabledReason ? <Txt testID="libraryEdit.save.reason" variant="caption" color="textSecondary">{disabledReason}</Txt> : null}
            <Button
              variant="primary"
              fullWidth
              testID="libraryEdit.save"
              label={t(editing ? 'libraryEdit.save.edit' : 'libraryEdit.save.create')}
              disabled={!!disabledReason}
              busy={busy}
              onPress={() => void save()}
            />
          </BottomActionBar>
        </>
      )}
    </View>
  );
}

/** Waits for the row, then mounts the form once (its state starts from the loaded row). */
function Loader<T>({ result, map, kind, id }: { result: LiveResult<T>; map: (d: T) => { initial: Initial; aliasRows: AliasRow[] }; kind: TaxonomyKind; id: string }) {
  const { t } = useTranslation();
  const { c } = useTheme();
  if (result.error) {
    return (
      <View style={[styles.fill, { backgroundColor: c.bgSurface }]}>
        <SheetChrome title={t(`libraryEdit.title.edit.${kind}`)} onCancel={() => router.back()} cancelTestID="libraryEdit.cancel" titleTestID="libraryEdit.title" />
        <View style={styles.pad}>
          <EmptyState testID="libraryEdit.notFound" body={t(errorKey(result.error.code))} action={<Button variant="ghost" testID="libraryEdit.notFound.cancel" label={t('common.cancel')} onPress={() => router.back()} />} />
        </View>
      </View>
    );
  }
  if (!result.data) return <View style={[styles.fill, { backgroundColor: c.bgSurface }]}><LoadingState fill /></View>;
  const { initial, aliasRows } = map(result.data);
  return <EditForm key={id} kind={kind} id={id} initial={initial} aliasRows={aliasRows} />;
}

function PositionLoader({ id }: { id: string }) {
  const r = usePosition(id);
  return (
    <Loader result={r} kind="POSITION" id={id} map={(d) => ({
      aliasRows: d.aliasRows,
      initial: { ...BLANK, name: d.canonicalName, description: d.description ?? '', notes: d.notes ?? '', parent: d.parent ? { id: d.parent.id, name: d.parent.canonicalName } : undefined },
    })} />
  );
}
function TechniqueLoader({ id }: { id: string }) {
  const r = useTechnique(id);
  return (
    <Loader result={r} kind="TECHNIQUE" id={id} map={(d) => ({
      aliasRows: d.aliasRows,
      initial: {
        name: d.name, description: d.description ?? '', notes: d.notes ?? '', type: d.type, appliesTo: d.appliesTo, perspective: d.perspective ?? 'ANY',
        from: { id: d.fromPositionId, name: d.fromName }, to: d.toPositionId ? { id: d.toPositionId, name: d.toName ?? '' } : undefined,
      },
    })} />
  );
}
function SubjectLoader({ id }: { id: string }) {
  const r = useSubjects();
  const found = r.data?.find((s) => s.id === id);
  const result: LiveResult<{ name: string; description?: string }> = r.data && !found
    ? { error: { code: 'TAXONOMY_ROW_NOT_FOUND' } as never, reload: r.reload }
    : { ...r, data: found } as LiveResult<{ name: string; description?: string }>;
  return <Loader result={result} kind="SUBJECT" id={id} map={(d) => ({ aliasRows: [], initial: { ...BLANK, name: d.name, description: d.description ?? '' } })} />;
}

/** `library-edit` sheet (design §4.5.3): create / edit / merge / delete for positions, techniques and subjects. */
export function LibraryEditSheet() {
  const { kind, id } = useLocalSearchParams<{ kind: TaxonomyKind; id?: string }>();
  if (!id) return <EditForm kind={kind} initial={BLANK} aliasRows={[]} />;
  if (kind === 'POSITION') return <PositionLoader id={id} />;
  if (kind === 'TECHNIQUE') return <TechniqueLoader id={id} />;
  return <SubjectLoader id={id} />;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  pad: { paddingHorizontal: spacing[5] },
  content: { paddingHorizontal: spacing[5], paddingTop: spacing[2], paddingBottom: spacing[5], gap: spacing[5] },
  field: { gap: spacing[1] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', columnGap: spacing[2], rowGap: chipRowGap },
  delete: { marginTop: spacing[5] },
});
