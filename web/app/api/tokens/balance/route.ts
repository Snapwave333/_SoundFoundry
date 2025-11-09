import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getBalance } from "@/lib/billing";

export async function GET(req: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const balance = await getBalance(session.user.id);

    return NextResponse.json({ balance });
  } catch (error) {
    console.error("Error getting balance:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

