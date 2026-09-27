// app.json holds the config. This only adds what differs for the iPhone
// home-screen app: the web export is served from bhumiestates.in/app, so
// its router needs that base URL. The Android and iOS bundles (EAS builds
// and updates) must not get it, or their paths would carry /app too.
// scripts/build-pwa.js sets BHUMI_WEB_EXPORT for the web export.
module.exports = ({ config }) =>
  process.env.BHUMI_WEB_EXPORT
    ? { ...config, experiments: { ...config.experiments, baseUrl: '/app' } }
    : config
