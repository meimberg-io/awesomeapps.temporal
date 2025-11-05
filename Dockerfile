FROM node:18-slim

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

RUN npm prune --omit=dev

USER node

CMD ["node", "dist/src/worker.js"]

