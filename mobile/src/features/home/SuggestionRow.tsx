import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Badge } from '../../components/Tag';
import { ListRow } from '../../components/ListRow';
import type { Suggestion } from '../../hooks/data';
import { fmt } from './format';

export function SuggestionRow({ suggestion, lastDate }: { suggestion: Suggestion; lastDate?: string }) {
  const { t } = useTranslation();
  const source = t(`home.suggestion.source.${suggestion.source}`);
  const why = lastDate ? t('home.suggestion.why', { date: fmt.localDateLong(lastDate) }) : undefined;
  const { kind, refId } = suggestion.ref;
  return (
    <ListRow
      testID={`home.suggestion.${refId}`}
      title={suggestion.name}
      subtitle={[source, why]}
      accessibilityLabel={t('home.suggestion.a11y', { name: suggestion.name, source, why: why ?? '' })}
      trailing={suggestion.source === 'LAST_NEEDS_WORK' ? <Badge variant="flagged" label={t('common.badge.flagged')} /> : undefined}
      chevron
      onPress={() => router.push({ pathname: '/log-session', params: { mode: 'plan', focus: `${kind}:${refId}` } })}
    />
  );
}
