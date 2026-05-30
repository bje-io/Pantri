"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ── Types ─────────────────────────────────────────────────────────

type ForumPost = {
  id: string;
  category: string;
  categoryLabel: string;
  title: string;
  body: string;
  author: string;
  avatarInitials: string;
  upvotes: number;
  replies: number;
  time: string;
  savedToRecipes?: boolean;
  addedToPlan?: boolean;
  attachedRecipe?: {
    id: string;
    title: string;
    cuisine: string;
    calories: number;
    protein: number;
    cookTime: number;
  };
};

// ── Mock data ─────────────────────────────────────────────────────

const INITIAL_POSTS: ForumPost[] = [
  {
    id: "1",
    category: "recipe-swaps",
    categoryLabel: "Recipe Swaps",
    title: "Made the Miso Salmon last night — here's what I changed",
    body: "I added a little gochujang to the glaze for heat and it was incredible. Served over soba instead of jasmine rice. The whole family loved it!",
    author: "Sarah M.",
    avatarInitials: "SM",
    upvotes: 23,
    replies: 8,
    time: "2h ago",
    attachedRecipe: {
      id: "miso-glazed-salmon",
      title: "Spicy Miso Salmon (Remix)",
      cuisine: "Japanese",
      calories: 460,
      protein: 43,
      cookTime: 14,
    },
  },
  {
    id: "2",
    category: "ai-prompt-tips",
    categoryLabel: "AI Prompt Tips",
    title: "Best prompt I've found for Thai food under 500 calories",
    body: "\"High protein Thai dinner, under 500 calories, ready in 30 minutes, no peanuts\" gets you amazing results every single time. Sage nails the balance between authentic flavors and lean macros.",
    author: "David K.",
    avatarInitials: "DK",
    upvotes: 47,
    replies: 14,
    time: "5h ago",
  },
  {
    id: "3",
    category: "grocery-hacks",
    categoryLabel: "Grocery Hacks",
    title: "Buy whole chickens and break them down — saves so much money",
    body: "A whole chicken is usually $1.50/lb vs $5+ for boneless thighs. It takes 5 minutes to break down once you know how. I'll post a video walkthrough this weekend.",
    author: "Jamie L.",
    avatarInitials: "JL",
    upvotes: 34,
    replies: 19,
    time: "1d ago",
  },
  {
    id: "4",
    category: "cuisine-deep-dives",
    categoryLabel: "Cuisine Deep Dives",
    title: "Understanding Indian spice blends: garam masala vs. curry powder",
    body: "These are NOT the same thing and using the wrong one will ruin your dish. Garam masala is a finishing spice — warm and fragrant. Curry powder is a base — earthier and more complex. Here's a breakdown...",
    author: "Priya N.",
    avatarInitials: "PN",
    upvotes: 61,
    replies: 22,
    time: "2d ago",
    attachedRecipe: {
      id: "chicken-tikka-masala",
      title: "Authentic Chicken Tikka Masala",
      cuisine: "Indian",
      calories: 510,
      protein: 48,
      cookTime: 40,
    },
  },
  {
    id: "5",
    category: "recipe-swaps",
    categoryLabel: "Recipe Swaps",
    title: "Kid-approved Chicken Tinga Tacos — way less spicy",
    body: "My kids can't handle chipotles so I swapped to just 1 pepper + smoked paprika. Still smoky and delicious, but mild enough for the whole family. Topped with shredded cheese instead of cilantro.",
    author: "Tom B.",
    avatarInitials: "TB",
    upvotes: 34,
    replies: 9,
    time: "3d ago",
    attachedRecipe: {
      id: "chicken-tinga-tacos",
      title: "Mild Chicken Tinga Tacos",
      cuisine: "Mexican",
      calories: 495,
      protein: 36,
      cookTime: 25,
    },
  },
  {
    id: "6",
    category: "ai-prompt-tips",
    categoryLabel: "AI Prompt Tips",
    title: "Use \"cheat day\" in your prompt for wildly delicious results",
    body: "Try: \"Cheat day dinner — something indulgent, American comfort food, serves 2, under 45 minutes.\" The results are always so satisfying. Got a killer smash burger recipe last week.",
    author: "Alex R.",
    avatarInitials: "AR",
    upvotes: 28,
    replies: 7,
    time: "4d ago",
  },
];

const CATEGORIES = [
  { slug: "all", label: "All", emoji: "💬" },
  { slug: "recipe-swaps", label: "Recipe Swaps", emoji: "🔄" },
  { slug: "grocery-hacks", label: "Grocery Hacks", emoji: "🛒" },
  { slug: "cuisine-deep-dives", label: "Cuisine Deep Dives", emoji: "🌍" },
  { slug: "ai-prompt-tips", label: "AI Prompt Tips", emoji: "✨" },
];

// ── Components ────────────────────────────────────────────────────

function Avatar({ initials }: { initials: string }) {
  return (
    <div className="h-9 w-9 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
      {initials}
    </div>
  );
}

function PostCard({
  post,
  isLoggedIn,
  onUpvote,
  onSaveRecipe,
  onAddToPlan,
}: {
  post: ForumPost;
  isLoggedIn: boolean;
  onUpvote: (id: string) => void;
  onSaveRecipe: (id: string) => void;
  onAddToPlan: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [addPlanOpen, setAddPlanOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-border bg-card hover:shadow-sm transition-all overflow-hidden">
      <div className="p-5">
        {/* Top row */}
        <div className="flex items-start gap-3 mb-3">
          <Avatar initials={post.avatarInitials} />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <Badge variant="secondary" className="text-[10px] shrink-0">
                {CATEGORIES.find((c) => c.slug === post.category)?.emoji} {post.categoryLabel}
              </Badge>
              <span className="text-xs text-muted-foreground">{post.time}</span>
            </div>
            <h3 className="font-semibold text-foreground leading-snug">{post.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">by {post.author}</p>
          </div>
        </div>

        {/* Body */}
        <p
          className={cn(
            "text-sm text-muted-foreground leading-relaxed mb-4",
            !expanded && "line-clamp-2"
          )}
        >
          {post.body}
        </p>
        {post.body.length > 120 && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="text-xs text-primary hover:underline mb-4 -mt-2 block"
          >
            {expanded ? "Show less" : "Read more →"}
          </button>
        )}

        {/* Attached recipe card */}
        {post.attachedRecipe && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 mb-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] text-muted-foreground mb-0.5">Attached recipe</p>
                <p className="font-semibold text-foreground text-sm">{post.attachedRecipe.title}</p>
                <p className="text-xs text-muted-foreground">
                  {post.attachedRecipe.cuisine} · {post.attachedRecipe.cookTime} min ·{" "}
                  {post.attachedRecipe.calories} cal · {post.attachedRecipe.protein}g protein
                </p>
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <button
                  onClick={() => isLoggedIn ? onSaveRecipe(post.id) : null}
                  className={cn(
                    "text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-all",
                    post.savedToRecipes
                      ? "bg-accent/10 text-accent border-accent/30"
                      : isLoggedIn
                      ? "bg-background text-muted-foreground border-border hover:border-accent/40 hover:text-accent"
                      : "bg-muted text-muted-foreground border-border cursor-not-allowed opacity-60"
                  )}
                  title={!isLoggedIn ? "Sign in to save" : ""}
                >
                  {post.savedToRecipes ? "♥ Saved" : "♡ Save"}
                </button>

                <div className="relative">
                  <button
                    onClick={() => isLoggedIn ? setAddPlanOpen((o) => !o) : null}
                    className={cn(
                      "text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-all w-full",
                      post.addedToPlan
                        ? "bg-primary/10 text-primary border-primary/30"
                        : isLoggedIn
                        ? "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-primary"
                        : "bg-muted text-muted-foreground border-border cursor-not-allowed opacity-60"
                    )}
                    title={!isLoggedIn ? "Sign in to add to plan" : ""}
                  >
                    {post.addedToPlan ? "✓ In plan" : "+ Add to plan"}
                  </button>
                  {addPlanOpen && (
                    <div className="absolute right-0 top-full mt-1 z-10 bg-card border border-border rounded-xl shadow-lg p-2 min-w-[150px]">
                      <button
                        onClick={() => { onAddToPlan(post.id); setAddPlanOpen(false); }}
                        className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-muted"
                      >
                        📅 This week
                      </button>
                      <button
                        onClick={() => { onAddToPlan(post.id); setAddPlanOpen(false); }}
                        className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-muted"
                      >
                        ➡️ Next week
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action row */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => onUpvote(post.id)}
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium transition-colors",
              "text-muted-foreground hover:text-primary"
            )}
          >
            <span className="text-base">↑</span> {post.upvotes}
          </button>
          <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <span>💬</span> {post.replies} {post.replies === 1 ? "reply" : "replies"}
          </button>
          <button className="text-xs text-muted-foreground hover:text-foreground ml-auto">
            Share
          </button>
        </div>
      </div>

      {/* Reply box — logged in only */}
      {isLoggedIn && (
        <div className="border-t border-border px-5 py-3 bg-muted/20">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Write a reply..."
              className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring/50"
            />
            <button className={cn(buttonVariants({ size: "sm" }), "bg-primary hover:bg-primary/90 text-xs shrink-0")}>
              Reply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────

export default function ForumPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [catFilter, setCatFilter] = useState("all");
  const [posts, setPosts] = useState<ForumPost[]>(INITIAL_POSTS);
  const [newPostOpen, setNewPostOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"recent" | "top">("recent");

  function upvote(id: string) {
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, upvotes: p.upvotes + 1 } : p))
    );
  }

  function saveRecipe(id: string) {
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, savedToRecipes: !p.savedToRecipes } : p))
    );
  }

  function addToPlan(id: string) {
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, addedToPlan: true } : p))
    );
  }

  const filtered = posts
    .filter((p) => catFilter === "all" || p.category === catFilter)
    .sort((a, b) => sortBy === "top" ? b.upvotes - a.upvotes : 0);

  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Community</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Share recipes, tips, and AI prompts with other Pantri families
          </p>
        </div>
        <div className="flex gap-3 items-center">
          {/* Dev toggle — remove when Clerk is live */}
          <button
            onClick={() => setIsLoggedIn((l) => !l)}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "text-xs border-dashed"
            )}
          >
            {isLoggedIn ? "✓ Logged in" : "Preview login"}
          </button>
          <button
            onClick={() => isLoggedIn ? setNewPostOpen(true) : null}
            className={cn(
              buttonVariants({ size: "sm" }),
              isLoggedIn ? "bg-primary hover:bg-primary/90" : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
            title={!isLoggedIn ? "Sign in to post" : ""}
          >
            + New post
          </button>
        </div>
      </div>

      {/* Auth gate banner */}
      {!isLoggedIn && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💬</span>
            <div>
              <p className="font-semibold text-foreground">Sign in to participate</p>
              <p className="text-sm text-muted-foreground">
                Browse for free. Post, reply, save recipes, and add meals to your plan with an account.
              </p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <a href="/sign-in" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>Sign in</a>
            <a href="/sign-up" className={cn(buttonVariants({ size: "sm" }), "bg-primary hover:bg-primary/90")}>Sign up free</a>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Feed */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filter & sort bar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 flex-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => setCatFilter(cat.slug)}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border shrink-0 transition-all",
                    catFilter === cat.slug
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:border-primary/40"
                  )}
                >
                  <span>{cat.emoji}</span>{cat.label}
                </button>
              ))}
            </div>
            <div className="flex rounded-lg border border-border bg-muted/20 p-0.5 gap-0.5 shrink-0">
              {(["recent", "top"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSortBy(s)}
                  className={cn(
                    "px-3 py-1 rounded-md text-xs font-medium transition-all capitalize",
                    sortBy === s ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {s === "recent" ? "Latest" : "Top"}
                </button>
              ))}
            </div>
          </div>

          {/* Posts */}
          {filtered.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              isLoggedIn={isLoggedIn}
              onUpvote={upvote}
              onSaveRecipe={saveRecipe}
              onAddToPlan={addToPlan}
            />
          ))}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="font-serif font-bold text-foreground mb-1">Categories</h3>
            <div className="space-y-2 mt-3">
              {CATEGORIES.slice(1).map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => setCatFilter(cat.slug)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all text-left",
                    catFilter === cat.slug
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <span>{cat.emoji}</span>{cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="font-serif font-bold text-foreground mb-3">Community</h3>
            <div className="space-y-2 text-sm">
              {[
                { label: "Members", val: "142" },
                { label: "Posts", val: "83" },
                { label: "Recipes shared", val: "37" },
                { label: "Active today", val: "12" },
              ].map((s) => (
                <div key={s.label} className="flex justify-between">
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className="font-semibold text-foreground">{s.val}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="font-semibold text-foreground mb-2">Guidelines</h3>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li>✓ Share recipes and modifications</li>
              <li>✓ Credit original sources</li>
              <li>✓ Be constructive with feedback</li>
              <li>✗ No spam or off-topic posts</li>
            </ul>
          </div>
        </div>
      </div>

      {/* New post modal placeholder */}
      {newPostOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setNewPostOpen(false)}>
          <div className="bg-card rounded-2xl border border-border w-full max-w-lg p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-serif text-xl font-bold text-foreground mb-4">New Post</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Category</label>
                <select className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50">
                  {CATEGORIES.slice(1).map((c) => (
                    <option key={c.slug} value={c.slug}>{c.emoji} {c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Title</label>
                <input type="text" placeholder="What are you sharing?" className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Body</label>
                <textarea rows={4} placeholder="Share your experience, tips, or modifications..." className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring/50" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setNewPostOpen(false)} className={cn(buttonVariants({ variant: "outline" }), "flex-1")}>Cancel</button>
                <button onClick={() => setNewPostOpen(false)} className={cn(buttonVariants(), "flex-1 bg-primary hover:bg-primary/90")}>Post</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
