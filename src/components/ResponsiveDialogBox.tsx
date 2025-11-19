// components/ui/ResponsiveDialog.tsx
import {
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "../components/ui/dialog";
import { cn } from "../lib/utils";
import { ReactNode } from "react";

type Tone = "neutral" | "red" | "amber" | "emerald" | "purple";

const toneClasses: Record<Tone, string> = {
    neutral: "border border-gray-700/50 bg-gradient-to-br from-black/90 to-gray-900/90",
    red: "border-2 border-red-500/30 bg-gradient-to-br from-slate-900/95 to-red-950/40",
    amber: "border-2 border-amber-400/40 bg-gradient-to-br from-slate-900/95 to-amber-950/40",
    emerald: "border-2 border-emerald-500/30 bg-gradient-to-br from-slate-900/95 to-emerald-950/30",
    purple: "border-2 border-purple-500/30 bg-gradient-to-br from-black/90 to-gray-900/90",
};

type Props = {
    tone?: Tone;
    title: ReactNode;
    description?: ReactNode;
    footer?: ReactNode;     // buttons
    children?: ReactNode;   // extra content
    className?: string;     // tweak shell if needed
    headerClassName?: string;
    titleClassName?: string;
    descriptionClassName?: string;
    footerClassName?: string;
    bodyClassName?: string; // optional wrapper around children
};

export function ResponsiveDialog({
    tone = "neutral",
    title,
    description,
    footer,
    children,
    className,
    headerClassName,
    titleClassName,
    descriptionClassName,
    footerClassName,
    bodyClassName,
}: Props) {
    return (
        <DialogContent
            className={cn(
                // sizes — SAME as the old scrollable version
                "w-[95vw] max-w-[95vw] sm:max-w-md md:max-w-lg lg:max-w-xl",
                "min-w-[400px] min-h-[200px]",
                "max-h-[90vh] overflow-y-auto",     // ← scrollable shell
                // keep default paddings from shadcn; no spacing overrides here
                "backdrop-blur-xl rounded-xl",
                toneClasses[tone],
                className
            )}
        >
            <DialogHeader className={cn(headerClassName)}>
                <DialogTitle className={cn("text-white text-lg sm:text-xl font-bold", titleClassName)}>
                    {title}
                </DialogTitle>
                {description && (
                    <DialogDescription
                        className={cn("text-gray-300 leading-relaxed text-sm sm:text-base", descriptionClassName)}
                    >
                        {description}
                    </DialogDescription>
                )}
            </DialogHeader>

            {children && <div className={cn(bodyClassName)}>{children}</div>}

            {footer && (
                <DialogFooter className={cn(footerClassName)}>
                    {footer}
                </DialogFooter>
            )}
        </DialogContent>
    );
}
