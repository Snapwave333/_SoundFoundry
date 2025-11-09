import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireRole } from "@/lib/auth-helpers";
import DevTools from "./DevTools";

export default async function DevPage() {
  try {
    const session = await requireRole(["developer", "admin"]);
    return <DevTools session={session} />;
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      redirect("/app?error=unauthorized");
    }
    throw error;
  }
}

