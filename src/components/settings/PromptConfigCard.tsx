import { Code, Crown, Hexagon, Keyboard, RefreshCw, Star } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

type PromptConfigCardProps = {
  readonly systemPrompt: string;
  readonly retryPrompt: string;
  readonly retryShortcut: string;
  onOpenWizard: () => void;
  onPromptChange: (v: string) => void;
  onRetryChange: (v: string) => void;
};

export default function PromptConfigCard({
  systemPrompt,
  retryPrompt,
  retryShortcut,
  onOpenWizard,
  onPromptChange,
  onRetryChange,
}: PromptConfigCardProps) {
  return (
    <Card className="group relative overflow-hidden bg-gradient-to-br from-slate-900/80 to-emerald-950/40 backdrop-blur-xl border border-emerald-500/30 rounded-3xl shadow-2xl hover:shadow-emerald-500/20 transition-all duration-500">
      <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-br-full"></div>
      <div className="absolute -top-2 -left-2 w-4 h-4 bg-emerald-400 rounded-full animate-pulse delay-300"></div>

      <CardHeader className="pb-4 relative z-10">
        <CardTitle className="flex items-center gap-3 text-emerald-100 text-xl font-bold">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl blur-md opacity-60"></div>
            <div className="relative p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl">
              <Code className="h-6 w-6 text-white" />
            </div>
          </div>
          <span>Prompt Configuration</span>
          <div className="ml-auto">
            <Star className="h-5 w-5 text-amber-400 animate-pulse" />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="space-y-6">
          <div className="relative p-4 bg-gradient-to-r from-emerald-900/30 to-slate-900/30 rounded-2xl border border-emerald-500/20">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <Button
                type="button"
                onClick={onOpenWizard}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-0 rounded-2xl px-6 py-3 font-semibold shadow-lg hover:shadow-emerald-500/30 transition-all duration-300"
              >
                <Crown className="h-4 w-4 mr-2" />
                Templates
              </Button>

              {/* {selectedTemplate !== "none" && (
                                <div className="bg-gradient-to-r from-amber-900/60 to-orange-900/60 backdrop-blur-lg text-amber-200 px-4 py-2 rounded-2xl border border-amber-500/30 text-sm">
                                    {selectedTemplate === "coding" ? (
                                        <span className="flex items-center">
                                            <FileCode className="h-4 w-4 mr-2 text-cyan-400" />
                                            <strong>Coding:</strong>{" "}
                                            {selectedCodingLanguage || "General"}
                                        </span>
                                    ) : selectedTemplate === "exams" ? (
                                        <span className="flex items-center">
                                            <BookOpen className="h-4 w-4 mr-2 text-emerald-400" />
                                            <strong>Academic:</strong>{" "}
                                            {customClass || selectedClass || "General"}
                                        </span>
                                    ) : null}
                                </div>
                            )} */}
            </div>
          </div>

          {/* System Prompt */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-base font-semibold text-emerald-200">
              <Hexagon className="h-4 w-4 text-emerald-400" />
              System Prompt
            </label>
            <div className="relative">
              <textarea
                id="systemPrompt"
                name="systemPrompt"
                value={systemPrompt}
                onChange={(e) => onPromptChange(e.target.value)}
                rows={6}
                className="w-full px-4 py-3 bg-slate-800/60 backdrop-blur-lg text-emerald-100 border border-emerald-500/30 rounded-2xl placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-400 transition-all duration-300 resize-none leading-relaxed"
                placeholder="Define the AI's personality and behavior..."
              />
              <div className="absolute top-3 right-3">
                <Crown className="h-4 w-4 text-amber-400/50" />
              </div>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              Core instructions that shape how your AI assistant thinks and
              responds.
            </p>
          </div>

          {/* Retry Prompt (Backup) */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-base font-semibold text-emerald-200">
              <RefreshCw className="h-4 w-4 text-emerald-400" />
              Retry Prompt
            </label>

            <div className="relative">
              <textarea
                id="retryPrompt"
                name="retryPrompt"
                value={retryPrompt}
                onChange={(e) => onRetryChange(e.target.value)}
                rows={6}
                className="w-full px-4 py-3 bg-slate-800/60 backdrop-blur-lg text-emerald-100 border border-emerald-500/30 rounded-2xl placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-400 transition-all duration-300 resize-none leading-relaxed"
                placeholder="An alternate set of instructions to use on demand…"
              />
              <div className="absolute top-3 right-3">
                <RefreshCw className="h-4 w-4 text-emerald-400/50" />
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed flex items-center gap-2 flex-wrap">
              <span>
                Press{" "}
                <span className="px-2 py-0.5 rounded-md bg-slate-700/60 border border-emerald-500/30 text-emerald-200 font-mono text-xs">
                  {retryShortcut || "—"}
                </span>{" "}
                to insert the Retry Prompt and send again. This won’t replace
                your System Prompt.
              </span>
            </p>

            {!retryShortcut && (
              <div className="mt-2 inline-flex items-center gap-2 text-xs text-slate-400">
                <Keyboard className="w-3.5 h-3.5" />
                <span>
                  Tip: set a shortcut in{" "}
                  <span className="text-emerald-300 font-medium">
                    Settings → Keyboard Shortcuts
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
