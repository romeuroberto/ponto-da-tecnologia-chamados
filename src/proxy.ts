import { getToken } from "next-auth/jwt";
import { type NextRequest, NextResponse } from "next/server";

const PORTAL_VIEW_COOKIE = "portal_view";

function isMobileUserAgent(userAgent: string) {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
}

function getPortalAppDestination(pathname: string) {
  if (pathname === "/portal" || pathname === "/portal/dashboard") {
    return "/portal-app";
  }

  if (pathname === "/portal/chamados") {
    return "/portal-app/chamados";
  }

  if (pathname === "/portal/chamados/novo") {
    return "/portal-app/chamados/novo";
  }

  if (pathname.startsWith("/portal/chamados/") && pathname !== "/portal/chamados/novo") {
    return pathname.replace("/portal/chamados", "/portal-app/chamados");
  }

  if (pathname === "/portal/financeiro") {
    return "/portal-app/financeiro";
  }

  if (pathname === "/portal/documentos") {
    return "/portal-app/documentos";
  }

  if (pathname === "/portal/vendas") {
    return "/portal-app/vendas";
  }

  if (pathname.startsWith("/portal/vendas/")) {
    return pathname.replace("/portal/vendas", "/portal-app/vendas");
  }

  return null;
}

export async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  const role = token?.role as string | undefined;
  const { pathname, searchParams } = req.nextUrl;
  const userAgent = req.headers.get("user-agent") ?? "";
  const isMobile = isMobileUserAgent(userAgent);
  const requestedView = searchParams.get("portal_view");
  const savedView = req.cookies.get(PORTAL_VIEW_COOKIE)?.value;

  // CLIENT users may only access /portal/* and /api/auth/*
  if (role === "CLIENT") {
    if (requestedView === "app" || requestedView === "full") {
      const response = NextResponse.next();
      response.cookies.set(PORTAL_VIEW_COOKIE, requestedView, {
        path: "/",
        sameSite: "lax"
      });
      return response;
    }

    if (!pathname.startsWith("/portal") && !pathname.startsWith("/api/auth")) {
      const destination = isMobile && savedView !== "full" ? "/portal-app/chamados" : "/portal/chamados";
      return NextResponse.redirect(new URL(destination, req.nextUrl));
    }

    if (pathname.startsWith("/portal-app")) {
      return NextResponse.next();
    }

    if (pathname.startsWith("/portal") && isMobile && savedView !== "full") {
      const destination = getPortalAppDestination(pathname);

      if (destination) {
        return NextResponse.redirect(new URL(destination, req.nextUrl));
      }
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
