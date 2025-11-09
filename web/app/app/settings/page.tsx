"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api/client";
import { usePurchaseCredits } from "@/lib/api/hooks";
import { Coins, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { data: creditsInfo, isLoading } = useQuery({
    queryKey: ["credits"],
    queryFn: () => apiClient.getCredits(),
  });

  const purchaseMutation = usePurchaseCredits();

  const handlePurchase = (credits: number) => {
    purchaseMutation.mutate(credits);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-semibold mb-2 text-forge-white">Settings</h1>
        <p className="text-forge-white/70">
          Manage your account, credits, and preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Credits Section */}
        <Card className="bg-forge-gray panel-shadow border-forge-gray/50">
          <CardHeader>
            <CardTitle className="text-forge-white flex items-center gap-2">
              <Coins className="h-5 w-5 text-forge-amber" />
              Credits
            </CardTitle>
            <CardDescription className="text-forge-white/70">
              Purchase credits to generate music tracks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-forge-white/70" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-forge-white/80">Remaining Credits</span>
                    <span className="text-2xl font-semibold text-forge-amber">
                      {creditsInfo?.credits || 0}
                    </span>
                  </div>
                  {creditsInfo?.plan && (
                    <div className="flex items-center justify-between">
                      <span className="text-forge-white/80">Plan</span>
                      <span className="text-forge-white capitalize">{creditsInfo.plan}</span>
                    </div>
                  )}
                </div>

                {creditsInfo?.pricing_breakdown?.credit_packs && (
                  <div className="space-y-4 pt-4 border-t border-forge-gray">
                    <h3 className="text-lg font-semibold text-forge-white">
                      Purchase Credits
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(creditsInfo.pricing_breakdown.credit_packs).map(
                        ([packName, pack]) => (
                          <Card
                            key={packName}
                            className="bg-forge-black/50 border-forge-gray/50"
                          >
                            <CardContent className="pt-6">
                              <div className="space-y-3">
                                <div>
                                  <h4 className="font-semibold text-forge-white capitalize">
                                    {packName.replace(/_/g, " ")}
                                  </h4>
                                  <p className="text-sm text-forge-white/70">
                                    {pack.credits} credits
                                  </p>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xl font-bold text-forge-amber">
                                    ${pack.price.toFixed(2)}
                                  </span>
                                  <Button
                                    onClick={() => handlePurchase(pack.credits)}
                                    disabled={purchaseMutation.isPending}
                                    className="bg-forge-amber text-forge-black hover:brightness-110"
                                    aria-label={`Purchase ${pack.credits} credits`}
                                  >
                                    {purchaseMutation.isPending ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      "Buy"
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      )}
                    </div>
                  </div>
                )}

                {!creditsInfo?.pricing_breakdown?.credit_packs && (
                  <div className="text-center py-8 text-forge-white/70">
                    <p>Credit packs not available at this time.</p>
                    <p className="text-sm mt-2">
                      Contact support to purchase credits.
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Account Section */}
        <Card className="bg-forge-gray panel-shadow border-forge-gray/50">
          <CardHeader>
            <CardTitle className="text-forge-white">Account</CardTitle>
            <CardDescription className="text-forge-white/70">
              Account settings and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-forge-white/80">Account Status</span>
                <span className="text-forge-white capitalize">
                  {creditsInfo?.plan || "Free"}
                </span>
              </div>
              {/* Add more account settings here */}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

