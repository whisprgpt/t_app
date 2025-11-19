import { Cpu, Gem, Hexagon, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectItem,
    SelectContent,
} from "../ui/select";
import { llmProviders } from "./data/constants";
import { WhisperSettings } from "@/types/types";


type ModelConfigCardProps = {
    settings: WhisperSettings;
    updateSettings: <K extends keyof WhisperSettings>(name: K, value: WhisperSettings[K]) => void;
};

export default function ModelConfigCard({ settings, updateSettings }: ModelConfigCardProps) {
    return (
        <Card className="group relative overflow-hidden bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl border border-emerald-500/30 rounded-3xl shadow-2xl hover:shadow-emerald-500/20 transition-all duration-500">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-500/20 to-transparent rounded-bl-full"></div>
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-emerald-400 rounded-full animate-pulse"></div>

            <CardHeader className="pb-4 relative z-10">
                <CardTitle className="flex items-center gap-3 text-emerald-100 text-xl font-bold">
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl blur-md opacity-60"></div>
                        <div className="relative p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl">
                            <Cpu className="h-6 w-6 text-white" />
                        </div>
                    </div>
                    <span>AI Model Configuration</span>
                    <div className="ml-auto flex items-center space-x-2">
                        <Hexagon className="h-5 w-5 text-emerald-400 animate-spin slow" />
                        <Star className="h-4 w-4 text-amber-400 animate-pulse" />
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 relative z-10">
                <div className="space-y-3">
                    <label className="flex items-center gap-2 text-base font-semibold text-emerald-200">
                        <Gem className="h-4 w-4 text-emerald-400" />
                        LLM Provider
                    </label>
                    <Select
                        value={settings.llm}
                        onValueChange={(value: WhisperSettings["llm"]) => updateSettings("llm", value)}
                    >
                        <SelectTrigger className="w-full h-12 bg-slate-800/60 backdrop-blur-lg border-emerald-500/40 text-emerald-100 rounded-2xl hover:bg-slate-700/60 transition-all duration-300">
                            <SelectValue placeholder="Select your AI provider" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800/95 backdrop-blur-xl text-emerald-100 border border-emerald-500/30 shadow-2xl rounded-2xl">
                            {llmProviders.map((provider) => (
                                <SelectItem
                                    key={provider.value}
                                    value={provider.value}
                                    className="
                                        rounded-xl m-1
                                        data-[highlighted]:bg-emerald-500/20
                                        data-[highlighted]:text-emerald-100
                                        data-[state=checked]:bg-emerald-500/30
                                    "
                                >
                                    {provider.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-sm text-slate-300 leading-relaxed">
                        Choose your preferred AI provider for intelligent
                        responses and assistance.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}