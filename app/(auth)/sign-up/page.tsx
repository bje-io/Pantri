import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-bold text-foreground mb-2">Create your account</h1>
          <p className="text-muted-foreground text-sm">Start planning smarter meals with Pantri</p>
        </div>
        <SignUp
          forceRedirectUrl="/planner"
          fallbackRedirectUrl="/planner"
          signInForceRedirectUrl="/planner"
        />
      </div>
    </main>
  );
}
