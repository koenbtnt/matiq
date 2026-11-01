import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { ErrorBanner } from '../../components/ErrorBanner';
import { TextField } from '../../components/TextField';
import { Txt } from '../../components/Txt';
import { useDataActions, type AliasRow } from '../../hooks/data';
import { errorKey } from '../../i18n/keys';
import { chipRowGap } from '../../theme/layout';
import { spacing } from '../../theme/tokens';

type Props = { kind: 'POSITION' | 'TECHNIQUE'; id?: string; aliases: AliasRow[] };

/** Aliases (design §4.5.5, P-18): chips remove at once with an inline undo line; "+ Add alias" reveals a field. */
export function AliasesBlock({ kind, id, aliases }: Props) {
  const { t } = useTranslation();
  const actions = useDataActions();
  const [removed, setRemoved] = useState<AliasRow>();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState<string>();
  const fail = (e: unknown) => setError(t(errorKey((e as { code?: string }).code)));

  return (
    <View style={styles.wrap}>
      <Txt variant="overline" color="textSecondary" accessibilityRole="header">{t('libraryEdit.aliases.label')}</Txt>
      {!id ? (
        <Txt variant="caption" color="textSecondary">{t('libraryEdit.aliases.createHint')}</Txt>
      ) : (
        <>
          {aliases.length === 0 ? (
            <Txt variant="caption" color="textSecondary">{t('libraryEdit.aliases.none')}</Txt>
          ) : (
            <View style={styles.chips}>
              {aliases.map((a) => (
                <Chip
                  key={a.id}
                  testID={`libraryEdit.alias.${a.id}`}
                  variant="selectable"
                  selected
                  label={a.name}
                  accessibilityRole="button"
                  accessibilityLabel={t('libraryEdit.alias.remove.a11y', { name: a.name })}
                  onPress={() => actions.removeAlias(a.id).then(() => setRemoved(a), fail)}
                />
              ))}
            </View>
          )}
          {removed ? (
            <View style={styles.undo}>
              <Txt variant="caption" color="textSecondary">{t('libraryEdit.alias.removed', { name: removed.name })}</Txt>
              <Button
                variant="ghost"
                testID="libraryEdit.alias.undo"
                label={t('common.undo')}
                onPress={() => actions.undoRemoveAlias(removed.id).then(() => setRemoved(undefined), fail)}
              />
            </View>
          ) : null}
          {adding ? (
            <View style={styles.add}>
              <TextField
                label={t('libraryEdit.alias.input.label')}
                placeholder={t('libraryEdit.alias.input.placeholder')}
                testID="libraryEdit.alias.input"
                value={name}
                onChangeText={setName}
                returnKeyType="done"
                autoCapitalize="none"
              />
              {error ? <ErrorBanner testID="libraryEdit.alias.error" message={error} /> : null}
              <View style={styles.start}>
                <Button
                  variant="ghost"
                  testID="libraryEdit.alias.submit"
                  label={t('libraryEdit.alias.submit')}
                  onPress={() => actions.addAlias(kind, id, name).then(() => { setName(''); setError(undefined); }, fail)}
                />
              </View>
            </View>
          ) : (
            <View style={styles.start}>
              <Chip testID="libraryEdit.aliases.add" variant="add" label={t('libraryEdit.aliases.add')} onPress={() => setAdding(true)} />
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing[2] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', columnGap: spacing[2], rowGap: chipRowGap },
  undo: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  add: { gap: spacing[2] },
  start: { alignItems: 'flex-start' },
});
