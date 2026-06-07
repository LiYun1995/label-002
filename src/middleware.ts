import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
    if (token) {
      const role = token.role;
      switch (role) {
        case "OWNER":
          return NextResponse.redirect(new URL("/owner/dashboard", request.url));
        case "ADMIN":
          return NextResponse.redirect(new URL("/admin/dashboard", request.url));
        case "WORKER":
          return NextResponse.redirect(new URL("/worker/dashboard", request.url));
        default:
          return NextResponse.next();
      }
    }
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const role = token.role;

  if (pathname.startsWith("/owner/") && role !== "OWNER") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/admin/") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/worker/") && role !== "WORKER") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/api/admin/") && role !== "ADMIN") {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/owner/:path*",
    "/admin/:path*",
    "/worker/:path*",
    "/login",
    "/register",
    "/api/repair-requests/:path*",
    "/api/workers/:path*",
    "/api/admin/:path*",
  ],
};
