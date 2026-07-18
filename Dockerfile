# Step 1: Build Stage
FROM node:22-alpine AS builder
WORKDIR /app

# pnpm অ্যাক্টিভেট করা
ENV CI=true
RUN corepack enable && corepack prepare pnpm@10.20.0 --activate
ENV HUSKY=0


COPY package*.json pnpm-lock.yaml pnpm-workspace.yaml ./

# ফ্রোজেন লকফাইল সহই ইন্সটল হবে, pnpm-workspace.yaml এ approve করা স্ক্রিপ্টগুলো ব্লক হবে না
RUN pnpm install --frozen-lockfile

COPY . .

# prisma generate এবং build করা
RUN npx prisma generate
RUN pnpm run build

# devDependencies ছেঁটে ফেলা
RUN pnpm prune --prod

# Step 2: Run Stage
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# ফাইল ও নোড মডিউলস কপি করা
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./

EXPOSE 5000

CMD ["node", "dist/src/main.js"]