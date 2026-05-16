import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

const EXAMPLE_PROMPTS = [
  "High protein week, no red meat, mix of Asian cuisines",
  "Quick 30-minute meals for busy weeknights",
  "Mediterranean diet, gluten-free, around 500 cal each",
  "Kid-friendly dinners the whole family will love",
];

export default function GeneratePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <Link href="/planner" className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block">
          ← Back to planner
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">✨</span>
          <h1 className="font-serif text-3xl font-bold text-foreground">AI Meal Generator</h1>
        </div>
        <p className="text-muted-foreground">
          Describe what you want — a single meal or a full week — and Claude will build it for you.
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex rounded-xl border border-border bg-muted/30 p-1 mb-6 w-fit">
        <button className="px-4 py-1.5 rounded-lg bg-background text-sm font-medium text-foreground shadow-sm">
          Single meal
        </button>
        <button className="px-4 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground">
          Full week
        </button>
      </div>

      {/* Prompt input */}
      <div className="rounded-2xl border border-border bg-card p-6 mb-6">
        <label className="block text-sm font-medium text-foreground mb-2">
          What are you looking for?
        </label>
        <textarea
          className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring"
          rows={3}
          placeholder="e.g. Healthy Thai dinner under 600 calories, ready in 30 minutes..."
        />

        {/* Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
          {[
            { label: "Max calories", placeholder: "e.g. 600" },
            { label: "Max cook time (min)", placeholder: "e.g. 30" },
            { label: "Servings", placeholder: "e.g. 2" },
          ].map((field) => (
            <div key={field.label}>
              <label className="block text-xs text-muted-foreground mb-1">{field.label}</label>
              <input
                type="number"
                placeholder={field.placeholder}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
              />
            </div>
          ))}
        </div>

        <button
          className={cn(
            buttonVariants({ size: "lg" }),
            "w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground"
          )}
        >
          ✨ Generate recipe
        </button>
        <p className="text-center text-xs text-muted-foreground mt-2">
          Free tier: 1 generation per week · <Link href="/sign-up" className="underline underline-offset-2">Upgrade to Pro</Link> for unlimited
        </p>
      </div>

      {/* Example prompts */}
      <div>
        <p className="text-sm font-medium text-foreground mb-3">Try one of these</p>
        <div className="space-y-2">
          {EXAMPLE_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              className="w-full text-left rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 px-4 py-3 text-sm text-muted-foreground hover:text-foreground transition-all"
            >
              <span className="mr-2">→</span>{prompt}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
