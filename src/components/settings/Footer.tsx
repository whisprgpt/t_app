import { Crown, Gem } from "lucide-react";
import { Button } from "../ui/button";

type SettingsFooterProps = {
    isSaving: boolean,
    resetActive: boolean,
    saveActive: boolean,
    handleReset: () => void;
}

export default function Footer({
    isSaving,
    resetActive,
    saveActive,
    handleReset
}: SettingsFooterProps) {
    return (
        <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/40 via-slate-900/40 to-amber-900/40 backdrop-blur-xl rounded-3xl border border-emerald-500/20"></div>
            <div className="relative p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-3">
                    <Crown className="h-6 w-6 text-amber-400 animate-pulse" />
                    <div>
                        <h3 className="text-lg font-bold text-emerald-200">
                            Configuration Complete
                        </h3>
                        <p className="text-slate-400 text-sm">
                            Save your settings
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button
                        type="button"
                        onClick={handleReset}
                        variant="outline"
                        className={`px-6 py-3 bg-slate-800/60 border-slate-500/40 text-slate-200 hover:bg-slate-700/60 rounded-2xl transition-all duration-300 ${resetActive
                            ? "bg-amber-600 border-amber-500 text-white"
                            : ""
                            }`}
                    >
                        Reset Defaults
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSaving}
                        className={`px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-0 hover:from-emerald-700 hover:to-teal-700 rounded-2xl transition-all duration-300 shadow-xl hover:shadow-emerald-500/30 font-semibold ${saveActive ? "from-amber-500 to-orange-500" : ""
                            }`}
                    >
                        {isSaving ? (
                            <div className="flex items-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Saving...
                            </div>
                        ) : (
                            <div className="flex items-center">
                                <Gem className="h-4 w-4 mr-2" />
                                Save Settings
                            </div>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}