// components/ThemeProvider.jsx
import React, { useEffect } from "react";

/**
 * ThemeProvider
 * Aplica o tema selecionado em toda a aplicação.
 * Lê o valor de `theme` e atualiza o atributo `data-theme`
 * na tag <html>, para que o CSS global (theme.css) entre em vigor.
 */

export default function ThemeProvider({ theme = "light-blue", children }) {
    useEffect(() => {
        // ✅ Aplica o tema globalmente
        document.documentElement.setAttribute("data-theme", theme);
        // ✅ Armazena o tema no localStorage para persistência
        localStorage.setItem("userTheme", theme);
    }, [theme]);

    return <>{children}</>;
}
