import { NextRequest, NextResponse } from "next/server";

export const config = {
    matcher: [
        /*
         * Match all paths except for:
         * 1. /api routes
         * 2. /_next (Next.js internals)
         * 3. /_static (inside /public)
         * 4. all root files inside /public (e.g. /favicon.ico)
         */
        "/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)",
    ],
};

export default async function middleware(req) {
    const url = req.nextUrl;
    const country = req.geo?.country || "US";
    const acceptLanguage = req.headers.get('accept-language');
    const language = acceptLanguage?.split(',')[0] || 'en';
    const langId = acceptLanguage ? acceptLanguage.split(',')[0].split('-')[0] : 'en';

    // Get hostname of request
    let hostname = req.headers.get("host");

    // Handle localhost development
    if (hostname?.includes("localhost")) {
        hostname = hostname.replace(".localhost:3001", `.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`);
    }

    // Handle Vercel preview deployments
    if (
        hostname?.includes("---") &&
        hostname.endsWith(`.${process.env.NEXT_PUBLIC_VERCEL_DEPLOYMENT_SUFFIX}`)
    ) {
        hostname = `${hostname.split("---")[0]}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`;
    }

    const searchParams = req.nextUrl.searchParams.toString();
    const path = `${url.pathname}${searchParams.length > 0 ? `?${searchParams}` : ""}`;

    // DEBUGGING: Log every request
    console.log("🔍 MIDDLEWARE DEBUG:", {
        originalUrl: req.url,
        hostname,
        pathname: url.pathname,
        path,
        host: req.headers.get("host")
    });

    // Skip middleware for static files and system routes
    if (
        url.pathname.startsWith('/_next/') ||
        url.pathname.startsWith('/static/') ||
        url.pathname.startsWith('/_vercel/') ||
        url.pathname.startsWith('/api/') ||
        url.pathname.match(/\.(jpg|jpeg|png|svg|gif|webp|ico|js|css|woff|woff2|ttf|otf|txt|xml|json)$/) ||
        url.pathname.includes('/demo/') ||
        url.pathname.includes('/brand/') ||
        url.pathname.includes('/image/') ||
        url.pathname.includes('/integration/') ||
        url.pathname.includes('/other/') ||
        url.pathname.includes('/chunks') ||
        url.pathname.includes('/chunk')
    ) {
        console.log("⏭️ SKIPPING:", url.pathname);
        return NextResponse.next();
    }

    // Root domain redirect to main site
    if (!hostname?.includes("localhost") && hostname === process.env.NEXT_PUBLIC_ROOT_DOMAIN) {
        console.log("🔄 ROOT DOMAIN REDIRECT:", hostname);
        return NextResponse.redirect(new URL("/", "https://workform.io"));
    }

    // App subdomain handling
    if (hostname === `app.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`) {
        const rewritePath = `/app${path === "/" ? "" : path}`;
        console.log("🔄 APP SUBDOMAIN REWRITE:", rewritePath);

        // Uncomment for authentication
        // const session = await getToken({ req });
        // if (!session && path !== "/login") {
        //     return NextResponse.redirect(new URL("/login", req.url));
        // } else if (session && path === "/login") {
        //     return NextResponse.redirect(new URL("/", req.url));
        // }

        return NextResponse.rewrite(new URL(rewritePath, req.url));
    }

    // Handle localhost development - rewrite to home route group
    if (hostname === "localhost:3001") {
        const rewritePath = `/home${path === "/" ? "" : path}`;
        console.log("🔄 LOCALHOST REWRITE:", rewritePath);
        return NextResponse.rewrite(new URL(rewritePath, req.url));
    }

    // Handle main root domain - rewrite to home route group
    if (hostname === process.env.NEXT_PUBLIC_ROOT_DOMAIN) {
        const rewritePath = `/home${path === "/" ? "" : path}`;
        console.log("🔄 ROOT DOMAIN REWRITE:", rewritePath);
        return NextResponse.rewrite(new URL(rewritePath, req.url));
    }

    // Handle custom domains - redirect root to organization page
    if (
        !hostname?.includes("localhost") &&
        !hostname?.includes("form.workform.io") &&
        url.pathname === "/"
    ) {
        console.log("🔄 CUSTOM DOMAIN ROOT REDIRECT to /organization:", hostname);
        return NextResponse.redirect(new URL("/organization", url.origin));
    }

    // Add query params for language and country (only if not root path)
    if (url.pathname !== "/" && (!req.nextUrl.searchParams.get('lang') || !req.nextUrl.searchParams.get('country'))) {
        if (!req.nextUrl.searchParams.get('lang')) {
            url.searchParams.set("lang", langId);
        }
        if (!req.nextUrl.searchParams.get('country')) {
            url.searchParams.set("country", country);
        }
        console.log("🔄 ADDING QUERY PARAMS:", url.toString());
        return NextResponse.redirect(url);
    }

    // Custom domain rewrite to [domain] dynamic route
    // This rewrites everything else to the (domains) route group with [domain] dynamic route
    const rewritePath = `/${hostname}${url.pathname}`;

    console.log("🔄 CUSTOM DOMAIN REWRITE:", {
        hostname,
        originalPath: url.pathname,
        rewriteTo: rewritePath,
        fullRewriteUrl: new URL(rewritePath, req.url).toString()
    });

    return NextResponse.rewrite(new URL(rewritePath, req.url));
}