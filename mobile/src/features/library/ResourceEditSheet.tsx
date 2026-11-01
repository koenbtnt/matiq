import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BottomActionBar } from '../../components/BottomActionBar';
import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { ErrorBanner } from '../../components/ErrorBanner';
import { SegmentedControl } from '../../components/SegmentedControl';
import { SheetChrome } from '../../components/SheetChrome';
import { TextArea } from '../../components/TextArea';
import { TextField } from '../../components/TextField';
import { toast } from '../../components/Toast';
import { Txt } from '../../components/Txt';
import { useDataActions, useResources, useResourceTypes, type ResourceStatus } from '../../hooks/data';
import { hapticSave } from '../../hooks/haptics';
import { errorKey } from '../../i18n/keys';
import { chipRowGap } from '../../theme/layout';
import { spacing } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';

/** `resource-edit` sheet (design §4.7): add or edit a resource of a technique (CO-26: "Author / source"). */
export function ResourceEditSheet() {
  const { t } = useTranslation();
  const { c } = useTheme();
  const actions = useDataActions();
  const { id, techniqueId } = useLocalSearchParams<{ id?: string; techniqueId: string }>();
  const target = { kind: 'TECHNIQUE' as const, id: techniqueId };
  const resources = useResources(target);
  const types = useResourceTypes();
  const existing = id ? resources.data?.find((r) => r.id === id) : undefined;

  const [title, setTitle] = useState(existing?.title ?? '');
  const [url, setUrl] = useState(existing?.url ?? '');
  const [author, setAuthor] = useState(existing?.author ?? '');
  const [typeId, setTypeId] = useState<string | undefined>(existing?.resourceTypeId);
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [status, setStatus] = useState<ResourceStatus>(existing?.status ?? 'TO_WATCH');
  const hydrated = useRef(existing !== undefined);
  useEffect(() => {
    if (hydrated.current || !existing) return;
    hydrated.current = true;
    setTitle(existing.title);
    setUrl(existing.url ?? '');
    setAuthor(existing.author ?? '');
    setTypeId(existing.resourceTypeId);
    setNotes(existing.notes ?? '');
    setStatus(existing.status);
  }, [existing]);
  const firstType = types.data?.[0]?.id;
  const chosenType = typeId ?? firstType;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const editing = !!id;
  const canSave = title.trim() !== '' && !!chosenType;

  const fail = (e: unknown) => setError(t(errorKey((e as { code?: string }).code)));
  const save = async () => {
    if (!chosenType) return;
    setBusy(true);
    setError(undefined);
    const input = { title: title.trim(), url: url.trim(), author: author.trim(), resourceTypeId: chosenType, notes: notes.trim(), status };
    try {
      if (id) {
        await actions.updateResource(id, input);
        hapticSave();
        router.back();
        toast.show({ message: t('toast.changesSaved') });
      } else {
        const row = await actions.createResource(input, target);
        hapticSave();
        router.back();
        toast.show({ message: t('toast.resourceAdded'), undo: () => void actions.deleteResource(row.id) });
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
    try {
      await actions.deleteResource(id);
      hapticSave();
      router.back();
      toast.show({ message: t('toast.resourceDeleted'), undo: () => void actions.undoDeleteResource(id) });
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View testID="resourceEdit.sheet" style={[styles.fill, { backgroundColor: c.bgSurface }]}>
      <SheetChrome
        title={t(editing ? 'resourceEdit.title.edit' : 'resourceEdit.title.create')}
        onCancel={() => router.back()}
        cancelTestID="resourceEdit.cancel"
        titleTestID="resourceEdit.heading"
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
        <TextField label={t('resourceEdit.field.title.label')} placeholder={t('resourceEdit.field.title.placeholder')} testID="resourceEdit.field.title" value={title} onChangeText={setTitle} autoFocus={!editing} />
        <View style={styles.field}>
          <TextField
            label={t('resourceEdit.field.url.label')}
            placeholder={t('resourceEdit.field.url.placeholder')}
            testID="resourceEdit.field.url"
            value={url}
            onChangeText={setUrl}
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Txt variant="caption" color="textSecondary">{t('resourceEdit.field.url.hint')}</Txt>
        </View>
        <TextField label={t('resourceEdit.field.author.label')} placeholder={t('resourceEdit.field.author.placeholder')} testID="resourceEdit.field.author" value={author} onChangeText={setAuthor} />
        <View style={styles.field}>
          <Txt variant="overline" color="textSecondary" accessibilityRole="header">{t('resourceEdit.type.label')}</Txt>
          <View accessibilityRole="radiogroup" style={styles.chips}>
            {(types.data ?? []).map((x) => (
              <Chip key={x.id} testID={`resourceEdit.type.${x.id}`} variant="filter" selected={chosenType === x.id} label={x.name} onPress={() => setTypeId(x.id)} />
            ))}
          </View>
        </View>
        <TextArea label={t('resourceEdit.field.notes.label')} placeholder={t('resourceEdit.field.notes.placeholder')} testID="resourceEdit.field.notes" value={notes} onChangeText={setNotes} />
        <View style={styles.field}>
          <Txt variant="caption" color="textSecondary">{t('resourceEdit.status.label')}</Txt>
          <SegmentedControl<ResourceStatus>
            accessibilityLabel={t('resourceEdit.status.a11y')}
            value={status}
            onChange={setStatus}
            options={[
              { key: 'TO_WATCH', label: t('resourceEdit.status.TO_WATCH'), testID: 'resourceEdit.status.TO_WATCH' },
              { key: 'WATCHED', label: t('resourceEdit.status.WATCHED'), testID: 'resourceEdit.status.WATCHED' },
            ]}
          />
        </View>
        {editing ? <Button variant="destructive" fullWidth testID="resourceEdit.delete" label={t('resourceEdit.delete')} disabled={busy} onPress={() => void remove()} style={styles.delete} /> : null}
      </ScrollView>
      <BottomActionBar absolute={false}>
        {error ? <ErrorBanner testID="resourceEdit.error" message={error} /> : null}
        {!error && !canSave ? <Txt testID="resourceEdit.save.reason" variant="caption" color="textSecondary">{t('resourceEdit.save.disabled')}</Txt> : null}
        <Button variant="primary" fullWidth testID="resourceEdit.save" label={t(editing ? 'resourceEdit.save.edit' : 'resourceEdit.save.create')} disabled={!canSave} busy={busy} onPress={() => void save()} />
      </BottomActionBar>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { paddingHorizontal: spacing[5], paddingTop: spacing[2], paddingBottom: spacing[5], gap: spacing[5] },
  field: { gap: spacing[1] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', columnGap: spacing[2], rowGap: chipRowGap },
  delete: { marginTop: spacing[5] },
});
