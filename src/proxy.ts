import { getToken } from "next-auth/jwt";
import { type NextRequest, NextResponse } from "next/server";

export async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  const role = token?.role as string | undefined;
  const { pathname } = req.nextUrl;

  // CLIENT users may only access /portal/* and /api/auth/*
  if (role === "CLIENT") {
    if (!pathname.startsWith("/portal") && !pathname.startsWith("/api/auth")) {
      return NextResponse.redirect(new URL("/portal/chamados", req.nextUrl));
    }
    return NextResponse.next();
  }

  // Non-CLIENT authenticated users should not access /portal/*
  if (role && pathname.startsWith("/portal")) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
