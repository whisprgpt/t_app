import { useNavigate } from "react-router-dom";
import { ArrowLeft, Settings } from "lucide-react";
import { Button } from "../ui/button";

export default function Header() {
    const navigate = useNavigate();

    return (
        <div className="flex items-center mb-8 backdrop-blur-sm bg-white/5 rounded-2xl p-6 border border-white/10">
            <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="mr-4 text-white hover:bg-white/10 rounded-xl transition-all duration-300"
            >
                <ArrowLeft className="h-6 w-6 mr-2" />
            </Button>
            <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl">
                    <Settings className="h-6 w-6 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">
                        System Settings
                    </h1>
                </div>
            </div>
        </div>
    );
}