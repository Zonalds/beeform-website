// middleware.js
import { NextResponse } from "next/server";

export const config = {
    matcher: [
        // Run middleware for all routes except Next.js internals and static files
        "/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)",
    ],
};

export default function middleware(req) {
    const url = req.nextUrl;
    const hostname = req.headers.get("host");

    // Skip certain paths (like images or static files)
    if (
        url.pathname.startsWith("/_next") ||
        url.pathname.startsWith("/static") ||
        url.pathname.endsWith(".jpg") ||
        url.pathname.endsWith(".png") ||
        url.pathname.endsWith(".svg") ||
        url.pathname.endsWith(".jpeg")
    ) {
        return NextResponse.next();
    }

    // Extract path segments: /domain/username → ["domain", "username"]
    const pathSegments = url.pathname.split("/").filter(Boolean);

    if (pathSegments.length >= 2) {
        const [domain, username, ...rest] = pathSegments;

        // Rewrite to /sites/[domain]/[username]/[...rest]
        return NextResponse.rewrite(
            new URL(`/sites/${domain}/${username}/${rest.join("/")}`, req.url)
        );
    }

    return NextResponse.next();
}
