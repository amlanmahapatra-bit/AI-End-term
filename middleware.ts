import { NextResponse, type NextRequest } from "next/server";

// Basic auth for the dashboard only. API routes have their own token / signed-link auth.
export function middleware(req: NextRequest) {
  // DASHBOARD_PUBLIC=1 turns the password off (e.g. for a demo). Remove it to lock the dashboard again.
  if (process.env.DASHBOARD_PUBLIC === "1") return NextResponse.next();
  const pw = process.env.DASHBOARD_PASSWORD;
  if (!pw) return new NextResponse("DASHBOARD_PASSWORD not set", { status: 503 });
  const header = req.headers.get("authorization") ?? "";
  if (header.startsWith("Basic ")) {
    const [user, ...rest] = atob(header.slice(6)).split(":");
    if (user === "aangan" && rest.join(":") === pw) return NextResponse.next();
  }
  return new NextResponse("Authentication required", { status: 401, headers: { "WWW-Authenticate": 'Basic realm="Aangan dashboard"' } });
}

export const config = { matcher: ["/"] };
