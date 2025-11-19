// src/types/types.d.ts
import { ChangeEvent } from "react";
import { User } from "@supabase/supabase-js";

interface WhisperSettings {
  llm: "chatgpt" | "grok" | "deepseek" | "gemini" | "perplexity";
  systemPrompt: string;
  retryPrompt: string;
  screenWidth: number;
  screenHeight: number;
  focusable: boolean;
  showBanner: boolean;
  shortcuts: Record<string, ShortcutEntry>;
  opacity: number;
}

type AiDetails = {
  name: string;
  url: string;
};

type SwitchChangeEvent = { name: string; checked: boolean };
type InputChangeEvent = ChangeEvent<
  HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
>;

interface StripeSubscription {
  id: string;
  status: string;
}

interface SubscribePageProps {
  user: User;
}

interface PlatformShortcut {
  mac: string;
  windows: string;
}

interface CustomShortcut {
  mac?: string;
  windows?: string;
}

interface ShortcutEntry {
  key: string;
  title?: string;
  description?: string;
  defaultShortcut: PlatformShortcut;
  customShortcut?: CustomShortcut;
  category?: "core" | "navigation" | "media" | "system" | "movement";
}

interface ShortcutCommand {
  key: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  defaultShortcut: {
    mac: string;
    windows: string;
  };
  customShortcut?: {
    mac?: string;
    windows?: string;
  };
  category: "core" | "navigation" | "media" | "system" | "movement";
}

interface KeyCombination {
  ctrl: boolean;
  cmd: boolean;
  shift: boolean;
  alt: boolean;
  key: string;
}

type Subject = (typeof subjectClasses)[number]["value"];
type SubjectPromptMap = {
  [K in Subject]: K extends "other" ? (customClass: string) => string : string;
};
