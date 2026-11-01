import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { LoadingState } from '../../components/LoadingState';
import { Touch } from '../../components/Touch';
import { Txt } from '../../components/Txt';
import { useAbout, type AboutData } from '../../hooks/data';
import { errorKey } from '../../i18n/keys';
import { hit } from '../../theme/layout';
import { spacing } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';

type Source = AboutData['attribution']['sources'][number];
type Optional = { url?: string; licenceUrl?: string; credit?: string; changes?: string; snapshot?: string; commit?: string; use?: string };

/** P-27: the testID slug is the kebab-case of the source name. */
export const sourceSlug = (name: string): string => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

function Link({ label, a11y, url, testID }: { label: string; a11y: string; url: string; testID: string }) {
  return (
    <Touch testID={testID} accessibilityRole="link" accessibilityLabel={a11y} onPress={() => void Linking.openURL(url)} style={styles.link}>
      <Txt variant="chip" color="accentText">{label}</Txt>
    </Touch>
  );
}

function SourceBlock({ source }: { source: Source }) {
  const { t } = useTranslation();
  const s = source as Source & Optional;
  const slug = sourceSlug(s.name);
  const version = s.snapshot ?? s.commit?.slice(0, 7);
  return (
    <View testID={`about.attribution.${slug}`} style={styles.source}>
      <Txt variant="headline">{s.name}</Txt>
      {s.use ? <Txt variant="caption" color="textSecondary">{t('about.attribution.use', { use: s.use })}</Txt> : null}
      <Txt variant="caption" color="textSecondary">{t('about.attribution.licence', { licence: s.licence })}</Txt>
      {s.credit ? <Txt variant="body">{s.credit}</Txt> : null}
      {s.changes ? <Txt variant="caption" color="textSecondary">{t('about.attribution.changes', { changes: s.changes })}</Txt> : null}
      {version ? <Txt variant="caption" color="textSecondary">{t('about.attribution.version', { version })}</Txt> : null}
      <View style={styles.links}>
        {s.url ? <Link testID={`about.attribution.${slug}.link`} url={s.url} label={t('about.attribution.source')} a11y={t('about.attribution.source.a11y', { name: s.name })} /> : null}
        {s.licenceUrl ? (
          <Link testID={`about.attribution.${slug}.licence`} url={s.licenceUrl} label={t('about.attribution.licenceLink')} a11y={t('about.attribution.licenceLink.a11y', { licence: s.licence })} />
        ) : null}
      </View>
    </View>
  );
}

/** About (design §4.4.5): versions, backup status and the data-source attributions from `attribution.json`. */
export function AboutScreen() {
  const { t } = useTranslation();
  const { c } = useTheme();
  const about = useAbout();
  if (about.error) {
    return (
      <View testID="about.screen" style={[styles.fill, { backgroundColor: c.bgBase }]}>
        <EmptyState tone="card" style={styles.pad} title={t('progress.error')} body={t(errorKey(about.error.code))}
          action={<Button variant="secondary" label={t('common.tryAgain')} onPress={about.reload} />} />
      </View>
    );
  }
  const d = about.data;
  if (!d) return <View style={[styles.fill, { backgroundColor: c.bgBase }]}><LoadingState fill /></View>;
  return (
    <ScrollView testID="about.screen" style={{ backgroundColor: c.bgBase }} contentContainerStyle={styles.content}>
      <View style={styles.app}>
        <Txt variant="titleM">{t('about.appName')}</Txt>
        <Txt testID="about.version" variant="caption" color="textSecondary">{t('about.version', { version: d.appVersion })}</Txt>
        <Txt variant="caption" color="textSecondary">{t('about.algorithm', { version: d.algorithmVersion })}</Txt>
        <Txt variant="caption" color="textSecondary">{t('about.taxonomy', { release: d.taxonomyRelease })}</Txt>
      </View>
      <View style={styles.app}>
        <Txt variant="overline" color="textSecondary" accessibilityRole="header">{t('about.backup.title')}</Txt>
        <Txt testID="about.backup.status" variant="body">{t(`about.backup.status.${d.backup}`)}</Txt>
      </View>
      <View style={styles.sources}>
        <Txt variant="overline" color="textSecondary" accessibilityRole="header">{t('about.attribution.title')}</Txt>
        {d.attribution.sources.map((s) => <SourceBlock key={s.name} source={s} />)}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  pad: { margin: spacing[5] },
  content: { padding: spacing[5], gap: spacing[5], paddingBottom: spacing[8] },
  app: { gap: spacing[1] },
  sources: { gap: spacing[4] },
  source: { gap: spacing[1] },
  links: { flexDirection: 'row', flexWrap: 'wrap', columnGap: spacing[4] },
  link: { minHeight: hit, paddingHorizontal: spacing[2], justifyContent: 'center' },
});
