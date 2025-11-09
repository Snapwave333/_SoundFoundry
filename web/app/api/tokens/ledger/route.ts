import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getLedger } from "@/lib/billing";

export async function GET(req: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const ledger = await getLedger(session.user.id, limit);

    return NextResponse.json(ledger);
  } catch (error) {
    console.error("Error getting ledger:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

