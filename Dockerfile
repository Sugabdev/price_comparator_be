FROM node:24-bullseye

RUN corepack enable

WORKDIR /app

COPY package*.json pnpm-lock.yaml ./

RUN pnpm install

RUN pnpm add playwright
RUN npx playwright install --with-deps chromium

COPY . .

EXPOSE 4000

CMD ["node", "server.js"]