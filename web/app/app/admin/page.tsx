import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireRole } from "@/lib/auth-helpers";
import AdminPanel from "./AdminPanel";

export default async function AdminPage() {
  try {
    const session = await requireRole(["admin"]);
    return <AdminPanel session={session} />;
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      redirect("/app?error=unauthorized");
    }
    throw error;
  }
}

