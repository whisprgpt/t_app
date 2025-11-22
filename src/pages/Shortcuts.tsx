// src/pages/Shortcuts.tsx
// UPDATED: Migrated from Electron to Tauri

import { useEffect, useState, useMemo } from "react";
import type React from "react";
import {
  Maximize2,
  Camera,
  ArrowRight,
  Home,
  Power,
  Settings,
  Mic,
  ArrowLeft,
  Edit3,
  Save,
  RotateCcw,
  Check,
  AlertTriangle,
  MousePointer,
  Keyboard,
  Zap,
  ArrowUp,
  ArrowDown,
  MoveUp,
  MoveDown,
  MoveLeft,
  MoveRight,
  RefreshCcw,
} from "lucide-react";
import { cn } from "../lib/utils";
import { ScrollArea } from "../components/ui/scroll-area";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { KeyCombination, ShortcutCommand } from "@/types/types";
import { WhisperSettings } from "@/types/types";

// ✨ UPDATED: Import Tauri APIs
import {
  getSettings,
  saveSettings,
  isMac as getTauriPlatform,
} from "@/lib/tauri-settings-api";
import { refreshShortcuts } from "@/lib/tauri-shortcuts-api";

// Utility to map key to icon
const iconForKey = (key: string) => {
  switch (key) {
    case "screenshot":
      return <Camera size={20} />;
    case "generate":
      return <ArrowRight size={20} />;
    case "retry-prompt":
      return <RefreshCcw size={20} />;
    case "record":
      return <Mic size={20} />;
    case "scroll-up":
      return <ArrowUp size={20} />;
    case "scroll-down":
      return <ArrowDown size={20} />;
    case "move-up":
      return <MoveUp size={20} />;
    case "move-down":
      return <MoveDown size={20} />;
    case "move-left":
      return <MoveLeft size={20} />;
    case "move-right":
      return <MoveRight size={20} />;
    case "home":
      return <Home size={20} />;
    case "hide-show":
      return <Maximize2 size={20} />;
    case "quit":
      return <Power size={20} />;
    default:
      return <Zap size={20} />;
  }
};

// Keyboard key UI
const KeyboardKey = ({
  children,
  variant = "default",
  size = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "modifier" | "special" | "letter" | "arrow";
  size?: "default" | "small" | "large";
}) => {
  const variants = {
    default: "bg-gray-800/60 border-gray-600/50 text-gray-200",
    modifier: "bg-purple-500/20 border-purple-400/40 text-purple-200",
    special: "bg-yellow-500/20 border-yellow-400/40 text-yellow-200",
    letter: "bg-blue-500/20 border-blue-400/40 text-blue-200",
    arrow: "bg-green-500/20 border-green-400/40 text-green-200",
  };

  const sizes = {
    small: "min-w-[32px] h-[28px] px-2 text-xs",
    default: "min-w-[40px] h-[36px] px-3 text-sm",
    large: "min-w-[48px] h-[44px] px-4 text-base",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center backdrop-blur-sm border rounded-lg font-medium transition-all duration-200 shadow-sm",
        variants[variant],
        sizes[size]
      )}
    >
      {children}
    </div>
  );
};

const ShortcutDisplay = ({ shortcut }: { shortcut: string }) => {
  const parts = shortcut.split(" + ");

  const getKeyVariant = (key: string) => {
    if (["⌘", "Ctrl", "Cmd"].includes(key)) return "modifier";
    if (["Shift", "Alt", "⌥", "Option"].includes(key)) return "modifier";
    if (["↵", "Enter", "Space", "Tab", "Esc"].includes(key)) return "special";
    if (["↑", "↓", "←", "→", "↑↓", "↑↓←→"].includes(key)) return "arrow";
    if (key.length === 1 && /[A-Z0-9]/.test(key)) return "letter";
    return "default";
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {parts.map((part, i) => (
        <div key={i} className="flex items-center">
          <KeyboardKey variant={getKeyVariant(part)}>{part}</KeyboardKey>
          {i < parts.length - 1 && (
            <span className="mx-2 text-gray-400 font-medium">+</span>
          )}
        </div>
      ))}
    </div>
  );
};

// ShortcutEditor unchanged except types adapt to new command shape
const ShortcutEditor = ({
  command,
  isMac,
  onSave,
  onCancel,
  allCommands,
}: {
  command: ShortcutCommand;
  isMac: boolean;
  onSave: (shortcut: string) => void;
  onCancel: () => void;
  allCommands: ShortcutCommand[];
}) => {
  const [keys, setKeys] = useState<KeyCombination>({
    ctrl: false,
    cmd: false,
    shift: false,
    alt: false,
    key: "",
  });
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [step, setStep] = useState<"ready" | "listening" | "preview">("ready");
  const [showValidationHelp, setShowValidationHelp] = useState(false);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isListening) return;

    e.preventDefault();
    e.stopPropagation();

    let keyName = e.key;
    if (keyName === "Enter") keyName = "↵";
    else if (keyName === "ArrowUp") keyName = "↑";
    else if (keyName === "ArrowDown") keyName = "↓";
    else if (keyName === "ArrowLeft") keyName = "←";
    else if (keyName === "ArrowRight") keyName = "→";
    else if (keyName === " ") keyName = "Space";
    else if (keyName === "Escape") keyName = "Esc";
    else if (keyName === "Tab") keyName = "Tab";
    else if (keyName.length === 1) keyName = keyName.toUpperCase();

    if (["Control", "Meta", "Shift", "Alt", "Cmd", "Command"].includes(keyName))
      return;

    const newKeys = {
      ctrl: e.ctrlKey,
      cmd: e.metaKey,
      shift: e.shiftKey,
      alt: e.altKey,
      key: keyName,
    };

    setKeys(newKeys);
    setIsListening(false);
    setStep("preview");
    setError(null);
    setWarning(null);
  };

  useEffect(() => {
    if (isListening) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isListening]);

  const startListening = () => {
    setIsListening(true);
    setStep("listening");
    setError(null);
    setWarning(null);
    setShowValidationHelp(false);
    setKeys({ ctrl: false, cmd: false, shift: false, alt: false, key: "" });
  };

  const formatShortcut = () => {
    const parts: string[] = [];

    if (isMac) {
      if (keys.cmd) parts.push("⌘");
      if (keys.ctrl) parts.push("Ctrl");
      if (keys.shift) parts.push("Shift");
    } else {
      if (keys.ctrl) parts.push("Ctrl");
      if (keys.shift) parts.push("Shift");
      if (keys.alt) parts.push("Alt");
    }

    if (keys.key) parts.push(keys.key);
    return parts.join(" + ");
  };

  const checkForConflicts = (shortcut: string) => {
    const platform = isMac ? "mac" : "windows";

    for (const cmd of allCommands) {
      if (cmd.key === command.key) continue;

      const existingShortcut = cmd.customShortcut
        ? cmd.customShortcut[platform]
        : cmd.defaultShortcut[platform];

      if (existingShortcut === shortcut) {
        return {
          conflictsWith: cmd.title,
          type: "command" as const,
        };
      }
    }
    return null;
  };

  const validateShortcut = () => {
    const hasModifier = keys.ctrl || keys.cmd || keys.shift || keys.alt;
    if (!keys.key) {
      return {
        error: "Please press a key after holding modifiers",
        warning: null,
      };
    }
    if (!hasModifier) {
      return {
        error: isMac
          ? "You must hold ⌘, Ctrl or Shift while pressing another key."
          : "You must hold Ctrl, Shift or Alt while pressing another key.",
        warning: null,
      };
    }

    if (keys.key.length === 1 && /[A-Z0-9]/.test(keys.key)) {
      const hasStrongModifier = keys.ctrl || keys.cmd || keys.alt;
      if (!hasStrongModifier) {
        return {
          error:
            "Single letter/number shortcuts require Ctrl/⌘ or Alt modifier to prevent typing conflicts",
          warning: null,
        };
      }
    }

    const shortcut = formatShortcut();

    const conflict = checkForConflicts(shortcut);
    if (conflict) {
      return {
        error: `This shortcut is already used by "${conflict.conflictsWith}". Each shortcut must be unique.`,
        warning: null,
      };
    }

    let warning: string | null = null;
    if (
      keys.key === "A" &&
      (keys.ctrl || keys.cmd) &&
      !keys.shift &&
      !keys.alt
    ) {
      warning =
        "Ctrl/⌘+A is commonly used for 'Select All' - consider adding Shift or Alt";
    } else if (
      keys.key === "C" &&
      (keys.ctrl || keys.cmd) &&
      !keys.shift &&
      !keys.alt
    ) {
      warning = "Ctrl/⌘+C is used for 'Copy' - consider adding Shift or Alt";
    } else if (
      keys.key === "V" &&
      (keys.ctrl || keys.cmd) &&
      !keys.shift &&
      !keys.alt
    ) {
      warning = "Ctrl/⌘+V is used for 'Paste' - consider adding Shift or Alt";
    } else if (
      keys.key === "Z" &&
      (keys.ctrl || keys.cmd) &&
      !keys.shift &&
      !keys.alt
    ) {
      warning = "Ctrl/⌘+Z is used for 'Undo' - consider adding Shift or Alt";
    }

    return { error: null, warning };
  };

  const handleSave = () => {
    const validation = validateShortcut();
    if (validation.error) {
      setError(validation.error);
      setWarning(null);
      setShowValidationHelp(true);
      return;
    }

    if (validation.warning) {
      setWarning(validation.warning);
    }

    onSave(formatShortcut());
  };

  const handleReset = () => {
    setKeys({ ctrl: false, cmd: false, shift: false, alt: false, key: "" });
    setStep("ready");
    setError(null);
    setWarning(null);
    setShowValidationHelp(false);
  };

  const getModifierInstructions = () => {
    if (isMac) {
      return "Hold ⌘ (Command), Ctrl, or Shift while pressing another key";
    }
    return "Hold Ctrl, Shift, or Alt while pressing another key";
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="space-y-4 overflow-hidden"
    >
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-4">
        {["ready", "listening", "preview"].map((s, i) => (
          <div key={s} className="flex items-center">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
                step === s
                  ? "bg-purple-500 text-white scale-110"
                  : i < ["ready", "listening", "preview"].indexOf(step)
                  ? "bg-green-500 text-white"
                  : "bg-gray-700 text-gray-400"
              )}
            >
              {i < ["ready", "listening", "preview"].indexOf(step) ? (
                <Check className="w-4 h-4" />
              ) : (
                i + 1
              )}
            </div>
            {i < 2 && <div className="w-8 h-0.5 bg-gray-700 mx-2" />}
          </div>
        ))}
      </div>

      {/* Main content based on step */}
      <AnimatePresence mode="wait">
        {step === "ready" && (
          <motion.div
            key="ready"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="text-center space-y-4"
          >
            <div className="p-6 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl">
              <Keyboard className="w-12 h-12 text-purple-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">
                Ready to Record
              </h3>
              <p className="text-gray-300 text-sm mb-4">
                {getModifierInstructions()}
              </p>
              <div className="mb-4 p-3 bg-black/30 rounded-lg border border-gray-700/50">
                <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">
                  Valid Examples:
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <div className="flex items-center gap-1">
                    <KeyboardKey variant="modifier" size="small">
                      {isMac ? "⌘" : "Ctrl"}
                    </KeyboardKey>
                    <span className="text-gray-400 text-xs">+</span>
                    <KeyboardKey variant="letter" size="small">
                      K
                    </KeyboardKey>
                  </div>
                  <div className="flex items-center gap-1">
                    <KeyboardKey variant="modifier" size="small">
                      Shift
                    </KeyboardKey>
                    <span className="text-gray-400 text-xs">+</span>
                    <KeyboardKey variant="modifier" size="small">
                      {isMac ? "⌘" : "Ctrl"}
                    </KeyboardKey>
                    <span className="text-gray-400 text-xs">+</span>
                    <KeyboardKey variant="letter" size="small">
                      P
                    </KeyboardKey>
                  </div>
                  <div className="flex items-center gap-1">
                    <KeyboardKey variant="modifier" size="small">
                      {!isMac ? "Alt" : "⌘"}
                    </KeyboardKey>
                    <span className="text-gray-400 text-xs">+</span>
                    <KeyboardKey variant="arrow" size="small">
                      ↑
                    </KeyboardKey>
                  </div>
                </div>
              </div>
              <Button
                onClick={startListening}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
              >
                <Zap className="w-4 h-4 mr-2" />
                Start Recording
              </Button>
            </div>
          </motion.div>
        )}
        {step === "listening" && (
          <motion.div
            key="listening"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="text-center space-y-4"
          >
            <div className="p-6 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl">
              <div className="relative">
                <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-3 animate-pulse">
                  <Keyboard className="w-8 h-8 text-yellow-400" />
                </div>
                <div className="absolute inset-0 w-16 h-16 bg-yellow-500/10 rounded-full mx-auto animate-ping" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Listening for Key Combination...
              </h3>
              <p className="text-gray-300 text-sm mb-2">
                Press and hold modifier keys, then press your target key
              </p>
              <div className="mb-4 p-3 bg-black/30 rounded-lg border border-gray-700/50">
                <p className="text-xs text-gray-400 mb-2">Currently Pressed:</p>
                <div className="flex justify-center gap-2 min-h-[36px] items-center">
                  {!keys.ctrl &&
                    !keys.cmd &&
                    !keys.shift &&
                    !keys.alt &&
                    !keys.key && (
                      <span className="text-gray-500 text-sm">
                        No keys detected
                      </span>
                    )}
                  {(keys.ctrl || keys.cmd) && (
                    <KeyboardKey variant="modifier" size="small">
                      {isMac ? "⌘" : "Ctrl"}
                    </KeyboardKey>
                  )}
                  {keys.shift && (
                    <KeyboardKey variant="modifier" size="small">
                      Shift
                    </KeyboardKey>
                  )}
                  {keys.alt && (
                    <KeyboardKey variant="modifier" size="small">
                      {isMac ? "⌥" : "Alt"}
                    </KeyboardKey>
                  )}
                  {keys.key && (
                    <>
                      {(keys.ctrl || keys.cmd || keys.shift || keys.alt) && (
                        <span className="text-gray-400 text-xs">+</span>
                      )}
                      <KeyboardKey variant="letter" size="small">
                        {keys.key}
                      </KeyboardKey>
                    </>
                  )}
                </div>
              </div>
              <Button
                onClick={() => {
                  setIsListening(false);
                  setStep("ready");
                }}
                variant="outline"
                className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
        {step === "preview" && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            <div
              className={cn(
                "p-6 rounded-xl border",
                error
                  ? "bg-gradient-to-br from-red-500/10 to-rose-500/10 border-red-500/20"
                  : warning
                  ? "bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20"
                  : "bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20"
              )}
            >
              <div className="text-center mb-4">
                {error ? (
                  <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                ) : warning ? (
                  <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                ) : (
                  <Check className="w-12 h-12 text-green-400 mx-auto mb-3" />
                )}
                <h3 className="text-lg font-semibold text-white mb-2">
                  {error
                    ? "Invalid Shortcut"
                    : warning
                    ? "Shortcut Warning"
                    : "Shortcut Recorded"}
                </h3>
                <p className="text-gray-300 text-sm mb-4">
                  {error
                    ? "Please fix the issues below"
                    : warning
                    ? "Review the warning below"
                    : "Review your shortcut below"}
                </p>
              </div>
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-black/40 rounded-lg border border-gray-700">
                  <ShortcutDisplay shortcut={formatShortcut()} />
                </div>
              </div>
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm mb-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium mb-1">Validation Error:</p>
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              )}
              {warning && !error && (
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-300 text-sm mb-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium mb-1">Warning:</p>
                      <p>{warning}</p>
                      <p className="text-xs mt-1 text-yellow-400">
                        You can still save this shortcut if you want to use it.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {showValidationHelp && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-300 text-sm mb-4"
                >
                  <h4 className="font-medium mb-2">
                    💡 Why do we require unique shortcuts?
                  </h4>
                  <ul className="space-y-1 text-xs">
                    <li>• Prevents conflicts between different functions</li>
                    <li>• Ensures each shortcut triggers only one action</li>
                    <li>• Avoids confusion and unexpected behavior</li>
                    <li>• Maintains consistent user experience</li>
                  </ul>
                </motion.div>
              )}
              <div className="flex items-center gap-3 justify-center">
                {!error && (
                  <Button
                    onClick={handleSave}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Shortcut
                  </Button>
                )}
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="bg-yellow-500/10 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  onClick={onCancel}
                  variant="outline"
                  className="bg-gray-500/10 border-gray-500/30 text-gray-400 hover:bg-gray-500/20"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const CommandCard = ({
  command,
  isMac,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onReset,
  allCommands,
}: {
  command: ShortcutCommand;
  isMac: boolean;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (shortcut: string) => void;
  onCancel: () => void;
  onReset: () => void;
  allCommands: ShortcutCommand[];
}) => {
  const currentShortcut = command.customShortcut
    ? isMac
      ? command.customShortcut.mac ?? command.defaultShortcut.mac
      : command.customShortcut.windows ?? command.defaultShortcut.windows
    : isMac
    ? command.defaultShortcut.mac
    : command.defaultShortcut.windows;

  const isCustomized = !!command.customShortcut;

  const categoryStyles = {
    core: "from-purple-500/10 to-blue-500/10 border-purple-500/20",
    navigation: "from-green-500/10 to-teal-500/10 border-green-500/20",
    media: "from-yellow-500/10 to-orange-500/10 border-yellow-500/20",
    system: "from-red-500/10 to-pink-500/10 border-red-500/20",
    movement: "from-cyan-500/10 to-blue-500/10 border-cyan-500/20",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-6 border rounded-xl backdrop-blur-sm transition-all duration-300",
        "bg-gradient-to-br",
        categoryStyles[command.category],
        isEditing && "ring-2 ring-purple-500/50 shadow-lg shadow-purple-500/10"
      )}
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 p-3 rounded-xl bg-black/60 border border-gray-700">
              <div className="text-white">{command.icon}</div>
            </div>
            <div>
              <h3 className="font-semibold text-white text-lg mb-1">
                {command.title}
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                {command.description}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  variant="outline"
                  className="text-xs px-2 py-1 bg-black/20 border-gray-600/50 text-gray-300"
                >
                  {command.category}
                </Badge>
                {isCustomized && (
                  <Badge
                    variant="outline"
                    className="text-xs px-2 py-1 bg-purple-500/20 border-purple-500/30 text-purple-300"
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Custom
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {!isEditing && (
            <div className="flex items-center gap-2">
              {isCustomized && (
                <Button
                  onClick={onReset}
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg"
                  title="Reset to default"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              )}
              <Button
                onClick={onEdit}
                variant="ghost"
                size="sm"
                className="h-9 px-3 text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg"
                title="Edit shortcut"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {isEditing ? (
            <ShortcutEditor
              key="editor"
              command={command}
              isMac={isMac}
              onSave={onSave}
              onCancel={onCancel}
              allCommands={allCommands}
            />
          ) : (
            <motion.div
              key="display"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 bg-black/30 rounded-lg border border-gray-700/50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-2 block">
                    Current Shortcut
                  </span>
                  <ShortcutDisplay shortcut={currentShortcut} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const PlatformIndicator = ({ isMac }: { isMac: boolean }) => (
  <div className="flex justify-center mb-8">
    <div className="inline-flex items-center bg-black/40 backdrop-blur-sm border border-gray-800 rounded-xl px-6 py-3">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-purple-500" />
        <span className="text-sm font-medium text-white">
          {isMac ? "macOS" : "Windows"} Configuration
        </span>
      </div>
    </div>
  </div>
);

export default function ShortcutsPage() {
  // ✨ UPDATED: Use Tauri platform detection
  const isMacPlatform = getTauriPlatform() === "darwin";
  const platform = isMacPlatform ? "mac" : "windows";
  const navigate = useNavigate();

  const [settings, setSettings] = useState<WhisperSettings | null>(null);
  const [editingCommand, setEditingCommand] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  // ✨ UPDATED: Load settings using Tauri
  useEffect(() => {
    (async () => {
      try {
        console.log("📥 Loading shortcuts settings...");
        const loaded = await getSettings();
        console.log("✅ Settings loaded:", loaded);
        setSettings(loaded);
      } catch (err) {
        console.error("❌ Failed to load settings:", err);
      }
    })();
  }, []);

  // Derive commands from settings.shortcuts
  const commands: ShortcutCommand[] = useMemo(() => {
    if (!settings) return [];
    return Object.values(settings.shortcuts)
      .filter((entry) => entry.defaultShortcut) // ← Add this filter
      .map((entry) => ({
        key: entry.key,
        title: entry.title || entry.key,
        description: entry.description || "",
        icon: iconForKey(entry.key),
        category: (entry.category || "core") as ShortcutCommand["category"],
        defaultShortcut: {
          mac: entry.defaultShortcut.mac,
          windows: entry.defaultShortcut.windows,
        },
        customShortcut: entry.customShortcut,
      }));
  }, [settings]);

  const groupedCommands = useMemo(() => {
    const acc: Record<string, ShortcutCommand[]> = {};
    for (const cmd of commands) {
      if (!acc[cmd.category]) acc[cmd.category] = [];
      acc[cmd.category].push(cmd);
    }
    return acc;
  }, [commands]);

  const categoryTitles: Record<string, string> = {
    core: "Core Functions",
    movement: "Movement Controls",
    navigation: "Navigation",
    media: "Media Controls",
    system: "System Controls",
  };

  const categoryIcons: Record<string, React.ReactNode> = {
    core: <Zap className="w-5 h-5" />,
    movement: <MousePointer className="w-5 h-5" />,
    navigation: <ArrowRight className="w-5 h-5" />,
    media: <Mic className="w-5 h-5" />,
    system: <Settings className="w-5 h-5" />,
  };

  // ✨ UPDATED: Persist settings using Tauri
  const persistSettings = async (newSettings: WhisperSettings) => {
    try {
      setSaving(true);
      console.log("💾 Saving shortcuts...");

      const success = await saveSettings(newSettings);

      if (success) {
        console.log("✅ Shortcuts saved");
        const reloaded = await getSettings();
        setSettings(reloaded);
        setHasChanges(false);

        // Refresh global shortcuts
        console.log("🔄 Refreshing shortcuts...");
        await refreshShortcuts();
        console.log("✅ Shortcuts refreshed");
      } else {
        console.error("❌ Saving failed (returned false)");
      }
    } catch (e) {
      console.error("❌ Failed saving shortcuts:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (commandKey: string, shortcut: string) => {
    if (!settings) return;
    const updatedShortcuts = {
      ...settings.shortcuts,
      [commandKey]: {
        ...settings.shortcuts[commandKey],
        customShortcut: {
          ...(settings.shortcuts[commandKey].customShortcut || {}),
          [platform]: shortcut,
        },
      },
    };
    setHasChanges(true);
    await persistSettings({ ...settings, shortcuts: updatedShortcuts });
    setEditingCommand(null);
  };

  const handleReset = async (commandKey: string) => {
    if (!settings) return;
    const entry = { ...settings.shortcuts[commandKey] };
    delete entry.customShortcut;
    const updatedShortcuts = {
      ...settings.shortcuts,
      [commandKey]: entry,
    };
    setHasChanges(true);
    await persistSettings({ ...settings, shortcuts: updatedShortcuts });
  };

  const handleResetAll = async () => {
    if (!settings) return;
    const cleaned: typeof settings.shortcuts = {};
    for (const [k, v] of Object.entries(settings.shortcuts)) {
      cleaned[k] = { ...v };
      delete cleaned[k].customShortcut;
    }
    setHasChanges(true);
    await persistSettings({ ...settings, shortcuts: cleaned });
  };

  const handleSaveAll = async () => {
    if (!settings) return;
    await persistSettings(settings);
  };

  if (!settings) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-yellow-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-purple-500/5 to-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGZpbGw9IiMxMTExMTEiIGQ9Ik0wIDBoNjB2NjBIMHoiLz48cGF0aCBkPSJNNjAgMzBjMCAxNi41NjktMTMuNDMxIDMwLTMwIDMwQzEzLjQzMSA2MCAwIDQ2LjU2OSAwIDMwIDAgMTMuNDMxIDEzLjQzMSAwIDMwIDBjMTYuNTY5IDAgMzAgMTMuNDMxIDMwIDMweiIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9Ii41Ii8+PHBhdGggZD0iTTYwIDYwTDAgME02MCAwTDAgNjAiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIuNSIvPjwvZz48L3N2Zz4=')] opacity-5" />
      </div>

      <ScrollArea className="h-screen">
        <div className="container px-4 mx-auto py-12 relative z-10 max-w-6xl">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-8 mb-6 lg:mb-8">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate("/")}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white hover:bg-gray-800/50"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-4xl lg:text-5xl font-bold text-white mb-2">
                  Keyboard Shortcuts
                </h1>
                <p className="text-lg text-gray-300">
                  Customize shortcuts to match your workflow perfectly
                </p>
              </div>
            </div>
            {/* Action buttons */}
            <div className="flex items-center gap-3">
              <Button
                onClick={handleResetAll}
                variant="outline"
                className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset All
              </Button>
              <Button
                onClick={handleSaveAll}
                disabled={!hasChanges || saving}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
                {hasChanges && !saving && (
                  <Badge className="ml-2 bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-xs">
                    <Check className="w-3 h-3" />
                  </Badge>
                )}
              </Button>
            </div>
          </div>

          <PlatformIndicator isMac={isMacPlatform} />

          {/* Command categories */}
          <div className="space-y-12">
            {Object.entries(groupedCommands).map(
              ([category, categoryCommands]) => (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30">
                        {categoryIcons[category]}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">
                          {categoryTitles[category]}
                        </h2>
                        <p className="text-gray-400 text-sm">
                          {category === "movement" &&
                            "Individual controls for chat scrolling and window positioning"}
                          {category === "core" &&
                            "Essential functions for AI interaction"}
                          {category === "navigation" &&
                            "Navigate through the application"}
                          {category === "media" &&
                            "Audio and recording controls"}
                          {category === "system" &&
                            "System-level application controls"}
                        </p>
                      </div>
                    </div>
                    <div className="h-px bg-gradient-to-r from-purple-500/50 via-transparent to-blue-500/50" />
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {categoryCommands.map((command) => (
                      <CommandCard
                        key={command.key}
                        command={command}
                        isMac={isMacPlatform}
                        isEditing={editingCommand === command.key}
                        onEdit={() => setEditingCommand(command.key)}
                        onSave={(shortcut) => handleSave(command.key, shortcut)}
                        onCancel={() => setEditingCommand(null)}
                        onReset={() => handleReset(command.key)}
                        allCommands={commands}
                      />
                    ))}
                  </div>
                </motion.div>
              )
            )}
          </div>

          {/* Footer guidelines (unchanged) */}
          <div className="mt-16 p-8 bg-gradient-to-br from-black/60 to-gray-900/40 backdrop-blur-sm border border-gray-800 rounded-xl">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-purple-500/20 border border-purple-500/30">
                <Settings className="w-6 w-6 text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white mb-3 text-lg">
                  Shortcut Requirements & Guidelines
                </h3>
                <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-300">
                  <div>
                    <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-400" />
                      Required Rules
                    </h4>
                    <div className="space-y-2">
                      <p className="text-yellow-300 font-medium">
                        All shortcuts MUST:
                      </p>
                      <ul className="space-y-1 ml-4">
                        <li>
                          • Include at least one modifier key (Ctrl/⌘, Shift,
                          Alt)
                        </li>
                        <li>• Be unique across all functions</li>
                        <li>• Not conflict with existing shortcuts</li>
                      </ul>
                      <p className="text-xs text-gray-400 mt-2">
                        This prevents conflicts and ensures reliable operation.
                      </p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-400" />
                      Movement Controls
                    </h4>
                    <ul className="space-y-1">
                      <li>
                        • <strong>Chat Scrolling:</strong> Separate up/down
                        controls
                      </li>
                      <li>
                        • <strong>Window Movement:</strong> Individual
                        directional controls
                      </li>
                      <li>
                        • <strong>Precision Control:</strong> Move exactly where
                        you want
                      </li>
                      <li>
                        • <strong>No Conflicts:</strong> Each direction has its
                        own shortcut
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg">
                  <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                    <Keyboard className="w-4 h-4 text-blue-400" />
                    Conflict Detection
                  </h4>
                  <p className="text-sm text-gray-300">
                    The system automatically detects when you try to use a
                    shortcut that's already assigned to another function. Each
                    shortcut must be unique to prevent unexpected behavior.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
