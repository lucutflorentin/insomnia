# Prisma Migrations

This project now keeps Prisma migrations in version control.

## Baseline

`prisma/migrations/20260428000000_baseline/migration.sql` is a schema-only baseline generated from `prisma/schema.prisma`.

It does not include seed data and does not manually write to `_prisma_migrations`.

## Existing Live Database

Before using `prisma migrate deploy` against the existing live database, mark the baseline as already applied:

```bash
npx prisma migrate resolve --applied 20260428000000_baseline
```

Then future migrations can be deployed with:

```bash
npx prisma migrate deploy
```

## New Databases

For a fresh database, run:

```bash
npx prisma migrate deploy
npm run db:seed
```

## Rules

- Do not use `prisma db push` for production schema changes.
- Commit every migration directory.
- Keep seed/sample data in `prisma/seed.ts`, not in migration SQL.
