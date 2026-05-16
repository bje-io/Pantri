import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const CATEGORIES = [
  {
    slug: "recipe-swaps",
    label: "Recipe Swaps",
    emoji: "🔄",
    description: "Share what you're cooking and find inspiration from other families.",
    posts: 24,
    color: "bg-primary/10 text-primary border-primary/20",
  },
  {
    slug: "grocery-hacks",
    label: "Grocery Hacks",
    emoji: "🛒",
    description: "Tips for saving money, buying in bulk, and reducing food waste.",
    posts: 17,
    color: "bg-accent/10 text-accent border-accent/20",
  },
  {
    slug: "cuisine-deep-dives",
    label: "Cuisine Deep Dives",
    emoji: "🌍",
    description: "Explore techniques, ingredients, and traditions from around the world.",
    posts: 11,
    color: "bg-primary/10 text-primary border-primary/20",
  },
  {
    slug: "ai-prompt-tips",
    label: "AI Prompt Tips",
    emoji: "✨",
    description: "Share the prompts that generated your best meals. Learn from the community.",
    posts: 31,
    color: "bg-accent/10 text-accent border-accent/20",
  },
];

const RECENT_POSTS = [
  {
    category: "recipe-swaps",
    categoryLabel: "Recipe Swaps",
    title: "Made the Miso Salmon last night — here's what I changed",
    author: "Sarah M.",
    replies: 8,
    upvotes: 23,
    time: "2h ago",
  },
  {
    category: "ai-prompt-tips",
    categoryLabel: "AI Prompt Tips",
    title: "The best prompt I've found for generating Thai food under 500 calories",
    author: "David K.",
    replies: 14,
    upvotes: 47,
    time: "5h ago",
  },
  {
    category: "grocery-hacks",
    categoryLabel: "Grocery Hacks",
    title: "Buy whole chickens, break them down yourself — here's how",
    author: "Jamie L.",
    replies: 5,
    upvotes: 19,
    time: "1d ago",
  },
  {
    category: "cuisine-deep-dives",
    categoryLabel: "Cuisine Deep Dives",
    title: "Understanding Indian spice blends: garam masala vs curry powder",
    author: "Priya N.",
    replies: 22,
    upvotes: 61,
    time: "2d ago",
  },
  {
    category: "recipe-swaps",
    categoryLabel: "Recipe Swaps",
    title: "Kid-approved version of the Chicken Tinga Tacos (less spicy)",
    author: "Tom B.",
    replies: 9,
    upvotes: 34,
    time: "3d ago",
  },
];

export default function ForumPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Community</h1>
          <p className="text-muted-foreground mt-1">Share recipes, tips, and AI prompts with other Pantri families</p>
        </div>
        <Link
          href="/forum/new"
          className={cn(buttonVariants({ size: "sm" }), "bg-primary hover:bg-primary/90")}
        >
          + New post
        </Link>
      </div>

      {/* Pro gate banner */}
      <div className="rounded-2xl border border-accent/30 bg-accent/5 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔓</span>
          <div>
            <p className="font-semibold text-foreground">Full forum access is a Pro feature</p>
            <p className="text-sm text-muted-foreground">Browse freely — posting and replying requires a Pro plan.</p>
          </div>
        </div>
        <Link
          href="/sign-up"
          className={cn(buttonVariants({ size: "sm" }), "bg-accent hover:bg-accent/90 text-accent-foreground shrink-0")}
        >
          Upgrade to Pro
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Categories */}
          <div>
            <h2 className="font-semibold text-foreground mb-4">Categories</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/forum/${cat.slug}`}
                  className="rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-sm transition-all p-4 block"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{cat.emoji}</span>
                    <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full border", cat.color)}>
                      {cat.posts} posts
                    </span>
                  </div>
                  <h3 className="font-semibold text-foreground text-sm mb-1">{cat.label}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{cat.description}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent posts */}
          <div>
            <h2 className="font-semibold text-foreground mb-4">Recent posts</h2>
            <div className="space-y-2">
              {RECENT_POSTS.map((post) => (
                <div
                  key={post.title}
                  className="rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-[10px] capitalize shrink-0">
                          {post.categoryLabel}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{post.time}</span>
                      </div>
                      <p className="font-medium text-foreground text-sm leading-snug">{post.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">by {post.author}</p>
                    </div>
                    <div className="flex gap-3 text-xs text-muted-foreground shrink-0">
                      <span>↑ {post.upvotes}</span>
                      <span>💬 {post.replies}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold text-foreground mb-3">Community stats</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total posts</span>
                <span className="font-medium">83</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Members</span>
                <span className="font-medium">142</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active today</span>
                <span className="font-medium">12</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold text-foreground mb-1">Community guidelines</h3>
            <p className="text-xs text-muted-foreground mb-3">Keep it kind, helpful, and food-focused.</p>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li>✓ Share recipes and modifications</li>
              <li>✓ Credit original sources</li>
              <li>✓ Be constructive with feedback</li>
              <li>✗ No spam or off-topic posts</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
