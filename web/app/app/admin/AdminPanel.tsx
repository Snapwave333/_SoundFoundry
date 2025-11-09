"use client";

import { useState } from "react";
import { SessionWithRoles } from "@/lib/auth-helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Props {
  session: SessionWithRoles;
}

export default function AdminPanel({ session }: Props) {
  const [inviteRole, setInviteRole] = useState<"creator" | "developer" | "admin">("developer");
  const [inviteExpires, setInviteExpires] = useState(7);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteResult, setInviteResult] = useState<{ token: string; redeemUrl: string } | null>(null);

  const [assignUserId, setAssignUserId] = useState("");
  const [assignRole, setAssignRole] = useState<"user" | "creator" | "developer" | "admin">("user");
  const [assignLoading, setAssignLoading] = useState(false);

  const handleCreateInvite = async () => {
    setInviteLoading(true);
    try {
      const res = await fetch("/api/admin/invites/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleName: inviteRole,
          expiresInDays: inviteExpires,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create invite");
      }

      setInviteResult(data);
      toast.success("Invite created successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to create invite");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleAssignRole = async () => {
    if (!assignUserId) {
      toast.error("User ID required");
      return;
    }

    setAssignLoading(true);
    try {
      const res = await fetch("/api/admin/roles/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: assignUserId,
          roleName: assignRole,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to assign role");
      }

      toast.success(data.message || "Role assigned successfully!");
      setAssignUserId("");
    } catch (error: any) {
      toast.error(error.message || "Failed to assign role");
    } finally {
      setAssignLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold text-fg mb-8">Admin Panel</h1>

      <div className="space-y-8">
        {/* Create Invite */}
        <section className="border border-border rounded-lg p-6 bg-bg-elevated">
          <h2 className="text-2xl font-semibold text-fg mb-4">Create Invite</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-fg-muted mb-2">Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as any)}
                className="w-full bg-graphite/40 border border-graphite text-steel rounded-md px-3 py-2"
              >
                <option value="creator">Creator</option>
                <option value="developer">Developer</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-fg-muted mb-2">Expires In (days)</label>
              <Input
                type="number"
                value={inviteExpires}
                onChange={(e) => setInviteExpires(parseInt(e.target.value) || 7)}
                min={1}
                max={90}
                className="bg-graphite/40 border-graphite text-steel"
              />
            </div>

            <Button
              onClick={handleCreateInvite}
              disabled={inviteLoading}
              className="bg-resonance hover:bg-resonance/90 text-white"
            >
              {inviteLoading ? "Creating..." : "Create Invite"}
            </Button>

            {inviteResult && (
              <div className="mt-4 p-4 bg-graphite/60 rounded border border-graphite">
                <p className="text-sm text-fg-muted mb-2">Invite Token:</p>
                <code className="block text-xs text-steel mb-4 break-all">{inviteResult.token}</code>
                <p className="text-sm text-fg-muted mb-2">Redeem URL:</p>
                <a
                  href={inviteResult.redeemUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-resonance underline break-all"
                >
                  {inviteResult.redeemUrl}
                </a>
              </div>
            )}
          </div>
        </section>

        {/* Assign Role */}
        <section className="border border-border rounded-lg p-6 bg-bg-elevated">
          <h2 className="text-2xl font-semibold text-fg mb-4">Assign Role</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-fg-muted mb-2">User ID</label>
              <Input
                value={assignUserId}
                onChange={(e) => setAssignUserId(e.target.value)}
                placeholder="UUID"
                className="bg-graphite/40 border-graphite text-steel"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-fg-muted mb-2">Role</label>
              <select
                value={assignRole}
                onChange={(e) => setAssignRole(e.target.value as any)}
                className="w-full bg-graphite/40 border border-graphite text-steel rounded-md px-3 py-2"
              >
                <option value="user">User</option>
                <option value="creator">Creator</option>
                <option value="developer">Developer</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <Button
              onClick={handleAssignRole}
              disabled={assignLoading}
              className="bg-resonance hover:bg-resonance/90 text-white"
            >
              {assignLoading ? "Assigning..." : "Assign Role"}
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

