// src/pages/Subscription.tsx
// UPDATED: Migrated from Electron to Tauri

import { useState, useRef } from "react";
import { supabase } from "../lib/supabase/client";
import { SubscribePageProps } from "@/types/ui";
import { openCheckoutPortal } from "../lib/tauri-auth-api";
import { motion } from "framer-motion";

export default function SubscribePage({ user }: SubscribePageProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // ✨ UPDATED: Detect platform using navigator (Tauri-compatible)
  const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  const key = isMac ? "⌘" : "Ctrl";

  console.log("User:", user);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error(`Error signing out: ${error}`);
        throw error;
      }
    } catch (err) {
      console.error("Error signing out:", err);
      setError("Failed to sign out. Please try again.");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleSubscribe = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log("🛒 Opening checkout portal for user:", user.id);

      // ✨ UPDATED: Use Tauri command instead of window.auth.openCheckoutPortal
      const result = await openCheckoutPortal(user.id);

      if (!result.success) {
        console.error("❌ Failed to open checkout portal:", result.error);
        throw new Error(result.error);
      }

      console.log("✅ Checkout portal opened successfully");
    } catch (err) {
      console.error("Error opening subscription portal:", err);
      setError("Failed to open subscription portal. Please try again");
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen flex items-center justify-center bg-gray-900"
    >
      <div className="w-full max-w-md px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold text-white">
            Welcome to WhisprGPT
          </h2>
          <p className="text-white text-sm mt-2 mb-6">
            To continue using WhisprGPT, you'll need to subscribe
          </p>

          {/* Keyboard Shortcuts */}
          <div className="rounded-xl p-3 mb-6 bg-gray-800">
            <div className="flex items-center justify-between text-white text-xs">
              <div className="flex items-center gap-2">
                <span className="text-white">Toggle Visibility</span>
                <div className="flex gap-1">
                  <kbd className="border border-white/[0.1] rounded-md px-1.5 py-1 text-[10px] leading-none text-white">
                    {key}
                  </kbd>
                  <kbd className="border border-white/[0.1] rounded-md px-1.5 py-1 text-[10px] leading-none text-white">
                    H
                  </kbd>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white">Quit App</span>
                <div className="flex gap-1">
                  <kbd className="border border-white/[0.1] rounded-md px-1.5 py-1 text-[10px] leading-none text-white">
                    {key}
                  </kbd>
                  <kbd className="border border-white/[0.1] rounded-md px-1.5 py-1 text-[10px] leading-none text-white">
                    {isMac ? "Q" : "W"}
                  </kbd>
                </div>
              </div>
            </div>
          </div>

          {/* Subscribe Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubscribe}
            disabled={isLoading}
            className="w-full px-4 py-3 bg-white text-black rounded-xl font-medium hover:bg-white/90 transition-colors flex items-center justify-center gap-2 mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                Opening checkout...
              </>
            ) : (
              <>
                Subscribe
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </>
            )}
          </motion.button>

          {/* Logout Section */}
          <div className="border-t border-white/[0.06] pt-4">
            <button
              onClick={handleSignOut}
              className="flex items-center justify-center gap-1.5 text-[11px] text-red-400/80 hover:text-red-400 transition-colors w-full group"
            >
              <div className="w-3.5 h-3.5 flex items-center justify-center opacity-60 group-hover:opacity-100 transition-opacity">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-full h-full"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </div>
              Log Out
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20"
            >
              <p className="text-xs text-red-400">{error}</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}