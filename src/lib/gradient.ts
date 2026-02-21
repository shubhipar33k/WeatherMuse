/**
 * Returns a CSS linear-gradient string based on temperature (°C).
 * Uses a pastel palette — muted, analytical, not garish.
 */
export interface GradientStyle {
    gradient: string;
    textColor: string;
    accentColor: string;
    rangeName: string;
}

export function getTemperatureGradient(temp: number): GradientStyle {
    if (temp < 0) {
        // Freezing — deep indigo / midnight violet
        return {
            gradient: "linear-gradient(135deg, #1a1a3e 0%, #2d2060 40%, #3d1a5e 80%, #1e0a3c 100%)",
            textColor: "#e8e0f5",
            accentColor: "#a78bfa",
            rangeName: "Freezing",
        };
    } else if (temp < 10) {
        // Cold — slate periwinkle / dusty blue
        return {
            gradient: "linear-gradient(135deg, #1e3a5f 0%, #2d5282 40%, #3b6fa6 70%, #1a3a5c 100%)",
            textColor: "#dbeafe",
            accentColor: "#93c5fd",
            rangeName: "Cold",
        };
    } else if (temp < 18) {
        // Mild — sage teal / muted green-blue
        return {
            gradient: "linear-gradient(135deg, #0f3d3d 0%, #1a5c5c 40%, #2a7a6a 70%, #0d3535 100%)",
            textColor: "#d1fae5",
            accentColor: "#6ee7b7",
            rangeName: "Mild",
        };
    } else if (temp < 25) {
        // Pleasant — warm amber / soft peach
        return {
            gradient: "linear-gradient(135deg, #4a2c0a 0%, #7c4a1e 40%, #a0622a 70%, #3d2008 100%)",
            textColor: "#fefce8",
            accentColor: "#fbbf24",
            rangeName: "Pleasant",
        };
    } else {
        // Hot — dusty coral / terracotta rose
        return {
            gradient: "linear-gradient(135deg, #5c1a1a 0%, #8b3030 40%, #a84040 70%, #4a1010 100%)",
            textColor: "#fce7e7",
            accentColor: "#f87171",
            rangeName: "Hot",
        };
    }
}

/**
 * Returns a lighter pastel card background for glassmorphism overlays
 */
export function getCardBackground(temp: number): string {
    const styles: Record<string, string> = {
        Freezing: "rgba(138, 112, 193, 0.12)",
        Cold: "rgba(96, 165, 250, 0.12)",
        Mild: "rgba(52, 211, 153, 0.12)",
        Pleasant: "rgba(251, 191, 36, 0.12)",
        Hot: "rgba(248, 113, 113, 0.12)",
    };
    const { rangeName } = getTemperatureGradient(temp);
    return styles[rangeName] ?? "rgba(255,255,255,0.1)";
}
