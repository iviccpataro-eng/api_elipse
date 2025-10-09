// src/components/ThemeProvider.jsx
import React, { createContext, useContext, useEffect, useState } from "react";

// Cria o contexto
const ThemeContext = createContext({
    theme: "light-blue",
    setTheme: () => { },
});

// Hook customizado para acessar o contexto
export const useTheme = () => useContext(ThemeContext);

// Provedor de tema
export default function ThemeProvider({ theme: initialTheme, children }) {
    const [theme, setTheme] = useState(initialTheme || "light-blue");

    // Atualiza o atributo data-theme no <html>
    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("userTheme", theme);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}
