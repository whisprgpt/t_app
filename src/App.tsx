// src/App.tsx
// UPDATED: Migrated from Electron to Tauri auth

import { Routes, Route, HashRouter } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import SettingsPage from "./pages/Settings";
import SignInForm from "./pages/Authentication";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase/client.ts";
import SubscribePage from "./pages/Subscription";
import { StripeSubscription } from "@/types/types";
import ShortcutsPage from "./pages/Shortcuts";
import NotesPage from "./pages/Notes";
import { listenForAuthCallback } from "./lib/tauri-auth-api";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<StripeSubscription | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(true);

  // Function to fetch user and subscription data
  const fetchUserAndSubscription = async () => {
    setLoading(true);

    // Get the current session
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setUser(null);
      setLoading(false);
      return { user: null, subscription: null };
    }
    setUser(session.user);

    // Fetch all subscriptions for the user, ordered by created_at descending
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

    // Find an active subscription if one exists
    const activeSubscription = subscriptionData?.find(
      (sub) => sub.status === "active"
    );

    // If there is no active subscription, fallback to the most recent one
    const subscriptionToUse =
      activeSubscription ||
      (subscriptionData && subscriptionData.length > 0
        ? subscriptionData[0]
        : null);

    // Map the record to your StripeSubscription type
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

  // Set up a real-time subscription for subscription changes
  useEffect(() => {
    // Only subscribe if we have a logged-in user
    if (!user) return;

    // Subscribe to all events (INSERT, UPDATE, DELETE) for the user's subscription row
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
          // For simplicity, re-fetch the subscription data on any change.
          fetchUserAndSubscription();
        }
      )
      .subscribe();

    // Cleanup the real-time channel on unmount or when user changes
    return () => {
      supabase.removeChannel(subscriptionChannel);
    };
  }, [user]);

  // ============================================================================
  // ✨ UPDATED: Auth callback for Tauri (replaces Electron IPC)
  // ============================================================================
  useEffect(() => {
    let unlisten: (() => void) | null = null;

    const setupAuthListener = async () => {
      console.log("🔐 Setting up Tauri auth listener...");

      try {
        // Listen for auth callback events from Tauri
        unlisten = await listenForAuthCallback(async (code: string) => {
          console.log("📥 Received auth callback with code:", code);

          try {
            if (!code) {
              console.error("❌ No code in callback");
              return;
            }

            // Exchange code for Supabase session
            const { error } = await supabase.auth.exchangeCodeForSession(code);

            if (error) {
              console.error("❌ Error exchanging code for session:", error);
            } else {
              console.log("✅ Session exchanged successfully");
              // Fetch user and subscription after successful login
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

    // Cleanup
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

  // Display a loading spinner while fetching data
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
  if (!user) {
    return <SignInForm />;
  }

  // Show subscription page if no active subscription
  if (user && (!subscription || subscription.status !== "active")) {
    return <SubscribePage user={user} />;
  }

  // Show main app if logged in with active subscription
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/shortcuts" element={<ShortcutsPage />} />
        <Route path="/notes" element={<NotesPage />} />
      </Routes>
    </HashRouter>
  );
}