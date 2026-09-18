import type { Metadata } from "next";
import { Photo } from "@/components/ui/photo";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { PHOTOS, photoBlur, photoSrc } from "@/lib/images";

type Props = { searchParams: Promise<{ callbackUrl?: string; error?: string }> };

export const metadata: Metadata = { title: "Sign in" };

const field = "h-12 w-full rounded-full bg-bone px-5 ring-1 ring-inset ring-line-strong placeholder:text-muted transition-shadow focus:outline-none focus:ring-2 focus:ring-forest";

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
    <div className="container-page py-10 md:py-16">
      <div className="grid overflow-hidden rounded-[28px] bg-sand/60 lg:grid-cols-2">
        <div className="on-dark relative hidden min-h-[640px] lg:block">
          <Photo src={photoSrc("trail", 1400)} alt={PHOTOS.trail.alt} fill sizes="50vw" placeholder="blur" blurDataURL={photoBlur("trail")} className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate/80 via-slate/10 to-transparent" aria-hidden />
          <p className="display absolute bottom-10 left-10 right-10 text-[52px] text-bone">Welcome back to <em className="text-sage">the trail.</em></p>
        </div>

        <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
          <div className="mx-auto w-full max-w-sm">
            <p className="label-mono text-forest">Account</p>
            <h1 className="display mt-4 text-[56px]">Sign in</h1>
            <p className="mt-2 text-muted">Track orders, save sizes and manage your wear tests.</p>

            {error && (
              <p role="alert" className="mt-6 flex items-center gap-3 rounded-[14px] bg-slate px-4 py-3 text-sm text-bone">
                <span className="size-2 shrink-0 rounded-full bg-ember" aria-hidden />Invalid email or password.
              </p>
            )}

            <form action={credentials} className="mt-8 space-y-4">
              <div>
                <label htmlFor="email" className="label-mono mb-2 block">Email</label>
                <input id="email" name="email" type="email" required placeholder="you@example.com" autoComplete="email" className={field} />
              </div>
              <div>
                <label htmlFor="password" className="label-mono mb-2 block">Password</label>
                <input id="password" name="password" type="password" required minLength={8} placeholder="At least 8 characters" autoComplete="current-password" className={field} />
              </div>
              <Button className="w-full" size="lg">Continue</Button>
            </form>

            <div className="my-6 flex items-center gap-4" aria-hidden>
              <span className="h-px flex-1 bg-line-strong" /><span className="label-mono text-muted">or</span><span className="h-px flex-1 bg-line-strong" />
            </div>

            <form action={github}>
              <Button variant="outline" className="w-full" size="lg">
                <svg viewBox="0 0 24 24" className="size-5 fill-current" aria-hidden><path d="M12 .5a11.5 11.5 0 0 0-3.64 22.4c.58.11.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.28 1.19-3.08-.12-.29-.52-1.46.11-3.04 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.23 2.75.11 3.04.74.8 1.19 1.83 1.19 3.08 0 4.41-2.69 5.38-5.26 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.68.8.56A11.5 11.5 0 0 0 12 .5Z" /></svg>
                Continue with GitHub
              </Button>
            </form>
            <p className="label-mono mt-8 rounded-[14px] bg-bone px-4 py-3 text-muted">Demo admin: admin@flybirds.dev / flybirds-demo</p>
          </div>
        </div>
      </div>
    </div>
  );
}
