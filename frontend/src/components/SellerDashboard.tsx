import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useUserStore } from "../lib/userStore";
import type { User } from "../lib/userStore";

interface StripeAccount {
  id: string;
  verified: boolean;
  payouts_enabled: boolean;
  charges_enabled: boolean;
}

// Extend User with getIdToken for local use
interface FirebaseUserWithToken extends User {
  getIdToken?: () => Promise<string>;
}

export function SellerDashboard() {
  const user = useUserStore(
    (state: { user: FirebaseUserWithToken | null }) => state.user
  );
  const [stripeAccount, setStripeAccount] = useState<StripeAccount | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchStripeAccountStatus();
    }
  }, [user]);

  const fetchStripeAccountStatus = async () => {
    try {
      const token = await user?.getIdToken?.();
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/stripe/account`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStripeAccount(data);
      }
    } catch (error) {
      console.error("Failed to fetch Stripe account status:", error);
    }
  };

  const handleConnectStripe = async () => {
    setLoading(true);
    try {
      const token = await user?.getIdToken?.();
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/stripe/connect`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const { accountLinkUrl } = await response.json();
        window.location.href = accountLinkUrl;
      } else {
        console.error("Failed to create Stripe account link");
      }
    } catch (error) {
      console.error("Error connecting to Stripe:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">
            Please log in to access the seller dashboard
          </h1>
          <Button onClick={() => (window.location.href = "/")}>
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">
            Seller Dashboard
          </h1>

          <div className="grid gap-6">
            {/* Stripe Connect Section */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                Stripe Account Connection
              </h2>

              {!stripeAccount ? (
                <div>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Connect your Stripe account to start receiving payments for
                    your memes.
                  </p>
                  <Button
                    onClick={handleConnectStripe}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? "Connecting..." : "Connect Stripe Account"}
                  </Button>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className={`w-4 h-4 rounded-full ${
                        stripeAccount.verified
                          ? "bg-green-500"
                          : "bg-yellow-500"
                      }`}
                    ></div>
                    <span className="text-gray-900 dark:text-white">
                      Account Status:{" "}
                      {stripeAccount.verified
                        ? "Verified"
                        : "Pending Verification"}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <p>
                      Payouts Enabled:{" "}
                      {stripeAccount.payouts_enabled ? "Yes" : "No"}
                    </p>
                    <p>
                      Charges Enabled:{" "}
                      {stripeAccount.charges_enabled ? "Yes" : "No"}
                    </p>
                  </div>

                  {!stripeAccount.verified && (
                    <Button
                      onClick={handleConnectStripe}
                      disabled={loading}
                      className="mt-4 bg-orange-600 hover:bg-orange-700"
                    >
                      Complete Account Setup
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Dashboard Stats */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                  Total Sales
                </h3>
                <p className="text-3xl font-bold text-green-600">$0</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  This month
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                  Items Listed
                </h3>
                <p className="text-3xl font-bold text-blue-600">0</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Active listings
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                  Pending Payouts
                </h3>
                <p className="text-3xl font-bold text-purple-600">$0</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Next payout
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                Quick Actions
              </h2>
              <div className="flex gap-4">
                <Button
                  disabled={!stripeAccount?.verified}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Add New Meme
                </Button>
                <Button variant="outline">View Analytics</Button>
                <Button variant="outline">Manage Listings</Button>
              </div>

              {!stripeAccount?.verified && (
                <p className="text-sm text-orange-600 dark:text-orange-400 mt-2">
                  Complete Stripe account setup to start selling
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
