import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/auth/signin",
  },
});

export const config = {
  matcher: ["/library/:path*", "/api/tracks/:path*", "/api/credits/:path*"],
};

