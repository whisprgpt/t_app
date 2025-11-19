export default function SettingsBackground() {
    return (
        <div className="absolute inset-0 overflow-hidden">
            {/* Hexagonal pattern overlay */}
            <div className="absolute inset-0 opacity-5">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <pattern
                        id="hexagons"
                        x="0"
                        y="0"
                        width="100"
                        height="87"
                        patternUnits="userSpaceOnUse"
                    >
                        <polygon
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1"
                            points="50,1 93.3,25.5 93.3,74.5 50,99 6.7,74.5 6.7,25.5"
                        />
                    </pattern>
                    <rect
                        width="100%"
                        height="100%"
                        fill="url(#hexagons)"
                        className="text-emerald-400"
                    />
                </svg>
            </div>

            {/* Floating orbs */}
            <div className="absolute top-1/4 left-1/6 w-64 h-64 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/6 w-64 h-64 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-emerald-400/10 to-amber-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>
    )
}