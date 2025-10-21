import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";

import ElipseDashboard from "./App";
import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";

// 🔒 Rota protegida: só deixa acessar se tiver token
function PrivateRoute({ children }) {
    const token = localStorage.getItem("authToken"); // 🔧 corrigido para "authToken"
    return token ? children : <Navigate to="/" replace />;
}

function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Login */}
                <Route path="/" element={<LoginPage />} />

                {/* Área protegida do sistema */}
                <Route
                    path="/dashboard/*"
                    element={
                        <PrivateRoute>
                            <ElipseDashboard />
                        </PrivateRoute>
                    }
                />

                {/* Registro de usuário (via convite) */}
                <Route path="/register" element={<RegisterPage />} />
            </Routes>
        </BrowserRouter>
    );
}

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <AppRouter />
    </StrictMode>
);
