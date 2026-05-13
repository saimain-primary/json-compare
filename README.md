# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## Seed Data

Run all Supabase migrations first, then seed demo data:

```bash
VITE_SUPABASE_URL="https://your-project.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" \
npm run seed
```

Optional seed credentials:

```bash
SEED_USER_ID="existing-auth-user-id" \
SEED_USER_EMAIL="demo@example.com" \
SEED_USER_PASSWORD="DemoPassword123!" \
SEED_USERNAME="demo_user" \
SEED_DISPLAY_NAME="Demo User" \
npm run seed
```

The seeder creates the demo user, profile, collections, compares, versions, and
uploads source/target JSON files into the `json-version-files` storage bucket.

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
