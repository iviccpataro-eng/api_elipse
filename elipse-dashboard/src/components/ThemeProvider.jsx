// src/components/ThemeProvider.jsx
import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export default function ThemeProvider({ children, theme: initialTheme = "light-blue" }) {
    const [theme, setTheme] = useState(initialTheme);

    // Aplica o tema ao <html data-theme="">
    useEffect(() => {
        if (theme) {
            document.documentElement.setAttribute("data-theme", theme);
            localStorage.setItem("userTheme", theme);
        }
    }, [theme]);

    // Ao iniciar, recupera o tema salvo localmente
    useEffect(() => {
        const stored = localStorage.getItem("userTheme");
        if (stored && stored !== theme) setTheme(stored);
    }, []);

    // Atualiza tema do usuário no banco de dados (se estiver logado)
    async function saveThemeToServer(themeName) {
        const token = localStorage.getItem("authToken");
        if (!token) return;

        try {
            await fetch(
                import.meta.env.VITE_API_BASE_URL + "/users/theme",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ theme: themeName }),
                }
            );
        } catch (err) {
            console.warn("⚠️ Falha ao salvar tema no servidor:", err);
        }
    }

    // Função para alternar o tema
    const toggleTheme = (themeName) => {
        setTheme(themeName);
        saveThemeToServer(themeName);
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme: toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}
