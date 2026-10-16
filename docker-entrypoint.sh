#!/bin/sh
set -e

: "${API_URL:=http://localhost:8080}"
: "${DEMO_MODE:=false}"

envsubst '${API_URL} ${DEMO_MODE}' \
  < /usr/share/nginx/html/assets/env.template.js \
  > /usr/share/nginx/html/assets/env.js

exec nginx -g 'daemon off;'
