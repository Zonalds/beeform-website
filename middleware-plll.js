import { NextResponse } from "next/server";

export const config = {
    matcher: ["/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)"],
};

export default function middleware(req) {
    const url = req.nextUrl;
    const hostname = req.headers.get("host");

    const res = NextResponse.next();

    // --- SESSION HANDLING ---
    let sessionId = req.cookies.get("session_id")?.value;

    if (!sessionId) {
        // Generate a new UUID using Web Crypto API
        sessionId = crypto.randomUUID();

        res.cookies.set("session_id", sessionId, {
            path: "/",
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 60 * 60 * 24 * 7, // 7 days
        });
    }

    // --- LOCAL DEV ---
    // Example: http://localhost:3001/acme/john
    // Rewrites to /_sites/acme/john
    if (hostname.includes("localhost")) {
        const segments = url.pathname.split("/").filter(Boolean); // ['acme', 'john']
        if (segments.length > 0) {
            console.log("Rewriting local:", `/_sites/${segments.join("/")}`);
            return NextResponse.rewrite(
                new URL(`/_sites/${segments.join("/")}`, req.url),
                res
            );
        }
    }

    // --- PRODUCTION ---
    // Example: https://acme.com/john
    // Rewrites to /_sites/acme.com/john
    return NextResponse.rewrite(
        new URL(`/_sites/${hostname}${url.pathname}`, req.url),
        res
    );
}
