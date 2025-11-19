"use client";
import { X, Sparkles } from "lucide-react";
import { Button } from "../components/ui/button";

interface NewFeaturesBannerProps {
  onDismiss: () => void;
}

export function NewFeaturesBanner({ onDismiss }: NewFeaturesBannerProps) {
  return (
    <div className="relative p-5">
      {/* Close button */}
      <Button
        onClick={onDismiss}
        variant="ghost"
        size="icon"
        className="absolute top-3 right-3 text-gray-400 hover:text-white hover:bg-black/20"
      >
        <X className="h-5 w-5" />
        <span className="sr-only">Dismiss</span>
      </Button>

      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-purple-500/20 p-2 rounded-full">
          <Sparkles className="h-5 w-5 text-purple-400" />
        </div>
        <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-yellow-400">
          Coming Soon
        </h3>
      </div>

      {/* Features list */}
      <ul className="space-y-3 pl-2">
        <li className="flex items-start gap-3">
          <div className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 text-sm font-medium">
            1
          </div>
          <p className="text-gray-200">
            <span className="text-white font-semibold">
              WhisprGPT 2.0 Release
            </span>
            <br />
            Launching{" "}
            <span className="text-emerald-400">
              August 28, 2025 at 10:00 PM PST
            </span>
            .
          </p>
        </li>
        <li className="flex items-start gap-3">
          <div className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 text-sm font-medium">
            2
          </div>
          <p className="text-white">
            <span className="font-semibold text-red-400">Important:</span>{" "}
            Starting <span className="text-amber-300">September 15, 2025</span>,
            <span className="ml-1">
              WhisprGPT 1.0 will no longer be supported.
            </span>
            {" "}All updates, bug fixes, and new features will only be released for{" "}
            <span className="font-semibold text-emerald-400">
              WhisprGPT 2.0
            </span>
            .
          </p>
        </li>

        <li className="flex items-start gap-3">
          <div className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 text-sm font-medium">
            3
          </div>
          <p className="text-gray-200">
            Go to
            <span className="font-semibold text-emerald-400">
              {" https://www.whisprgpt.com/whisprgpt2.0 "}
            </span>
            for more instructions on how to transition to WhisprGPT 2.0
          </p>
        </li>
      </ul>
    </div>
  );
}
