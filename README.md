# Popup Crafter

Ứng dụng tạo popup cào quà bằng React, TypeScript và Supabase. Xem [DEPLOYMENT.md](DEPLOYMENT.md) để cấu hình tài khoản, database, ảnh và mã nhúng cloud.

## Requirements

- Node.js 20+ (Node 22/24 recommended)
- npm

## Getting started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

## Available scripts

- `npm run dev` - start Vite in development mode
- `npm run build` - create a production build
- `npm run build:dev` - create a development-mode build
- `npm run preview` - preview the production build locally
- `npm run lint` - run ESLint checks
- `npm run test` - run Vitest tests once
- `npm run test:watch` - run Vitest in watch mode

## Verification commands

Use these to verify repository health:

```bash
npm run lint
npm run test
npm run build
npx tsc --noEmit
```

## Lockfile policy

Keep package-lock.json with deployment source so installs are reproducible.
