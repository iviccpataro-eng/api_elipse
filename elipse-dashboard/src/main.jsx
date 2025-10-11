// src/main.jsx
import React, { StrictMode, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";

// 🧩 Importações principais
import ElipseDashboard from "./App";
import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";
import { ThemeProvider } from "./components/ThemeProvider";

// 🔒 Rota protegida: só deixa acessar se tiver token válido
function PrivateRoute({ children }) {
  const token = localStorage.getItem("authToken");
  return token ? children : <Navigate to="/" replace />;
}

// 🚀 Componente de rotas principais
function AppRouter() {
  const [theme, setTheme] = useState("light-blue");

  // Carrega o tema salvo no localStorage
  useEffect(() => {
    const saved = localStorage.getItem("userTheme");
    if (saved) setTheme(saved);
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <Routes>
          {/* Login */}
          <Route path="/" element={<LoginPage />} />

          {/* Área protegida */}
          <Route
            path="/dashboard/*"
            element={
              <PrivateRoute>
                <ElipseDashboard />
              </PrivateRoute>
            }
          />

          {/* Registro via convite */}
          <Route path="/register" element={<RegisterPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

// 🏁 Renderização principal
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>
);
