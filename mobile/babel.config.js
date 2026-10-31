module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Drizzle migrations are imported as raw SQL strings (drizzle/migrations.js).
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
