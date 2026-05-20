"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

const EXAMPLE_PROMPTS = [
  "High protein week, no red meat, mix of Asian cuisines",
  "Quick 30-minute meals for busy weeknights",
  "Mediterranean diet, gluten-free, around 500 cal each",
  "Kid-friendly dinners the whole family will love",
];

type GenerateMode = "single" | "week";
type GenerateState = "idle" | "loading" | "needs-key" | "done";

export default function GeneratePage() {
  const [mode, setMode] = useState<GenerateMode>("single");
  const [prompt, setPrompt] = useState("");
  const [calories, setCalories] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [servings, setServings] = useState("2");
  const [state, setState] = useState<GenerateState>("idle");

  function handleGenerate() {
    if (!prompt.trim()) return;
    setState("loading");

    // Simulate checking for API key — will be replaced by real call
    setTimeout(() => {
      setState("needs-key");
    }, 800);
  }

  function handleExampleClick(p: string) {
    setPrompt(p);
    setState("idle");
  }

  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <Link
          href="/planner"
          className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1"
        >
          ← Back to planner
        </Link>
        <div className="flex items-center gap-3 mt-2 mb-2">
          <span className="text-3xl">✨</span>
          <h1 className="font-serif text-3xl font-bold text-foreground">AI Meal Generator</h1>
        </div>
        <p className="text-muted-foreground">
          Describe what you want — a single meal or a full week — and Claude will build it for you.
        </p>
      </div>

      {/* API key setup banner */}
      {state === "needs-key" && (
        <div className="rounded-2xl border border-accent/40 bg-accent/5 p-5 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0">🔑</span>
            <div>
              <p className="font-semibold text-foreground mb-1">Anthropic API key required</p>
              <p className="text-sm text-muted-foreground mb-3">
                To generate meals with Claude, add your Anthropic API key to{" "}
                <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">.env.local</code>:
              </p>
              <pre className="bg-muted rounded-xl px-4 py-3 text-xs font-mono text-foreground mb-3 overflow-x-auto">
                ANTHROPIC_API_KEY=sk-ant-...
              </pre>
              <p className="text-xs text-muted-foreground">
                Get your key at{" "}
                <a
                  href="https://console.anthropic.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-2"
                >
                  console.anthropic.com
                </a>
                {" "}· Then restart the dev server.
              </p>
            </div>
          </div>
          <button
            onClick={() => setState("idle")}
            className="mt-3 text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Mode toggle */}
      <div className="flex rounded-xl border border-border bg-muted/30 p-1 mb-6 w-fit">
        {(["single", "week"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              "px-5 py-1.5 rounded-lg text-sm font-medium transition-all",
              mode === m
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {m === "single" ? "Single meal" : "Full week"}
          </button>
        ))}
      </div>

      {/* Prompt input */}
      <div className="rounded-2xl border border-border bg-card p-6 mb-6">
        <label className="block text-sm font-medium text-foreground mb-2">
          {mode === "single" ? "What meal are you looking for?" : "Describe your ideal week"}
        </label>
        <textarea
          className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring/50"
          rows={3}
          value={prompt}
          onChange={(e) => { setPrompt(e.target.value); setState("idle"); }}
          placeholder={
            mode === "single"
              ? "e.g. Healthy Thai dinner under 600 calories, ready in 30 minutes..."
              : "e.g. High protein, no red meat, mix of Asian cuisines, under 500 cal each..."
          }
        />

        {/* Filters */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { label: "Max calories", value: calories, set: setCalories, placeholder: "e.g. 600" },
            { label: "Max cook time (min)", value: cookTime, set: setCookTime, placeholder: "e.g. 30" },
            { label: "Servings", value: servings, set: setServings, placeholder: "e.g. 2" },
          ].map((field) => (
            <div key={field.label}>
              <label className="block text-xs text-muted-foreground mb-1">{field.label}</label>
              <input
                type="number"
                value={field.value}
                onChange={(e) => field.set(e.target.value)}
                placeholder={field.placeholder}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
              />
            </div>
          ))}
        </div>

        <button
          onClick={handleGenerate}
          disabled={!prompt.trim() || state === "loading"}
          className={cn(
            buttonVariants({ size: "lg" }),
            "w-full mt-5 justify-center gap-2 transition-all",
            !prompt.trim() || state === "loading"
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-primary hover:bg-primary/90 text-primary-foreground"
          )}
        >
          {state === "loading" ? (
            <>
              <span className="animate-spin">⟳</span> Asking Claude...
            </>
          ) : (
            "✨ Generate recipe"
          )}
        </button>

        <p className="text-center text-xs text-muted-foreground mt-2">
          Free tier: 1 generation per week ·{" "}
          <Link href="/sign-up" className="underline underline-offset-2">
            Upgrade to Pro
          </Link>{" "}
          for unlimited
        </p>
      </div>

      {/* Example prompts */}
      <div>
        <p className="text-sm font-medium text-foreground mb-3">Try one of these</p>
        <div className="space-y-2">
          {EXAMPLE_PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => handleExampleClick(p)}
              className={cn(
                "w-full text-left rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 px-4 py-3 text-sm text-muted-foreground hover:text-foreground transition-all",
                prompt === p && "border-primary bg-primary/5 text-foreground"
              )}
            >
              <span className="mr-2 text-primary">→</span>
              {p}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
