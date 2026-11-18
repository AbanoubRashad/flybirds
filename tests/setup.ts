// Environment for tests. Values already set (for example by CI) win.
process.env.AUTH_SECRET ??= "test-secret-at-least-sixteen-chars";
process.env.NEXT_PUBLIC_APP_URL ??= "http://localhost:3000";
process.env.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/flybirds";
// Tests always exercise the sandbox payment path.
delete process.env.STRIPE_SECRET_KEY;
delete process.env.STRIPE_WEBHOOK_SECRET;
