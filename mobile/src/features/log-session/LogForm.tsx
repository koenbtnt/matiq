import { useEffect, useReducer, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type ScrollViewInstance } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import i18n from '../../i18n';

import { BottomActionBar } from '../../components/BottomActionBar';
import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { DateTimeField } from '../../components/DateTimeField';
import { ErrorBanner } from '../../components/ErrorBanner';
import { SheetChrome } from '../../components/SheetChrome';
import { toast } from '../../components/Toast';
import { Txt } from '../../components/Txt';
import { hapticSave } from '../../hooks/haptics';
import { errorKey } from '../../i18n/keys';
import {
  useDataActions, type FocusPickerRow, type HomeData, type SessionTypeRow,
} from '../../hooks/data';
import { spacing } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';
import { FocusRow } from './FocusRow';
import { FocusSearch } from './FocusSearch';
import { SessionSection, DeleteButton } from './SessionSection';
import { SparringSection } from './SparringSection';
import { heldDraft } from './heldDraft';
import { canSave, isDirty, reducer, toLogInput, toPlanInput, type LogDraft } from './state';

type Panel = { type: 'technique'; refId: string } | { type: 'submission'; direction: 'LANDED' | 'TAKEN' } | null;

type Props = {
  initial: LogDraft;
  types: SessionTypeRow[];
  home: HomeData | undefined;
  /** The sheet was opened from session/[id]: deleting also pops that screen. */
  fromSession: boolean;
};

const FOCUS_ERRORS = /^(FOCUS_|SESSION_NEEDS_ACTUAL_FOCUS)/;

export function LogForm({ initial, types, home, fromSession }: Props) {
  const { t } = useTranslation();
  const { c } = useTheme();
  const actions = useDataActions();
  const [draft, dispatch] = useReducer(reducer, initial);
  const [panel, setPanel] = useState<Panel>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [barHeight, setBarHeight] = useState(0);
  const scroll = useRef<ScrollViewInstance>(null);
  const focusesY = useRef(0);
  const done = useRef(false);
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const { mode } = draft;
  const isPlan = mode === 'plan';
  const enabled = canSave(draft);

  // D-A9: dismissing a dirty sheet (Cancel, swipe, Android back) toasts a discard with Undo; never blocked.
  useEffect(
    () => () => {
      if (done.current || !isDirty(draftRef.current, initial)) return;
      const held = draftRef.current;
      heldDraft.hold(held);
      toast.show({
        message: i18n.t('toast.draftDiscarded'),
        undo: () =>
          router.push({ pathname: '/log-session', params: { mode: held.mode, ...(held.sessionId ? { sessionId: held.sessionId } : {}), restore: '1' } }),
        onExpire: () => heldDraft.clear(),
      });
    },
    [initial],
  );

  const title = mode === 'edit' ? t('log.title.edit') : isPlan ? (draft.sessionId ? t('log.title.editPlan') : t('log.title.plan')) : t('log.title.log');
  const saveLabel = mode === 'edit' ? t('log.save.edit') : isPlan ? t('log.save.plan') : t('log.save.log');
  const addedRefs = new Set(draft.focuses.map((f) => f.refId));

  const close = () => router.back();

  const onSave = async () => {
    setBusy(true);
    setError(undefined);
    try {
      const created = !draft.sessionId;
      const detail = isPlan ? await actions.planSession(toPlanInput(draft, tz)) : await actions.logSession(toLogInput(draft, tz));
      done.current = true;
      hapticSave();
      close();
      if (created) {
        toast.show({
          message: isPlan ? t('toast.planSaved') : t('toast.sessionSaved'),
          undo: () => void deleteWithUndo(detail.id, isPlan),
        });
      } else {
        toast.show({ message: mode === 'edit' ? t('toast.changesSaved') : t('toast.sessionSaved') });
      }
    } catch (e) {
      const code = (e as { code?: string }).code;
      setError(t(errorKey(code)));
      if (code && FOCUS_ERRORS.test(code)) scroll.current?.scrollTo({ y: focusesY.current, animated: true });
    } finally {
      setBusy(false);
    }
  };

  const deleteWithUndo = async (id: string, plan: boolean) => {
    await actions.softDelete(id);
    toast.show({
      message: plan ? t('toast.planDeleted') : t('toast.sessionDeleted'),
      undo: () => void actions.undoDelete(id),
    });
  };

  const onDelete = async () => {
    if (!draft.sessionId) return;
    done.current = true;
    try {
      await actions.softDelete(draft.sessionId);
    } catch (e) {
      done.current = false;
      setError(t(errorKey((e as { code?: string }).code)));
      return;
    }
    if (fromSession) router.dismissTo('/');
    else close();
    const id = draft.sessionId;
    toast.show({ message: isPlan ? t('toast.planDeleted') : t('toast.sessionDeleted'), undo: () => void actions.undoDelete(id) });
  };

  const addFocus = (row: FocusPickerRow) => dispatch({ type: 'addFocus', kind: row.kind, refId: row.refId, name: row.name, actual: true });

  return (
    <KeyboardAvoidingView testID="log.sheet" style={[styles.fill, { backgroundColor: c.bgSurface }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SheetChrome title={title} onCancel={close} cancelTestID="log.cancel" titleTestID="log.title" />
      <ScrollView
        ref={scroll}
        automaticallyAdjustKeyboardInsets
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingBottom: barHeight + spacing[5] }]}
      >
        <View style={styles.section}>
          <Txt variant="overline" color="textSecondary" accessibilityRole="header">{t('log.type.label')}</Txt>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityRole="radiogroup" accessibilityLabel={t('log.type.a11y')} contentContainerStyle={styles.chips}>
            {types.map((ty) => (
              <Chip key={ty.id} variant="filter" testID={`log.type.${ty.id}`} label={ty.name} selected={draft.sessionTypeId === ty.id} onPress={() => dispatch({ type: 'setType', id: ty.id })} />
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Txt variant="overline" color="textSecondary" accessibilityRole="header">{t('log.when.label')}</Txt>
          <View style={styles.whenRow}>
            <DateTimeField
              mode="date"
              testID="log.when.date"
              value={draft.when}
              onChange={(d) => {
                const w = new Date(draft.when);
                w.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
                dispatch({ type: 'setWhen', when: w });
              }}
            />
            <DateTimeField
              mode="time"
              testID="log.when.time"
              value={draft.when}
              onChange={(d) => {
                const w = new Date(draft.when);
                w.setHours(d.getHours(), d.getMinutes(), 0, 0);
                dispatch({ type: 'setWhen', when: w });
              }}
            />
          </View>
        </View>

        <View style={styles.section} onLayout={(e) => { focusesY.current = e.nativeEvent.layout.y; }}>
          <Txt variant="overline" color="textSecondary" accessibilityRole="header">{t('log.focuses.label')}</Txt>
          {draft.focuses.length > 0 ? (
            <View style={styles.rows}>
              {draft.focuses.map((f) => (
                <FocusRow
                  key={f.refId}
                  focus={f}
                  mode={mode}
                  dispatch={dispatch}
                  techniquePanelOpen={panel?.type === 'technique' && panel.refId === f.refId}
                  onToggleTechniquePanel={(open) => setPanel(open ? { type: 'technique', refId: f.refId } : null)}
                />
              ))}
            </View>
          ) : null}
          <FocusSearch home={home} added={addedRefs} onAdd={addFocus} />
        </View>

        {!isPlan ? <SparringSection draft={draft} dispatch={dispatch} panel={panel} setPanel={setPanel} /> : null}
        {!isPlan ? <SessionSection draft={draft} dispatch={dispatch} onDelete={mode === 'edit' ? onDelete : undefined} /> : null}
        {isPlan && draft.sessionId ? <DeleteButton mode="plan" onPress={onDelete} /> : null}
      </ScrollView>

      <BottomActionBar onHeight={setBarHeight}>
        {error ? (
          <ErrorBanner testID="log.error" message={error} />
        ) : !enabled ? (
          <Txt testID="log.save.reason" variant="caption" color="textSecondary">{isPlan ? t('log.save.disabled.plan') : t('log.save.disabled.log')}</Txt>
        ) : null}
        <Button
          variant="primary"
          fullWidth
          testID="log.save"
          label={saveLabel}
          busy={busy}
          busyLabel={t('log.save.busy.a11y')}
          disabled={!enabled}
          onPress={() => void onSave()}
        />
      </BottomActionBar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { paddingHorizontal: spacing[5], paddingTop: spacing[2], gap: spacing[5] },
  section: { gap: spacing[2] },
  chips: { gap: spacing[2] },
  whenRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  rows: { gap: spacing[3] },
});
