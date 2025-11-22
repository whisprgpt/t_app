// src/pages/Dashboard.tsx
// UPDATED: Full Tauri migration with permissions

import {
  Settings,
  Code,
  LogOut,
  Keyboard,
  Shield,
  Mic,
  Monitor,
  FileText,
  Upload,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ScrollArea } from "../components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import { Dialog } from "../components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { cn } from "../lib/utils";
import { supabase } from "../lib/supabase/client";
import desktopIcon from "../../desktopIcon.png";
import { NewFeaturesBanner } from "../components/NewFeaturesBanner";
import { ResponsiveDialog } from "../components/ResponsiveDialogBox";
import { AiDetails, WhisperSettings } from "@/types/types";
// ✨ UPDATED: Import Tauri APIs
import {
  getSettings,
  saveSettings,
  isMac as getTauriPlatform,
} from "@/lib/tauri-settings-api";
import { invoke } from "@tauri-apps/api/tauri";
import { whisprApi } from "@/lib/tauri-whispr-api";
import { open as openUrl } from "@tauri-apps/api/shell";
import {
  checkMicrophonePermission,
  checkScreenCapturePermission,
  openMicrophoneSettings,
  openScreenCaptureSettings,
  checkAllPermissions,
} from "@/lib/tauri-permissions-api";

// Provider mapping
const providerMapping: Record<string, AiDetails> = {
  chatgpt: { name: "ChatGPT", url: "https://chatgpt.com" },
  grok: { name: "Grok", url: "https://grok.com" },
  deepseek: { name: "DeepSeek", url: "https://chat.deepseek.com" },
  gemini: { name: "Gemini", url: "https://gemini.google.com/app" },
  perplexity: { name: "Perplexity", url: "https://www.perplexity.ai" },
};

const ScreenIcon = ({ className }: { className?: string }) => (
  <Monitor className={className} />
);
const MicrophoneIcon = ({ className }: { className?: string }) => (
  <Mic className={className} />
);

const usePreventDoubleClick = (callback: () => void) => {
  const [isClicking, setIsClicking] = useState(false);

  return () => {
    if (isClicking) return;
    setIsClicking(true);
    callback();
    setTimeout(() => setIsClicking(false), 1000);
  };
};

export default function Dashboard() {
  const navigate = useNavigate();
  const isMacPlatform = getTauriPlatform() === "darwin";
  const [scPermissions, setScPermissions] = useState(false);
  const [micPermissions, setMicPermissions] = useState(false);
  const [settings, setSettings] = useState<WhisperSettings | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showPermissionsDialog, setPermissionsDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [appVersionTitle, setAppVersionTitle] = useState<string>("");

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log("📥 Loading dashboard data...");
        const loaded = await getSettings();
        setSettings(loaded);
        setShowBanner(false);

        await handlePermissions();

        // Get app version
        const appVersion = await invoke<string>("get_app_version_command");

        if (isMacPlatform) {
          try {
            const isSigned = await invoke<boolean>("is_app_signed_command");
            setAppVersionTitle(
              `${
                isSigned ? "Standard Edition" : "Lockdown Browser Edition"
              } ${appVersion}`
            );
          } catch {
            setAppVersionTitle(`Standard Edition ${appVersion}`);
          }
        } else {
          setAppVersionTitle(`Windows Standard Edition ${appVersion}`);
        }

        console.log("✅ Dashboard data loaded");
      } catch (error) {
        console.error("❌ Error loading settings:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [isMacPlatform]);

  // ✨ UPDATED: Check permissions using Tauri
  const handlePermissions = async () => {
    if (!isMacPlatform) {
      setMicPermissions(true);
      setScPermissions(true);
      return;
    }

    try {
      const { microphone, screenCapture } = await checkAllPermissions();
      setMicPermissions(microphone);
      setScPermissions(screenCapture);
      console.log(`✅ Permissions: Mic=${microphone}, Screen=${screenCapture}`);
    } catch (error) {
      console.error("❌ Error checking permissions:", error);
      setMicPermissions(false);
      setScPermissions(false);
    }
  };

  const handleDismissBanner = async () => {
    if (!settings) return;
    const updatedSettings = { ...settings, showBanner: false };
    setSettings(updatedSettings);
    setShowBanner(false);
    await saveSettings(updatedSettings);
  };

  const handleClick = usePreventDoubleClick(async () => {
    if (!showPermissionsDialog && isMacPlatform && !hasPermissions) {
      setPermissionsDialog(true);
      return;
    }

    if (!settings) {
      console.error("Settings not loaded");
      return;
    }

    const provider = providerMapping[settings.llm];
    try {
      await whisprApi.launch(provider.url);
    } catch (error) {
      console.error("Failed to launch Whispr mode:", error);
    }
  });

  const handleSignOut = usePreventDoubleClick(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      console.log("Signing out...");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  });

  const handleAppClose = usePreventDoubleClick(async () => {
    try {
      await invoke("close_app_command");
    } catch (error) {
      console.error("Error closing app:", error);
    }
  });

  // ✨ UPDATED: Permission handlers using Tauri
  const handleEnableScreenCapture = async () => {
    try {
      await openScreenCaptureSettings();
      // Recheck after a delay to allow user to grant permission
      setTimeout(async () => {
        const hasPermission = await checkScreenCapturePermission();
        setScPermissions(hasPermission);
      }, 2000);
    } catch (error) {
      console.error("Error opening screen capture settings:", error);
    }
  };

  const handleEnableMicrophone = async () => {
    try {
      await openMicrophoneSettings();
      // Recheck after a delay
      setTimeout(async () => {
        const hasPermission = await checkMicrophonePermission();
        setMicPermissions(hasPermission);
      }, 2000);
    } catch (error) {
      console.error("Error opening microphone settings:", error);
    }
  };

  const hasPermissions = (micPermissions && scPermissions) || !isMacPlatform;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-12 h-12 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white/60">Loading WhisprGPT...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-purple-500/5 to-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      </div>
      <ScrollArea className="h-screen">
        <div className="relative z-10 flex flex-col p-2 sm:p-4 md:p-6">
          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6 md:mb-8"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center">
                <img
                  src={desktopIcon || "/placeholder.svg"}
                  alt="WhisprGPT"
                  className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14"
                />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  WhisprGPT
                </h1>
                <p className="text-xs sm:text-sm md:text-md text-gray-400">
                  {`Your Silent Advantage - ${appVersionTitle}`}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1 sm:gap-2 w-full sm:w-auto">
              {isMacPlatform && (
                <>
                  <Button
                    onClick={handleEnableScreenCapture}
                    variant="outline"
                    size="sm"
                    className={cn(
                      "rounded-lg sm:rounded-xl transition-all duration-300 backdrop-blur-sm text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 flex-1 sm:flex-none min-w-0",
                      scPermissions
                        ? "text-green-500 border-green-500 bg-green-500/10 hover:bg-green-500/20"
                        : "text-red-500 border-red-500 bg-red-500/10 hover:bg-red-500/20"
                    )}
                  >
                    <ScreenIcon className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 flex-shrink-0" />
                    <span className="hidden sm:inline ml-1 sm:ml-2 truncate">
                      Screen Capture
                    </span>
                    <span className="sm:hidden ml-1 truncate">Screen</span>
                  </Button>

                  <Button
                    onClick={handleEnableMicrophone}
                    variant="outline"
                    size="sm"
                    className={cn(
                      "rounded-lg sm:rounded-xl transition-all duration-300 backdrop-blur-sm text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 flex-1 sm:flex-none min-w-0",
                      micPermissions
                        ? "text-green-500 border-green-500 bg-green-500/10 hover:bg-green-500/20"
                        : "text-red-500 border-red-500 bg-red-500/10 hover:bg-red-500/20"
                    )}
                  >
                    <MicrophoneIcon className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 flex-shrink-0" />
                    <span className="hidden sm:inline ml-1 sm:ml-2 truncate">
                      Microphone
                    </span>
                    <span className="sm:hidden ml-1 truncate">Mic</span>
                  </Button>
                </>
              )}
              <Button
                onClick={handleSignOut}
                variant="outline"
                size="sm"
                className="bg-red-900/30 border-red-500/40 text-red-300 hover:bg-red-900/50 hover:text-red-200 rounded-lg sm:rounded-2xl px-2 sm:px-4 py-1 sm:py-2 transition-all duration-300 text-xs sm:text-sm flex-1 sm:flex-none min-w-0"
              >
                <span className="truncate">Logout</span>
              </Button>
              <Button
                onClick={handleAppClose}
                variant="ghost"
                size="icon"
                className="text-white hover:bg-red-500/20 rounded-lg sm:rounded-xl w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0"
              >
                <LogOut className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                <span className="sr-only">Close App</span>
              </Button>
            </div>
          </motion.header>

          {/* Banner */}
          <AnimatePresence>
            {showBanner && (
              <NewFeaturesBanner onDismiss={handleDismissBanner} />
            )}
          </AnimatePresence>

          {/* Main content - same as before, just keeping the Launch card section */}
          <main className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-7xl mx-auto px-1 sm:px-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                {/* Launch Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  whileHover={{ y: -8 }}
                  className="sm:col-span-2 lg:col-span-2 xl:col-span-2"
                >
                  <Card
                    onClick={hasPermissions ? handleClick : undefined}
                    className={cn(
                      "w-full h-full min-h-[200px] sm:min-h-[250px] md:min-h-[300px] rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer relative overflow-hidden group",
                      "bg-gradient-to-br from-black/60 to-gray-900/40 backdrop-blur-xl",
                      hasPermissions
                        ? "border border-purple-500/30 hover:border-purple-400/50 hover:shadow-2xl hover:shadow-purple-500/20"
                        : "border border-red-500/30 hover:border-red-400/50 cursor-not-allowed"
                    )}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute top-4 right-4 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full blur-2xl"></div>
                    <div className="absolute bottom-4 left-4 w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 rounded-full blur-xl"></div>

                    <CardHeader className="flex flex-col items-start gap-3 sm:gap-4 relative z-10 p-4 sm:p-6 lg:p-8">
                      <div
                        className={cn(
                          "w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-2xl flex items-center justify-center transition-all duration-300",
                          hasPermissions
                            ? "bg-gradient-to-r from-purple-500 to-blue-500 group-hover:scale-110"
                            : "bg-gradient-to-r from-red-500 to-orange-500"
                        )}
                      >
                        <Code className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-white" />
                      </div>
                      <div>
                        <CardTitle
                          className={cn(
                            "text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold transition-colors mb-1 sm:mb-2",
                            hasPermissions ? "text-white" : "text-red-400"
                          )}
                        >
                          Launch Whispr Mode
                        </CardTitle>
                        <p
                          className={cn(
                            "text-sm sm:text-base lg:text-lg xl:text-xl transition-colors",
                            hasPermissions ? "text-gray-300" : "text-red-300"
                          )}
                        >
                          Your silent AI assistance
                        </p>
                      </div>
                    </CardHeader>
                    <CardContent className="relative z-10 p-4 sm:p-6 lg:p-8 pt-0">
                      {!hasPermissions && isMacPlatform && (
                        <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                          <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-red-400 flex-shrink-0" />
                          <span className="text-red-300 text-xs sm:text-sm">
                            Permissions required to continue
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Notes */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  whileHover={{ y: -8 }}
                  className="sm:col-span-2 lg:col-span-1 xl:col-span-2"
                >
                  <Card
                    onClick={() => navigate("notes")}
                    className="w-full h-full min-h-[200px] sm:min-h-[250px] md:min-h-[300px] rounded-xl border border-emerald-500/30 hover:border-emerald-400/50 shadow-lg hover:shadow-xl transition-all cursor-pointer relative overflow-hidden group bg-gradient-to-br from-black/60 to-emerald-900/20 backdrop-blur-xl hover:shadow-2xl hover:shadow-emerald-500/20"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-bl from-emerald-500/20 to-transparent rounded-bl-full"></div>
                    <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-emerald-400 rounded-full animate-pulse"></div>

                    <CardHeader className="flex flex-col items-start gap-3 sm:gap-4 relative z-10 p-4 sm:p-6">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <FileText className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                      </div>
                      <CardTitle className="text-lg sm:text-xl lg:text-2xl text-white font-bold">
                        Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="relative z-10 p-4 sm:p-6 pt-0 flex flex-col justify-between flex-1">
                      <div className="space-y-2 sm:space-y-3">
                        <p className="text-sm sm:text-base lg:text-lg text-gray-300">
                          Keep your notes at your fingertips — upload once and
                          access anytime.
                        </p>
                        <p className="text-xs sm:text-sm text-emerald-300 font-medium">
                          Works with PDF & Text files.
                        </p>
                      </div>

                      <div className="mt-4 sm:mt-6 flex items-center gap-2 p-2 sm:p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                        <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 flex-shrink-0" />
                        <span className="text-emerald-300 text-xs sm:text-sm font-medium">
                          Upload upto 5 notes
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Settings */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  whileHover={{ y: -8 }}
                  className="col-span-1"
                >
                  <Card
                    onClick={() => navigate("settings")}
                    className="w-full h-full min-h-[140px] sm:min-h-[160px] rounded-xl border border-gray-700/50 hover:border-gray-600/70 shadow-lg hover:shadow-xl transition-all cursor-pointer relative overflow-hidden group bg-gradient-to-br from-black/60 to-gray-900/40 backdrop-blur-xl hover:shadow-2xl hover:shadow-gray-500/10"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-500/5 to-gray-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <CardHeader className="flex flex-row items-center gap-2 sm:gap-3 relative z-10 p-3 sm:p-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-gray-600 to-gray-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <CardTitle className="text-base sm:text-lg text-white">
                        App Settings
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="relative z-10 p-3 sm:p-4 pt-0">
                      <p className="text-xs sm:text-sm text-gray-300">
                        Configure application settings and preferences.
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Hotkeys */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  whileHover={{ y: -8 }}
                  className="col-span-1"
                >
                  <Card
                    onClick={() => navigate("shortcuts")}
                    className="w-full h-full min-h-[140px] sm:min-h-[160px] rounded-xl border border-blue-500/30 hover:border-blue-400/50 shadow-lg hover:shadow-xl transition-all cursor-pointer relative overflow-hidden group bg-gradient-to-br from-black/60 to-gray-900/40 backdrop-blur-xl hover:shadow-2xl hover:shadow-blue-500/20"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <CardHeader className="flex flex-row items-center gap-2 sm:gap-3 relative z-10 p-3 sm:p-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Keyboard className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <CardTitle className="text-base sm:text-lg text-white">
                        Hotkeys
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="relative z-10 p-3 sm:p-4 pt-0">
                      <p className="text-xs sm:text-sm text-gray-300">
                        View and configure keyboard shortcuts.
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          </main>

          {/* Permissions dialog */}
          <AnimatePresence>
            {isMacPlatform && showPermissionsDialog && (
              <Dialog
                open={showPermissionsDialog}
                onOpenChange={setPermissionsDialog}
              >
                <ResponsiveDialog
                  tone="purple"
                  title="Please Check Permissions"
                  description={
                    <>
                      Please give WhisprGPT permissions to the following:&nbsp;
                      <span className="italic text-white">
                        Screen & System Audio Recording
                      </span>
                      ,&nbsp;
                      <span className="italic text-white">
                        System Audio Recording Only
                      </span>
                      , and&nbsp;
                      <span className="italic text-white">Microphone</span>.
                    </>
                  }
                  footer={
                    <>
                      <Button
                        variant="outline"
                        onClick={() => setPermissionsDialog(false)}
                        className="border-gray-600 text-gray-300 hover:text-white hover:border-gray-500 w-full sm:w-auto"
                      >
                        Let Me Check
                      </Button>
                      <Button
                        onClick={async () => {
                          if (!settings) return;
                          const provider = providerMapping[settings.llm];
                          openUrl(provider.url).catch(console.error);
                          setPermissionsDialog(false);
                        }}
                        className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 w-full sm:w-auto"
                      >
                        Confirmed Given Permissions
                      </Button>
                    </>
                  }
                  footerClassName="!justify-center sm:!justify-center"
                />
              </Dialog>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}
