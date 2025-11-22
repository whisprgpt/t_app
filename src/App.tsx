// src/App.tsx
// FIXED: Added Whispr mode event listeners

import { Routes, Route, HashRouter, useNavigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import SettingsPage from "./pages/Settings";
// import SignInForm from "./pages/Authentication";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase/client.ts";
import SubscribePage from "./pages/Subscription";
import { StripeSubscription } from "@/types/types";
import ShortcutsPage from "./pages/Shortcuts";
import NotesPage from "./pages/Notes";
import { listenForAuthCallback } from "./lib/tauri-auth-api";
import { whisprApi } from "./lib/tauri-whispr-api";

// Separate component to use useNavigate hook
function AppContent() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<StripeSubscription | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(true);

  // Function to fetch user and subscription data
  const fetchUserAndSubscription = async () => {
    setLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setUser(null);
      setLoading(false);
      return { user: null, subscription: null };
    }

    setUser(session.user);

    const { data: subscriptionData, error } = await supabase
      .from("stripe_subscriptions")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching subscription:", error.message);
      setLoading(false);
      return { user: session.user, subscription: null };
    }

    const activeSubscription = subscriptionData?.find(
      (sub) => sub.status === "active"
    );

    const subscriptionToUse =
      activeSubscription ||
      (subscriptionData && subscriptionData.length > 0
        ? subscriptionData[0]
        : null);

    const subscription: StripeSubscription | null = subscriptionToUse
      ? {
          id: subscriptionToUse.id,
          status: subscriptionToUse.status,
        }
      : null;

    setSubscription(subscription);
    setLoading(false);
    return { user: session.user, subscription };
  };

  // Real-time subscription updates
  useEffect(() => {
    if (!user) return;

    const subscriptionChannel = supabase
      .channel("subscription-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "stripe_subscriptions",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("Real-time subscription update:", payload);
          fetchUserAndSubscription();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscriptionChannel);
    };
  }, [user]);

  // ============================================================================
  // ✨ NEW: Listen for Whispr mode events
  // ============================================================================
  useEffect(() => {
    let unsubLaunch: (() => void) | null = null;
    let unsubDashboard: (() => void) | null = null;

    console.log("🎧 Setting up Whispr mode event listeners...");

    // Listen for Whispr mode launch
    whisprApi
      .onLaunchWhisprMode(({ url }) => {
        console.log("🚀 Whispr mode launch event received:", url);
        navigate("/whispr", { state: { url } });
      })
      .then((unsub) => {
        unsubLaunch = unsub;
        console.log("✅ Whispr launch listener ready");
      })
      .catch((err) => {
        console.error("❌ Failed to set up Whispr launch listener:", err);
      });

    // Listen for dashboard navigation (Ctrl+B)
    whisprApi
      .onNavigateToDashboard(() => {
        console.log("🏠 Dashboard navigation event received");
        navigate("/");
      })
      .then((unsub) => {
        unsubDashboard = unsub;
        console.log("✅ Dashboard navigation listener ready");
      })
      .catch((err) => {
        console.error("❌ Failed to set up dashboard listener:", err);
      });

    return () => {
      console.log("🧹 Cleaning up Whispr mode listeners");
      if (unsubLaunch) unsubLaunch();
      if (unsubDashboard) unsubDashboard();
    };
  }, [navigate]);

  // ============================================================================
  // Auth callback listener
  // ============================================================================
  useEffect(() => {
    let unlisten: (() => void) | null = null;

    const setupAuthListener = async () => {
      console.log("🔐 Setting up Tauri auth listener...");

      try {
        unlisten = await listenForAuthCallback(async (code: string) => {
          console.log("📥 Received auth callback with code:", code);

          try {
            if (!code) {
              console.error("❌ No code in callback");
              return;
            }

            const { error } = await supabase.auth.exchangeCodeForSession(code);

            if (error) {
              console.error("❌ Error exchanging code for session:", error);
            } else {
              console.log("✅ Session exchanged successfully");
              await fetchUserAndSubscription();
            }
          } catch (error) {
            console.error("❌ Error in auth callback:", error);
          }
        });

        console.log("✅ Auth listener setup complete");
      } catch (error) {
        console.error("❌ Failed to setup auth listener:", error);
      }
    };

    setupAuthListener();

    return () => {
      if (unlisten) {
        console.log("🧹 Cleaning up auth listener");
        unlisten();
      }
    };
  }, []);

  // Fetch user and subscription on initial load
  useEffect(() => {
    fetchUserAndSubscription();
  }, []);

  // Listen for signout events
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_OUT") {
          setUser(null);
          setSubscription(null);
        } else if (session) {
          setUser(session.user);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
          <p className="text-white text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login if no user
  // if (!user) {
  //   return <SignInForm />;
  // }

  // Show subscription page if no active subscription
  if (user && (!subscription || subscription.status !== "active")) {
    return <SubscribePage user={user} />;
  }

  // Main app routes
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/shortcuts" element={<ShortcutsPage />} />
      <Route path="/notes" element={<NotesPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
}
