// src/components/ThemeProvider.jsx
import React, { useEffect } from "react";

export default function ThemeProvider({ theme, children }) {
    useEffect(() => {
        if (theme) {
            document.documentElement.setAttribute("data-theme", theme);
            localStorage.setItem("userTheme", theme);
        } else {
            const saved = localStorage.getItem("userTheme") || "light-blue";
            document.documentElement.setAttribute("data-theme", saved);
        }
    }, [theme]);

    return <>{children}</>;
}
