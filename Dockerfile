FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx ng build

FROM nginx:alpine
COPY --from=build /app/dist/oltre-frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh /docker-entrypoint.sh
# Strip any \r regardless of how the file's line endings looked on the
# host (e.g. a Windows checkout with core.autocrlf=true can still hand
# Docker a CRLF file even with .gitattributes in place) - a CRLF
# shebang breaks at container startup with "no such file or directory"
# since the kernel looks for an interpreter literally named
# "/bin/sh\r".
RUN sed -i 's/\r$//' /docker-entrypoint.sh && chmod +x /docker-entrypoint.sh
EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
