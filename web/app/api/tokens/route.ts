/**
 * Design tokens API endpoint
 * Returns JSON export for design tools (read-only)
 */

import { NextResponse } from "next/server";
import tokensExport from "@/lib/design-tokens-export";

export async function GET() {
  return new NextResponse(tokensExport, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

