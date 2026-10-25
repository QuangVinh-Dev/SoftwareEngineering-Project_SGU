FROM node:22.22.0-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
ARG VITE_API_BASE_URL=https://api.buivietquangvinh.xyz
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN test "$VITE_API_BASE_URL" = "https://api.buivietquangvinh.xyz" && npm run build

FROM nginx:1.28.2-alpine AS runtime
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=build --chown=nginx:nginx /app/dist/ /usr/share/nginx/html/
USER nginx
EXPOSE 80
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1
ENTRYPOINT ["nginx"]
CMD ["-g", "daemon off;"]
