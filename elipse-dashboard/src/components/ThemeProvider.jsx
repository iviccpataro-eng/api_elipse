// src/components/ThemeProvider.jsx
import React, {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

const ThemeContext = createContext(undefined);

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        console.warn("[ThemeProvider] useTheme() usado fora do ThemeProvider.");
        return { theme: "light-blue", setTheme: () => { } };
    }
    return context;
}

export function ThemeProvider({ theme: initialTheme, children }) {
    const getPreferredTheme = () => {
        if (typeof window === "undefined") return initialTheme || "light-blue";
        const saved = localStorage.getItem("userTheme");
        if (saved) return saved;
        const prefersDark =
            window.matchMedia &&
            window.matchMedia("(prefers-color-scheme: dark)").matches;
        return prefersDark ? "dark-blue" : "light-blue";
    };

    const [theme, setTheme] = useState(getPreferredTheme);

    useEffect(() => {
        if (typeof document !== "undefined" && theme) {
            document.documentElement.setAttribute("data-theme", theme);
            localStorage.setItem("userTheme", theme);
        }
    }, [theme]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const media = window.matchMedia("(prefers-color-scheme: dark)");
        const handler = () => {
            const prefersDark = media.matches;
            setTheme((prev) =>
                prev.includes("light") && prefersDark
                    ? prev.replace("light", "dark")
                    : prev.includes("dark") && !prefersDark
                        ? prev.replace("dark", "light")
                        : prev
            );
        };
        media.addEventListener("change", handler);
        return () => media.removeEventListener("change", handler);
    }, []);

    const value = useMemo(() => ({ theme, setTheme }), [theme]);
    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export default ThemeProvider;
