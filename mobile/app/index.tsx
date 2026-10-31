import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';

import { countAppMeta } from '../src/repositories/appMeta';

export default function Index() {
  const { t } = useTranslation();
  const scheme = useColorScheme();
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    let active = true;
    countAppMeta()
      .then(() => {
        if (active) setDbReady(true);
      })
      .catch((err: unknown) => {
        console.error('app_meta health check failed', err);
      });
    return () => {
      active = false;
    };
  }, []);

  // No colour tokens yet (src/theme/tokens.ts is generated); rely on platform defaults.
  const textStyle = scheme === 'dark' ? styles.textDark : undefined;

  return (
    <View style={styles.container}>
      <Text testID="home.title" style={[styles.title, textStyle]}>
        {t('home.title')}
      </Text>
      <Text testID="home.subtitle" style={textStyle}>
        {t('home.subtitle')}
      </Text>
      {dbReady ? (
        <Text testID="db.ready" style={textStyle}>
          {t('db.ready')}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
  },
  textDark: {
    color: 'white',
  },
});
