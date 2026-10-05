// Runtime config, generated from this template at container startup
// (see docker-entrypoint.sh) by substituting API_URL. Loaded by
// index.html before the Angular bundle, so it must stay plain JS.
window.__env = {
  apiUrl: "${API_URL}"
};
