import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
    display: "swap",
});

export const metadata: Metadata = {
    title: "WeatherMuse — Weather Optimised for Productivity",
    description:
        "WeatherMuse is a context-aware productivity engine that converts environmental signals into structured task recommendations. From rule-based heuristics to personalized ML models.",
    keywords: ["weather", "productivity", "AI", "context engine", "scheduling"],
    openGraph: {
        title: "WeatherMuse",
        description: "Weather optimised for productivity.",
        type: "website",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={inter.variable}>
            <body>{children}</body>
        </html>
    );
}
