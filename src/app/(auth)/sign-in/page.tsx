import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";

type Props = { searchParams: Promise<{ callbackUrl?: string; error?: string }> };

export default async function SignInPage({ searchParams }: Props) {
  const { callbackUrl = "/", error } = await searchParams;
  const safeCallback = callbackUrl.startsWith("/") ? callbackUrl : "/";

  async function credentials(formData: FormData) {
    "use server";
    try {
      await signIn("credentials", { email: formData.get("email"), password: formData.get("password"), redirectTo: safeCallback });
    } catch (e) {
      if (e instanceof AuthError) redirect(`/sign-in?error=invalid&callbackUrl=${encodeURIComponent(safeCallback)}`);
      throw e; // re-throw NEXT_REDIRECT
    }
  }

  async function github() {
    "use server";
    await signIn("github", { redirectTo: safeCallback });
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-24">
      <p className="label-mono text-forest-500">Account</p>
      <h1 className="mt-2 text-3xl font-semibold">Sign in</h1>
      {error && <p className="label-mono mt-4 text-signal">Invalid email or password.</p>}
      <form action={credentials} className="mt-8 space-y-3">
        <input name="email" type="email" required placeholder="Email" autoComplete="email" className="h-11 w-full bg-transparent px-3 ring-1 ring-inset ring-slate-900/20 focus:ring-slate-900" />
        <input name="password" type="password" required minLength={8} placeholder="Password" autoComplete="current-password" className="h-11 w-full bg-transparent px-3 ring-1 ring-inset ring-slate-900/20 focus:ring-slate-900" />
        <Button className="w-full" size="lg">Continue</Button>
      </form>
      <form action={github} className="mt-3"><Button variant="secondary" className="w-full" size="lg">Continue with GitHub</Button></form>
      <p className="label-mono mt-6 text-slate-400">Demo admin: admin@flybirds.dev / flybirds-demo</p>
    </div>
  );
}
