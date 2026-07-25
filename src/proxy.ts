import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/session";

// En Next.js 16 esto se llama "Proxy" (antes "Middleware"). Refresca la
// sesion de Supabase y protege /erp en cada request.
export default async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ["/erp/:path*", "/login", "/login/:path*"],
};
