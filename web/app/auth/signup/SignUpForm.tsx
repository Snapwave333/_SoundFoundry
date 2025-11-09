"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function SignUpForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Sign up failed");
        setLoading(false);
        return;
      }

      // Auto sign in after signup
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.ok) {
        toast.success("Account created successfully!");
        
        // If there's an invite token, redeem it
        if (inviteToken) {
          try {
            const redeemRes = await fetch("/api/auth/redeem", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token: inviteToken }),
            });

            if (redeemRes.ok) {
              const redeemData = await redeemRes.json();
              toast.success(redeemData.message || "Invite redeemed!");
            }
          } catch (error) {
            // Invite redemption failed, but account is created
            console.error("Failed to redeem invite:", error);
          }
        }
        
        router.push("/app");
        router.refresh();
      } else {
        toast.error("Account created but sign in failed. Please sign in manually.");
        router.push("/auth/signin");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-steel mb-2">
          Email
        </label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="bg-graphite/40 border-graphite text-steel focus:border-resonance focus:ring-resonance"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-steel mb-2">
          Password
        </label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
          minLength={8}
          className="bg-graphite/40 border-graphite text-steel focus:border-resonance focus:ring-resonance"
          placeholder="••••••••"
        />
        <p className="mt-1 text-xs text-steel/50">At least 8 characters</p>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-steel mb-2">
          Confirm Password
        </label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          autoComplete="new-password"
          className="bg-graphite/40 border-graphite text-steel focus:border-resonance focus:ring-resonance"
          placeholder="••••••••"
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-resonance hover:bg-resonance/90 text-white"
      >
        {loading ? "Creating account..." : "Sign Up"}
      </Button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-graphite"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-graphite/60 px-2 text-steel/50">Or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => signIn("google", { callbackUrl: "/app" })}
          className="bg-graphite/40 border-graphite text-steel hover:bg-graphite/60"
        >
          Google
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => signIn("github", { callbackUrl: "/app" })}
          className="bg-graphite/40 border-graphite text-steel hover:bg-graphite/60"
        >
          GitHub
        </Button>
      </div>
    </form>
  );
}

