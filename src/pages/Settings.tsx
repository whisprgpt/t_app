// src/pages/Settings.tsx
// UPDATED: Migrated from Electron to Tauri
import { useState, useEffect, type FormEvent, useRef } from "react";
import { toast, Toaster } from "sonner";
import { ScrollArea } from "../components/ui/scroll-area";
import { usePreventDoubleClick } from "../utils/preventDoubleClick";
import SettingsBackground from "../components/settings/SettingsBackground";
import Header from "../components/settings/Header";
import ModelConfigCard from "../components/settings/ModelConfigCard";
import PromptConfigCard from "../components/settings/PromptConfigCard";
import TemplateWizard from "../components/settings/TemplateWizard";
import Footer from "../components/settings/Footer";
import AppConfigCard from "../components/settings/AppConfigCard";
import {
  getSettings,
  saveSettings as saveTauriSettings,
  resetSettings as resetTauriSettings,
  isMac,
  restartApp,
} from "../lib/tauri-settings-api";
import { WhisperSettings } from "@/types/types";

export default function SettingsPage() {
  const MIN_WIDTH = 400;
  const MIN_HEIGHT = 200;

  // We keep the Settings in local state
  const hasFocusBeenClicked = useRef<boolean>(false);
  const [settings, setSettings] = useState<WhisperSettings | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Button active states for visual feedback
  const [saveActive, setSaveActive] = useState<boolean>(false);
  const [resetActive, setResetActive] = useState<boolean>(false);

  // We also track which LLM is currently selected (for model options)
  const [, setSelectedLlm] = useState<WhisperSettings["llm"]>("chatgpt");

  // Wizard state
  const [wizardOpen, setWizardOpen] = useState<boolean>(false);

  // ✨ UPDATED: Use Tauri platform detection
  const platform: "mac" | "windows" = isMac() === "darwin" ? "mac" : "windows";

  function currentShortcutFor(key: string): string {
    if (!settings) return "";
    const entry = settings.shortcuts[key];
    if (!entry) return "";
    return (
      (entry.customShortcut?.[platform] ?? entry.defaultShortcut[platform]) ||
      ""
    );
  }

  // ✨ UPDATED: Load settings from Tauri on mount
  useEffect(() => {
    (async () => {
      try {
        console.log("📥 Loading settings from Tauri...");
        const loadedSettings = await getSettings();
        console.log("✅ Settings loaded:", loadedSettings);
        setSettings(loadedSettings);
        setSelectedLlm(loadedSettings.llm);
      } catch (error) {
        console.error("❌ Failed to load settings:", error);
        toast.error("Failed to load settings");
      }
    })();
  }, []);

  // 2) Handle changes to the form fields
  function updateSetting<K extends keyof WhisperSettings>(
    name: K,
    value: WhisperSettings[K]
  ) {
    if (!settings) return;
    const newSettings = { ...settings, [name]: value };

    if (name === "focusable")
      hasFocusBeenClicked.current = !hasFocusBeenClicked.current;
    else if (name === "llm") setSelectedLlm(value as WhisperSettings["llm"]);
    setSettings(newSettings);
  }

  // ✨ UPDATED: Save settings using Tauri
  const handleSubmit = usePreventDoubleClick(async (e: FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    const w = settings.screenWidth;
    const h = settings.screenHeight;

    if (w < MIN_WIDTH || h < MIN_HEIGHT) {
      toast.error(`Min screen width: ${MIN_WIDTH}. Min height: ${MIN_HEIGHT}`);
      return;
    }

    try {
      setIsSaving(true);
      setSaveActive(true);

      console.log("💾 Saving settings to Tauri...");
      const success = await saveTauriSettings(settings);

      if (success) {
        console.log("✅ Settings saved successfully");
        toast.success("Settings saved successfully!", {
          duration: 2000,
        });
      } else {
        console.error("❌ Failed to save settings");
        toast.error("Failed to save settings.", {
          duration: 2000,
        });
      }

      // Restart if focusable changed
      if (hasFocusBeenClicked.current) {
        console.log("🔄 Restarting app due to focusable change...");
        await restartApp();
      }
    } catch (error) {
      console.error("❌ Error saving settings:", error);
      toast.error("Error saving settings");
    } finally {
      setIsSaving(false);
      // Reset button active state after a short delay
      setTimeout(() => setSaveActive(false), 300);
    }
  });

  // ✨ UPDATED: Reset settings using Tauri
  const handleReset = usePreventDoubleClick(async () => {
    try {
      setResetActive(true);

      console.log("🔄 Resetting settings to defaults...");
      const reset = await resetTauriSettings();
      console.log("✅ Settings reset:", reset);

      if (reset.focusable === settings?.focusable) {
        hasFocusBeenClicked.current = false;
      } else {
        hasFocusBeenClicked.current = true;
      }

      setSettings(reset);
      setSelectedLlm(reset.llm);
      toast.success("Settings reset to defaults", {
        duration: 2000,
      });
    } catch (error) {
      console.error("❌ Error resetting settings:", error);
      toast.error("Error resetting to defaults");
    } finally {
      setTimeout(() => setResetActive(false), 300);
    }
  });

  if (!settings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-950 flex items-center justify-center relative overflow-hidden">
        {/* Elegant loading background */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-emerald-400/10 rounded-full blur-2xl animate-pulse delay-500"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center space-y-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-amber-400/50 rounded-full animate-spin animate-reverse"></div>
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-300 to-amber-300 bg-clip-text text-transparent">
              Loading Settings
            </h2>
            <p className="text-slate-400 mt-2">
              Preparing your configuration...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950/50 to-slate-950 relative overflow-hidden">
      {/* Sophisticated background pattern */}
      <SettingsBackground />
      <Toaster
        position="bottom-right"
        toastOptions={{
          className:
            "bg-slate-800/95 backdrop-blur-lg border border-emerald-500/20 text-emerald-100",
        }}
      />

      <ScrollArea className="h-screen relative z-10">
        <div className="p-4 md:p-8">
          <div className="container mx-auto max-w-4xl">
            {/* Simplified Header - matching shortcuts page style */}
            <Header />

            <form onSubmit={handleSubmit} className="space-y-6">
              <ModelConfigCard
                settings={settings}
                updateSettings={updateSetting}
              />
              <PromptConfigCard
                onOpenWizard={() => setWizardOpen(true)}
                onPromptChange={(v: string) => updateSetting("systemPrompt", v)}
                systemPrompt={settings.systemPrompt}
                retryPrompt={settings.retryPrompt}
                retryShortcut={currentShortcutFor("retry-prompt")}
                onRetryChange={(v: string) => updateSetting("retryPrompt", v)}
              />
              <AppConfigCard
                onScreenWidth={(v) => updateSetting("screenWidth", v)}
                onScreenHeight={(v) => updateSetting("screenHeight", v)}
                onOpacity={(v) => updateSetting("opacity", v)}
                onFocus={(v) => updateSetting("focusable", v)}
                settings={settings}
              />
              <Footer
                isSaving={isSaving}
                resetActive={resetActive}
                saveActive={saveActive}
                handleReset={handleReset}
              />
            </form>
            <TemplateWizard
              open={wizardOpen}
              onOpenChange={(v: boolean) => setWizardOpen(v)}
              onPrompt={(v: string) => updateSetting("systemPrompt", v)}
            />
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}