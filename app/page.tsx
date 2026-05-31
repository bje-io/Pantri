import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import Navbar from "@/components/navbar";
import MealCard from "@/components/meal-card";
import { WEEKLY_MEAL_PLAN } from "@/lib/recipes";

const FEATURES = [
  {
    icon: "📅",
    title: "Weekly Meal Planner",
    description: "Drag-and-drop your week. Five dinners, zero stress. Swap meals instantly.",
  },
  {
    icon: "✨",
    title: "AI Meal Generator",
    description: "Tell Sage what you're craving — or just your macros — and get a full recipe in seconds.",
  },
  {
    icon: "🛒",
    title: "Smart Grocery Lists",
    description: "Your plan auto-generates a categorized shopping list. Check things off as you shop.",
  },
  {
    icon: "🍳",
    title: "Cooking Mode",
    description: "Full-screen step-by-step guidance with built-in timers. Your hands stay clean.",
  },
  {
    icon: "👨‍👩‍👧‍👦",
    title: "Family Accounts",
    description: "Share your plan with the whole household. Everyone sees what's for dinner.",
  },
  {
    icon: "💬",
    title: "Community Forum",
    description: "Swap recipes, share AI prompts, and discover what other families are cooking.",
  },
];

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) redirect("/planner");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pantri-green/5 via-background to-pantri-terracotta/5 pointer-events-none" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary font-medium mb-8">
            <span>✨</span>
            <span>Powered by Sage AI</span>
          </div>
          <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground leading-tight tracking-tight max-w-4xl mx-auto">
            Your AI-powered{" "}
            <span className="text-primary">kitchen</span>{" "}
            companion
          </h1>
          <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Plan delicious weekly meals, shop smarter, and cook with confidence —
            all in one beautiful place.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/sign-up"
              className={cn(buttonVariants({ size: "lg" }), "bg-primary hover:bg-primary/90 text-primary-foreground h-12 px-8 text-base")}
            >
              Start planning for free
            </Link>
            <Link
              href="#this-week"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-12 px-8 text-base border-border hover:bg-muted")}
            >
              See this week&apos;s plan →
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Free forever · No credit card · Family-friendly
          </p>
        </div>
      </section>

      {/* Weekly Meal Planner */}
      <section id="this-week" className="py-20 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
            <div>
              <p className="text-sm font-medium text-accent mb-1">This Week&apos;s Plan</p>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground">
                Five weeknight dinners,
                <br />
                ready to cook
              </h2>
            </div>
            <div className="flex gap-3">
              <Link href="/planner" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                View full planner
              </Link>
              <Link
                href="/planner/generate"
                className={cn(buttonVariants({ size: "sm" }), "bg-accent hover:bg-accent/90 text-accent-foreground")}
              >
                ✨ Generate with AI
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {WEEKLY_MEAL_PLAN.map((day, index) => (
              <MealCard key={day.day} day={day} index={index} />
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-xl">
                🛒
              </div>
              <div>
                <p className="font-semibold text-foreground">Grocery list is ready</p>
                <p className="text-sm text-muted-foreground">47 items across 6 categories, auto-generated from this week&apos;s meals</p>
              </div>
            </div>
            <Link
              href="/grocery"
              className={cn(buttonVariants(), "bg-primary hover:bg-primary/90 shrink-0")}
            >
              Open grocery list
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-sm font-medium text-accent mb-2">Everything you need</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground">
              From plan to plate
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Pantri handles the thinking so you can focus on the cooking.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-border bg-card p-6 hover:border-primary/30 hover:shadow-sm transition-all"
              >
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Highlight */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-primary-foreground/70 text-sm font-medium mb-3">AI Meal Generator</p>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-6 leading-tight">
                Tell us what you want.
                <br />
                We&apos;ll handle the rest.
              </h2>
              <p className="text-primary-foreground/80 mb-8 leading-relaxed">
                Type a craving, a cuisine, your dietary needs, or a macro target — and get a
                full recipe with ingredients, steps, and nutritional info in seconds. Save it
                straight to your meal plan.
              </p>
              <Link
                href="/sign-up"
                className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "bg-primary-foreground text-primary hover:bg-primary-foreground/90")}
              >
                Try it free →
              </Link>
            </div>

            <div className="rounded-2xl bg-primary-foreground/10 border border-primary-foreground/20 p-6 space-y-4">
              <div className="rounded-xl bg-primary-foreground/10 p-4">
                <p className="text-sm text-primary-foreground/60 mb-1">Your prompt</p>
                <p className="text-primary-foreground font-medium">
                  &ldquo;High protein Thai dinner, under 550 calories, ready in 30 minutes&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-2 text-primary-foreground/60 text-sm">
                <div className="h-1 w-1 rounded-full bg-current animate-bounce" />
                <div className="h-1 w-1 rounded-full bg-current animate-bounce [animation-delay:0.1s]" />
                <div className="h-1 w-1 rounded-full bg-current animate-bounce [animation-delay:0.2s]" />
                <span>Sage is generating your recipe...</span>
              </div>
              <div className="rounded-xl bg-primary-foreground/10 p-4 space-y-2">
                <p className="font-serif font-bold text-primary-foreground text-lg">Shrimp Pad Thai</p>
                <p className="text-sm text-primary-foreground/70">Thai · 35 min · 548 cal · 36g protein</p>
                <div className="flex gap-2 pt-1">
                  {["seafood", "noodles", "quick"].map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] px-2 py-0.5 rounded-full bg-primary-foreground/20 text-primary-foreground/80 capitalize"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-sm font-medium text-accent mb-2">Simple pricing</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground">
              Start free, upgrade when ready
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="rounded-2xl border border-border bg-card p-8">
              <div className="mb-6">
                <h3 className="font-serif text-xl font-bold text-foreground">Free</h3>
                <p className="text-3xl font-bold text-foreground mt-2">$0 <span className="text-base font-normal text-muted-foreground">/month</span></p>
              </div>
              <ul className="space-y-3 text-sm text-muted-foreground mb-8">
                {[
                  "Weekly meal planner",
                  "5 seed recipes included",
                  "1 AI-generated meal per week",
                  "Grocery list generation",
                  "Recipe cards & cooking mode",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/sign-up" className={cn(buttonVariants({ variant: "outline" }), "w-full justify-center")}>
                Get started free
              </Link>
            </div>

            <div className="rounded-2xl border-2 border-primary bg-card p-8 relative">
              <div className="absolute -top-3 left-6">
                <span className="bg-accent text-accent-foreground text-xs font-semibold px-3 py-1 rounded-full">
                  Most popular
                </span>
              </div>
              <div className="mb-6">
                <h3 className="font-serif text-xl font-bold text-foreground">Pro</h3>
                <p className="text-3xl font-bold text-foreground mt-2">$8 <span className="text-base font-normal text-muted-foreground">/month</span></p>
              </div>
              <ul className="space-y-3 text-sm text-muted-foreground mb-8">
                {[
                  "Everything in Free",
                  "Unlimited AI meal generation",
                  "Full community forum access",
                  "Family account (up to 6 members)",
                  "Advanced dietary & allergy filters",
                  "Nutrition tracking & weekly insights",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/sign-up" className={cn(buttonVariants(), "w-full justify-center bg-primary hover:bg-primary/90")}>
                Start Pro free for 14 days
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 bg-pantri-green-light/40 border-t border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Ready to cook smarter?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Join families who&apos;ve taken the stress out of &ldquo;what&apos;s for dinner?&rdquo;
          </p>
          <Link
            href="/sign-up"
            className={cn(buttonVariants({ size: "lg" }), "bg-primary hover:bg-primary/90 h-12 px-8 text-base")}
          >
            Get started — it&apos;s free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🌿</span>
              <span className="font-serif font-bold text-foreground">Pantri</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 Pantri. Your AI-powered kitchen companion.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link href="/forum" className="hover:text-foreground transition-colors">Community</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
