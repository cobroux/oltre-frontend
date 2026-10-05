#!/bin/sh
set -e

: "${API_URL:=http://localhost:8080}"

envsubst '${API_URL}' \
  < /usr/share/nginx/html/assets/env.template.js \
  > /usr/share/nginx/html/assets/env.js

exec nginx -g 'daemon off;'
