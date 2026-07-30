# Runtime image for the Expo SSR web build.
#
# Expects `dist/` to already exist — build it first with:
#   pnpm --filter scaffald-app exec expo export --platform web
# (see scripts/deploy-ssr.sh, which wires the env vars and builds for you).
#
# Keeping the Metro build outside the image avoids shipping the toolchain, the
# git submodules, and the ~2GB of workspace node_modules into production.

FROM node:22-alpine AS deps

WORKDIR /app

# Only the handful of packages the server entry actually requires at runtime.
COPY server/package.json ./package.json
RUN npm install --omit=dev --no-package-lock

FROM node:22-alpine AS runtime

ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app

# Run unprivileged; the node image ships a `node` user for exactly this.
RUN chown node:node /app
USER node

COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node server ./server
COPY --chown=node:node dist ./dist

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server/index.js"]
