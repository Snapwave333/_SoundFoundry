import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import RedeemInviteForm from "./RedeemInviteForm";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: Props) {
  const { token } = await params;
  const session = await getServerSession(authOptions);

  // Check if invite is valid
  const invite = await db.invite.findUnique({
    where: { token },
    include: { role: true },
  });

  if (!invite) {
    redirect("/auth/signin?error=InvalidInvite");
  }

  if (invite.used) {
    redirect("/auth/signin?error=InviteUsed");
  }

  if (invite.expiresAt < new Date()) {
    redirect("/auth/signin?error=InviteExpired");
  }

  // If not signed in, redirect to signup with invite token
  if (!session?.user) {
    redirect(`/auth/signup?invite=${token}`);
  }

  // Check if user already has this role
  const existingRole = await db.userRole.findUnique({
    where: {
      userId_roleId: {
        userId: session.user.id,
        roleId: invite.roleId,
      },
    },
  });

  if (existingRole) {
    redirect("/app?message=RoleAlreadyAssigned");
  }

  return (
    <main className="min-h-screen bg-forgeBlack text-steel flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-graphite/60 bg-graphite/60 backdrop-blur p-8">
        <h1 className="text-2xl font-semibold text-steel mb-4 text-center">
          Accept Invite
        </h1>
        <p className="text-sm text-steel/70 mb-6 text-center">
          You've been invited to join as <span className="font-semibold text-amber">{invite.role.name}</span>
        </p>
        <RedeemInviteForm token={token} roleName={invite.role.name} />
      </div>
    </main>
  );
}

