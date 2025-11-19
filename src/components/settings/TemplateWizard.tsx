import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { BookOpen, Crown, FileCode, Gem, Star } from "lucide-react";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import {
    classSystemPrompt,
    codingLanguages,
    makeCodingSystemPrompt,
    subjectClasses,
} from "./data/constants";
import type { Subject } from "@/types/ui";

type TemplateWizardProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onPrompt: (v: string) => void;
};

type WizardState =
    | { template: "none" }
    | { template: "coding"; language: string }
    | { template: "exams"; subject: Subject; customClass?: string };

export default function TemplateWizard({
    open,
    onOpenChange,
    onPrompt,
}: TemplateWizardProps) {
    const [wizardState, setWizardState] = useState<WizardState>({
        template: "none",
    });

    const isCoding = wizardState.template === "coding";
    const isExams = wizardState.template === "exams";

    const chooseExams = () =>
        setWizardState({ template: "exams", subject: "math" });

    const chooseCoding = () =>
        setWizardState({
            template: "coding",
            language: wizardState.template === "coding" ? wizardState.language : "",
        });

    const setLanguage = (lang: string) =>
        setWizardState((prev) =>
            prev.template === "coding" ? { ...prev, language: lang } : prev
        );

    const setSubject = (subject: Subject) =>
        setWizardState((prev) =>
            prev.template === "exams" ? { ...prev, subject } : prev
        );

    const setCustomClass = (v: string) =>
        setWizardState((prev) =>
            prev.template === "exams" ? { ...prev, customClass: v } : prev
        );

    const goBack = () => setWizardState({ template: "none" });

    const apply = () => {
        if (wizardState.template === "coding") {
            onPrompt(makeCodingSystemPrompt(wizardState.language));
            onOpenChange(false);
            return;
        }
        if (wizardState.template === "exams") {
            if (wizardState.subject === "other") {
                onPrompt(classSystemPrompt.other(wizardState.customClass ?? "Custom Subject"));
            } else {
                onPrompt(classSystemPrompt[wizardState.subject]);
            }
            onOpenChange(false);
        }
    };

    const isApplyDisabled =
        (isCoding && !wizardState.language) ||
        (isExams &&
            wizardState.subject === "other" &&
            !(wizardState.customClass && wizardState.customClass.trim()));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] bg-slate-800/95 backdrop-blur-xl border border-emerald-500/30 rounded-3xl overflow-hidden">
                <DialogHeader className="space-y-2 p-6 pb-4">
                    <DialogTitle className="text-emerald-100 text-xl font-bold flex items-center gap-2">
                        <Crown className="h-5 w-5 text-amber-400" />
                        {wizardState.template === "none"
                            ? "Templates"
                            : isCoding
                                ? "Select Language"
                                : "Select Subject"}
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea className="max-h-[60vh] px-6">
                    {/* Step 1: Select Template Type */}
                    {wizardState.template === "none" && (
                        <div className="grid grid-cols-1 gap-4 py-4">
                            <Button
                                variant="outline"
                                onClick={chooseCoding}
                                className="flex items-center justify-start gap-4 p-6 h-auto bg-gradient-to-r from-slate-800/60 to-cyan-900/30 border-cyan-500/40 text-emerald-100 hover:from-slate-700/60 hover:to-cyan-800/40 rounded-2xl transition-all duration-300"
                            >
                                <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl">
                                    <FileCode className="h-5 w-5 text-white" />
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-lg text-cyan-300">
                                        Developer Suite
                                    </div>
                                    <div className="text-slate-300 text-sm mt-1">
                                        Programming assistance and code optimization
                                    </div>
                                </div>
                            </Button>

                            <Button
                                variant="outline"
                                onClick={chooseExams}
                                className="flex items-center justify-start gap-4 p-6 h-auto bg-gradient-to-r from-slate-800/60 to-emerald-900/30 border-emerald-500/40 text-emerald-100 hover:from-slate-700/60 hover:to-emerald-800/40 rounded-2xl transition-all duration-300"
                            >
                                <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
                                    <BookOpen className="h-5 w-5 text-white" />
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-lg text-emerald-300">
                                        Academic Assistant
                                    </div>
                                    <div className="text-slate-300 text-sm mt-1">
                                        Study support and exam preparation
                                    </div>
                                </div>
                            </Button>
                        </div>
                    )}

                    {/* Step 2A: Coding Language */}
                    {isCoding && (
                        <div className="py-4 space-y-4">
                            <label className="block text-base font-semibold text-emerald-200">
                                Choose Programming Language
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {codingLanguages.map((lang) => (
                                    <Button
                                        key={lang.value}
                                        variant="outline"
                                        className={`justify-start p-3 bg-slate-800/60 border-slate-600/40 text-emerald-100 hover:bg-slate-700/60 rounded-xl transition-all duration-300 text-sm ${isCoding && wizardState.language === lang.label
                                            ? "bg-gradient-to-r from-cyan-900/60 to-blue-900/60 border-cyan-500/60 text-cyan-300"
                                            : ""
                                            }`}
                                        onClick={() => setLanguage(lang.label)}
                                    >
                                        <Star className="h-3 w-3 mr-2 text-amber-400" />
                                        {lang.label}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 2B: Exam Subject */}
                    {isExams && (
                        <div className="py-4 space-y-4">
                            <label className="block text-base font-semibold text-emerald-200">
                                Select Academic Subject
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {subjectClasses.map((subject) => (
                                    <Button
                                        key={subject.value}
                                        variant="outline"
                                        className={`justify-start p-3 bg-slate-800/60 border-slate-600/40 text-emerald-100 hover:bg-slate-700/60 rounded-xl transition-all duration-300 text-sm ${wizardState.subject === subject.value
                                            ? "bg-gradient-to-r from-emerald-900/60 to-teal-900/60 border-emerald-500/60 text-emerald-300"
                                            : ""
                                            }`}
                                        onClick={() => {
                                            setSubject(subject.value);
                                            if (subject.value !== "other") setCustomClass("");
                                        }}
                                    >
                                        <Star className="h-3 w-3 mr-2 text-amber-400" />
                                        {subject.label}
                                    </Button>
                                ))}
                            </div>

                            {/* Custom subject input */}
                            {wizardState.subject === "other" && (
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-emerald-200">
                                        Custom Subject Name
                                    </label>
                                    <input
                                        type="text"
                                        value={wizardState.customClass ?? ""}
                                        onChange={(e) => setCustomClass(e.target.value)}
                                        placeholder="Enter your subject or class name"
                                        className="w-full px-4 py-3 bg-slate-800/60 backdrop-blur-lg text-emerald-100 border border-emerald-500/30 rounded-xl placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-400 transition-all duration-300"
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </ScrollArea>

                {wizardState.template !== "none" && (
                    <div className="flex justify-between p-6 pt-4 border-t border-white/10">
                        <Button
                            variant="outline"
                            onClick={goBack}
                            className="bg-slate-700/50 border-slate-500/40 text-slate-200 hover:bg-slate-600/50 rounded-xl px-4"
                        >
                            Back
                        </Button>
                        <Button
                            onClick={apply}
                            disabled={isApplyDisabled}
                            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl px-4 disabled:opacity-50"
                        >
                            <Gem className="h-4 w-4 mr-2" />
                            Apply Template
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
