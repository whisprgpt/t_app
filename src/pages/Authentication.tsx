// src/pages/Authentication.tsx
// UPDATED: Migrated from Electron to Tauri

import { useState } from "react";
import { supabase } from "../lib/supabase/client";
import desktopIcon from "../../desktopIcon.png";
import { motion } from "framer-motion";
import { openExternalUrl } from "../lib/tauri-auth-api";

export default function SignInForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  async function signInWithGoogle() {
    setIsLoading(true);
    setError("");

    try {
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: "whisprgpt://callback",
          skipBrowserRedirect: true,
        },
      });

      if (oauthError) {
        console.error(
          "Error during Google OAuth:",
          oauthError.message,
          oauthError.name
        );
        setError("Failed to sign in with Google. Please try again.");
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setIsLoading(false);
        return;
      }

      if (data?.url) {
        console.log("🔗 Opening OAuth URL:", data.url);

        // ✨ UPDATED: Use Tauri command instead of window.auth.openExternal
        await openExternalUrl(data.url);

        console.log("✅ OAuth URL opened in browser");
        // Keep loading state - user needs to complete OAuth
        // Loading will end when auth callback is received
      } else {
        setError("No OAuth URL returned");
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Unexpected error during sign in:", err);
      setError("An unexpected error occurred. Please try again.");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center">
      {/* Background decorative elements */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl -z-10"></div>

      <div className="w-full max-w-md space-y-8 p-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full flex justify-center items-center mb-6 sm:mb-8 md:mb-10"
          >
            <div className="flex items-center">
              <div className="w-24 h-24 rounded-xl flex items-center justify-center">
                <img
                  src={desktopIcon || "/placeholder.svg"}
                  alt="WhisprGPT"
                  className="w-24 h-24"
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white bg-clip-text">
                  WhisprGPT
                </h1>
                <p className="text-md ml-8 mt-4 font-semibold text-white-400">
                  ~ Your Silent Advantage
                </p>
              </div>
            </div>
          </motion.header>

          <div className="w-full max-w-sm space-y-6">
            <motion.button
              animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
              transition={{ duration: 0.5 }}
              onClick={signInWithGoogle}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-black/40 backdrop-blur-sm text-white rounded-xl border border-gray-800 hover:border-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {isLoading ? (
                <>
                  <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  Opening browser...
                </>
              ) : (
                <>
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Continue with Google
                </>
              )}
            </motion.button>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg bg-red-500/10 border border-red-500/20"
              >
                <p className="text-sm text-red-400 text-center">{error}</p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}