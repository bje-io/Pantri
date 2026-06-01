import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/planner(.*)",
  "/recipes(.*)",
  "/forum(.*)",
  "/grocery(.*)",
  "/profile(.*)",
  "/kitchen(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  // Signed-in user hitting the marketing home page → redirect to planner
  if (userId && req.nextUrl.pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = "/planner";
    return NextResponse.redirect(url);
  }

  // Protect app routes — unauthenticated users get redirected to sign-in
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
