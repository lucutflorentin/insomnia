# Prelive Checklist

Use this before updating the live site.

1. Run static/security/build checks:

```bash
npm run prelive
```

2. Start the production server locally:

```bash
npm start -- -p 3010
```

3. In another terminal, run smoke checks:

```bash
npm run smoke
```

4. Review `git status --short` and confirm only intended files are included.

5. For existing live DBs, make sure the Prisma baseline has been resolved once:

```bash
npx prisma migrate resolve --applied 20260428000000_baseline
```

6. Replace temporary placeholder artist and gallery images before treating the release as premium-ready.

7. Optional — Lighthouse (after `npm run build`): start `npm run start -- -p 3010`, then `npm run perf:lighthouse`. HTML reports go under `reports/lighthouse/`. Use `LIGHTHOUSE_MIN_PERFORMANCE=0.85` to fail the script if performance drops.
