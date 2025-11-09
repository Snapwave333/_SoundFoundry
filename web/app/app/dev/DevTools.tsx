"use client";

import { SessionWithRoles } from "@/lib/auth-helpers";
import { Button } from "@/components/ui/button";

interface Props {
  session: SessionWithRoles;
}

export default function DevTools({ session }: Props) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold text-fg mb-8">Developer Tools</h1>

      <div className="space-y-6">
        <section className="border border-border rounded-lg p-6 bg-bg-elevated">
          <h2 className="text-2xl font-semibold text-fg mb-4">Debugging</h2>
          <p className="text-fg-muted mb-4">Internal debugging tools and diagnostics.</p>
          <div className="space-y-2">
            <Button variant="outline" className="bg-graphite/40 border-graphite text-steel">
              View System Logs
            </Button>
            <Button variant="outline" className="bg-graphite/40 border-graphite text-steel">
              Database Queries
            </Button>
            <Button variant="outline" className="bg-graphite/40 border-graphite text-steel">
              API Health Check
            </Button>
          </div>
        </section>

        <section className="border border-border rounded-lg p-6 bg-bg-elevated">
          <h2 className="text-2xl font-semibold text-fg mb-4">Session Info</h2>
          <div className="space-y-2 text-sm">
            <p><span className="text-fg-muted">User ID:</span> <code className="text-steel">{session.user.id}</code></p>
            <p><span className="text-fg-muted">Email:</span> <code className="text-steel">{session.user.email}</code></p>
            <p><span className="text-fg-muted">Roles:</span> <code className="text-steel">{session.user.roles.join(", ")}</code></p>
          </div>
        </section>

        {session.user.roles.includes("admin") && (
          <section className="border border-border rounded-lg p-6 bg-bg-elevated">
            <h2 className="text-2xl font-semibold text-fg mb-4">Admin Access</h2>
            <p className="text-fg-muted mb-4">You have admin privileges.</p>
            <Button asChild className="bg-resonance hover:bg-resonance/90 text-white">
              <a href="/app/admin">Go to Admin Panel</a>
            </Button>
          </section>
        )}
      </div>
    </div>
  );
}

