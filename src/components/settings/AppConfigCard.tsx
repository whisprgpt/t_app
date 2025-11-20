import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Dialog, DialogTrigger } from "../ui/dialog";
import { Crown, Gem, Hexagon, Monitor, Star } from "lucide-react";
import { Switch } from "../ui/switch";
import { Button } from "../ui/button";
import { ResponsiveDialog } from "../ResponsiveDialogBox";
import { WhisperSettings } from "@/types/types";
import {
  deleteCache,
  restartApp,
  setOpacity,
  isMac as getTauriPlatform,
} from "@/lib/tauri-settings-api";
import { resetPermissions } from "@/lib/tauri-permissions-api";

type AppConfigProps = {
  onScreenWidth: (v: number) => void;
  onScreenHeight: (v: number) => void;
  onOpacity: (v: number) => void;
  onFocus: (v: boolean) => void;
  settings: WhisperSettings;
};
export default function AppConfigCard({
  onScreenWidth,
  onScreenHeight,
  onOpacity,
  onFocus,
  settings,
}: AppConfigProps) {
  const isMac = getTauriPlatform() === "darwin";
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [focusDialog, setFocusDialog] = useState<boolean>(false);
  const [resetDialog, setResetDialog] = useState<boolean>(false);

  const handleFocusToggle = (next: boolean) => {
    // if we're going from on -> off, show the warning)
    if (!next && settings.focusable) setFocusDialog(true);
    onFocus(next);
  };

  const handleDeleteCache = async () => {
    try {
      const result = await deleteCache();
      if (result.status === "success") {
        toast.success(result.message, { duration: 2000 });
      } else {
        toast.error(result.message, { duration: 2000 });
      }
    } catch (error) {
      console.error("Error clearing cache:", error);
      toast.error("An error occurred while clearing cache");
    }
  };

  return (
    <Card className="group relative overflow-hidden bg-gradient-to-br from-slate-900/80 to-amber-950/20 backdrop-blur-xl border border-emerald-500/30 rounded-3xl shadow-2xl hover:shadow-emerald-500/20 transition-all duration-500">
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-amber-500/20 to-transparent rounded-tl-full"></div>
      <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-amber-400 rounded-full animate-pulse delay-700"></div>

      <CardHeader className="pb-4 relative z-10">
        <CardTitle className="flex items-center gap-3 text-emerald-100 text-xl font-bold">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl blur-md opacity-60"></div>
            <div className="relative p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl">
              <Monitor className="h-6 w-6 text-white" />
            </div>
          </div>
          <span>Application Settings</span>
          <div className="ml-auto">
            <Gem className="h-5 w-5 text-emerald-400 animate-pulse delay-500" />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 relative z-10">
        {/* Screen Dimensions */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-base font-semibold text-emerald-200">
            <Hexagon className="h-4 w-4 text-emerald-400" />
            Display Dimensions
          </label>
          <div className="flex items-center gap-3 max-w-md">
            <div className="flex-1 relative">
              <input
                type="number"
                id="screenWidth"
                name="screenWidth"
                value={settings.screenWidth}
                onChange={(e) => onScreenWidth(Number(e.target.value))}
                className="w-full h-12 px-4 py-3 bg-slate-800/60 backdrop-blur-lg text-emerald-100 border border-emerald-500/30 rounded-2xl placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-400 transition-all duration-300 text-center"
                placeholder="Width"
              />
              <div className="absolute top-3 right-3">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
              </div>
            </div>
            <div className="text-emerald-200 font-bold text-xl px-2">×</div>
            <div className="flex-1 relative">
              <input
                type="number"
                id="screenHeight"
                name="screenHeight"
                value={settings.screenHeight}
                onChange={(e) => onScreenHeight(Number(e.target.value))}
                className="w-full h-12 px-4 py-3 bg-slate-800/60 backdrop-blur-lg text-emerald-100 border border-emerald-500/30 rounded-2xl placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-400 transition-all duration-300 text-center"
                placeholder="Height"
              />
              <div className="absolute top-3 right-3">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
              </div>
            </div>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            Configure display resolution in pixels.
          </p>
        </div>

        {/* Opacity Control */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-base font-semibold text-emerald-200">
            <Hexagon className="h-4 w-4 text-emerald-400" />
            Window Transparency
          </label>
          <div className="p-4 bg-gradient-to-r from-slate-800/40 to-emerald-900/20 rounded-2xl border border-emerald-500/20">
            <div className="flex items-center gap-4">
              <input
                type="range"
                id="opacity"
                name="opacity"
                min="0.05"
                max="1"
                step="0.01"
                value={settings.opacity ?? 1}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  onOpacity(val);
                  setOpacity(val);
                }}
                className="flex-1 accent-emerald-500 cursor-pointer"
              />
              <span className="text-emerald-100 font-medium w-12 text-right">
                {(settings.opacity ?? 1).toFixed(2)}
              </span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed mt-2">
              Adjust window transparency. Minimum is 0.05 to avoid full
              invisibility.
            </p>
          </div>
          <Dialog open={focusDialog} onOpenChange={setFocusDialog}>
            <ResponsiveDialog
              tone="amber"
              title="Focus Will Be Disabled"
              description={
                <>
                  Turning <strong>Focus off</strong> removes keyboard focus from
                  WhisprGPT. You will <strong>NOT</strong> be able to type
                  inside of WhisprGPT. Make sure you’re signed into your LLM
                  provider(s) beforehand.
                  <br />
                  <br />
                  This setting is recommended for Honorlock exams on Windows.
                </>
              }
              footer={
                <>
                  <Button
                    onClick={() => setFocusDialog(false)}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-2xl px-4 shadow-lg"
                  >
                    Acknowledge
                  </Button>
                </>
              }
              footerClassName="!justify-center sm:!justify-center"
            />
          </Dialog>
        </div>

        {/* Focus Toggle */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-base font-semibold text-emerald-200">
            <Crown className="h-4 w-4 text-amber-400" />
            Window Focus Control
          </label>
          <div className="p-4 bg-gradient-to-r from-slate-800/40 to-emerald-900/20 rounded-2xl border border-emerald-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Switch
                  checked={settings.focusable}
                  onCheckedChange={handleFocusToggle}
                  className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-emerald-500 data-[state=checked]:to-teal-500 data-[state=unchecked]:bg-slate-600 scale-110"
                />
                <span className="text-emerald-100 font-medium">
                  {settings.focusable ? "Focus Enabled" : "Focus Disabled"}
                </span>
              </div>
              <div
                className={`px-3 py-1 rounded-2xl text-xs font-bold border-2 ${
                  settings.focusable
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    : "bg-slate-600/20 text-slate-300 border-slate-500/40"
                }`}
              >
                {settings.focusable ? "ACTIVE" : "INACTIVE"}
              </div>
            </div>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            Control window focus behavior and interactions.
          </p>
        </div>

        {/* Reset Permissions */}
        {isMac && (
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-base font-semibold text-emerald-200">
              <Star className="h-4 w-4 text-amber-400" />
              Reset Permissions
            </label>
            <div className="p-4 bg-gradient-to-r from-amber-950/40 to-slate-900/40 border border-amber-500/30 rounded-2xl">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                  <p className="text-amber-300 text-sm font-medium">
                    This will reset your macOS permissions for Microphone and
                    Screen Capture. Execute this when having trouble with
                    permissions.
                  </p>
                </div>
                <Dialog open={resetDialog} onOpenChange={setResetDialog}>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="bg-amber-900/30 border-amber-500/40 text-amber-300 hover:bg-amber-900/50 hover:text-amber-200 rounded-2xl px-4 py-2 transition-all duration-300"
                    >
                      Reset Permissions
                    </Button>
                  </DialogTrigger>
                  <ResponsiveDialog
                    tone="amber"
                    title="Re-Add Permissions After Reset"
                    description={
                      <>
                        Inside <i>Screen Capture</i> page you will still see{" "}
                        <i>wTerm</i> inside of
                        <i> System Audio Recording Only</i>, remove it and
                        re-add it. Add <i>wTerm</i> to{" "}
                        <i>Screen & System Audio Recording</i> as well.
                      </>
                    }
                    footer={
                      <Button
                        onClick={async () => {
                          setResetDialog(false);
                          resetPermissions();
                          restartApp();
                        }}
                        className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-2xl px-4 shadow-lg"
                      >
                        Reset
                      </Button>
                    }
                    footerClassName="!justify-center sm:!justify-center"
                  />
                </Dialog>
              </div>
            </div>
          </div>
        )}

        {/* Cache Management */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-base font-semibold text-emerald-200">
            <Star className="h-4 w-4 text-amber-400" />
            Data Management
          </label>
          <div className="p-4 bg-gradient-to-r from-red-950/40 to-slate-900/40 border border-red-500/30 rounded-2xl">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                <p className="text-red-300 text-sm font-medium">
                  This will permanently delete all cached data and sign you out
                  of all accounts.
                </p>
              </div>
              <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="bg-red-900/30 border-red-500/40 text-red-300 hover:bg-red-900/50 hover:text-red-200 rounded-2xl px-4 py-2 transition-all duration-300"
                  >
                    Delete Cache
                  </Button>
                </DialogTrigger>
                <ResponsiveDialog
                  tone="red"
                  title="Confirm Cache Deletion"
                  description="This action will permanently clear all application cache and session data. You will be signed out of all accounts and need to reconfigure your preferences."
                  footer={
                    <>
                      <Button
                        variant="outline"
                        onClick={() => setOpenDialog(false)}
                        className="bg-slate-700/50 border-slate-500/40 text-slate-200 hover:bg-slate-600/50 rounded-2xl px-4"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={async () => {
                          setOpenDialog(false);
                          await handleDeleteCache();
                        }}
                        className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-2xl px-4 shadow-lg"
                      >
                        Confirm Delete
                      </Button>
                    </>
                  }
                  footerClassName="!justify-center sm:!justify-center"
                />
              </Dialog>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
