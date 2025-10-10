// src/components/ThemeProvider.jsx
import React, {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

// 🔹 Criação do contexto
const ThemeContext = createContext(undefined);

// 🔹 Hook seguro (verifica se está dentro do Provider)
export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        console.warn(
            "[ThemeProvider] useTheme() foi usado fora do contexto do ThemeProvider."
        );
        return { theme: "light-blue", setTheme: () => { } };
    }
    return context;
}

// 🔹 Componente provedor
export default function ThemeProvider({ theme: initialTheme, children }) {
    const [theme, setTheme] = useState(initialTheme || "light-blue");

    // Mantém o tema entre sessões
    useEffect(() => {
        const savedTheme = localStorage.getItem("userTheme");
        if (savedTheme && savedTheme !== theme) {
            setTheme(savedTheme);
        }
    }, []);

    // Aplica o tema no <html> e salva localmente
    useEffect(() => {
        if (theme) {
            document.documentElement.setAttribute("data-theme", theme);
            localStorage.setItem("userTheme", theme);
        }
    }, [theme]);

    // Memoriza o valor do contexto (evita re-renderizações desnecessárias)
    const value = useMemo(() => ({ theme, setTheme }), [theme]);

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}
