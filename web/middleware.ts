import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Allow access to marketing pages and public routes
    const { pathname } = req.nextUrl;
    
    // Public routes that don't require auth
    const publicRoutes = [
      "/",
      "/about",
      "/pricing",
      "/contact",
      "/privacy",
      "/terms",
      "/auth",
      "/api/auth",
      "/share",
    ];
    
    // Check if route is public
    const isPublicRoute = publicRoutes.some(route => 
      pathname === route || pathname.startsWith(`${route}/`)
    );
    
    if (isPublicRoute) {
      return NextResponse.next();
    }
    
    // All /app/* routes require authentication
    if (pathname.startsWith("/app")) {
      // If not authenticated, redirect to login with return URL
      if (!req.nextauth.token) {
        const loginUrl = new URL("/auth/signin", req.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
      }
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Public routes
        const publicRoutes = [
          "/",
          "/about",
          "/pricing",
          "/contact",
          "/privacy",
          "/terms",
          "/auth",
          "/api/auth",
          "/share",
        ];
        
        const isPublicRoute = publicRoutes.some(route => 
          pathname === route || pathname.startsWith(`${route}/`)
        );
        
        // Public routes don't need auth
        if (isPublicRoute) {
          return true;
        }
        
        // /app/* routes require auth
        if (pathname.startsWith("/app")) {
          return !!token;
        }
        
        // Default: allow
        return true;
      },
    },
    pages: {
      signIn: "/auth/signin",
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
