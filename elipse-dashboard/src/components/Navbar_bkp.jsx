// src/components/Navbar.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
    Eye,
    Fan,
    Lightbulb,
    Zap,
    Droplet,
    Flame,
    Signal,
    Settings,
    LogOut,
    Menu,
    X,
} from "lucide-react";
import logo from "../images/logo.png";

const API_BASE =
    import.meta?.env?.VITE_API_BASE_URL || "https://api-elipse.onrender.com";

export default function Navbar({ onLogout }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [buildingName, setBuildingName] = useState("Carregando...");

    useEffect(() => {
        const fetchBuildingName = async () => {
            try {
                const token = localStorage.getItem("authToken");
                const res = await fetch(`${API_BASE}/config/system`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (!res.ok) throw new Error("Falha ao buscar nome do edifício");
                const data = await res.json();
                const name =
                    data?.config?.buildingname?.trim() || "Edifício Padrão";
                setBuildingName(name);
            } catch (err) {
                console.error("Erro ao buscar nome do edifício:", err);
                setBuildingName("Edifício Padrão");
            }
        };
        fetchBuildingName();
    }, []);

    const navItems = [
        { to: "/dashboard", label: "Dashboard", icon: <Eye className="w-5 h-5" /> },
        { to: "/arcondicionado", label: "Ar Condicionado", icon: <Fan className="w-5 h-5" /> },
        { to: "/iluminacao", label: "Iluminação", icon: <Lightbulb className="w-5 h-5" /> },
        { to: "/eletrica", label: "Elétrica", icon: <Zap className="w-5 h-5" /> },
        { to: "/hidraulica", label: "Hidráulica", icon: <Droplet className="w-5 h-5" /> },
        { to: "/incendio", label: "Incêndio", icon: <Flame className="w-5 h-5" /> },
        { to: "/comunicacao", label: "Comunicação", icon: <Signal className="w-5 h-5" /> },
        { to: "/tools", label: "Ferramentas", icon: <Settings className="w-5 h-5" /> },
    ];

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-gray-800 text-white px-6 py-4 flex items-center justify-between shadow-md">
            {/* Logo + Nome do edifício */}
            <div className="flex items-center gap-4">
                <img src={logo} alt="Logo" className="h-10 w-20 object-contain" />
                <div className="border-l border-gray-500 h-8" />
                <span className="text-lg font-semibold whitespace-nowrap">
                    {buildingName}
                </span>
            </div>

            {/* Menu Desktop (≥1280px) */}
            <nav className="hidden xl:flex gap-6 items-center">
                {navItems.map((item) => (
                    <Link key={item.to} to={item.to} className="hover:text-blue-400">
                        {item.label}
                    </Link>
                ))}
                <button
                    onClick={onLogout}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-3 py-2 rounded"
                >
                    <LogOut className="w-5 h-5" /> Logout
                </button>
            </nav>

            {/* Menu Tablet (1024–1279px) */}
            <nav className="hidden lg:flex xl:hidden gap-6 items-center">
                {navItems.map((item) => (
                    <Link key={item.to} to={item.to} className="hover:text-blue-400">
                        {item.icon}
                    </Link>
                ))}
                <button
                    onClick={onLogout}
                    className="bg-red-600 hover:bg-red-700 p-2 rounded"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </nav>

            {/* Menu Mobile (<1024px) */}
            <div className="lg:hidden">
                <button onClick={() => setMenuOpen(!menuOpen)}>
                    {menuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
                </button>
            </div>

            {/* Drawer Mobile */}
            {menuOpen && (
                <div className="absolute top-16 left-0 w-full bg-gray-900 text-white flex flex-col gap-4 p-6 z-50">
                    {navItems.map((item) => (
                        <Link
                            key={item.to}
                            to={item.to}
                            onClick={() => setMenuOpen(false)}
                            className="hover:text-blue-400 flex items-center gap-2"
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </Link>
                    ))}
                    <button
                        onClick={() => {
                            setMenuOpen(false);
                            onLogout();
                        }}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-3 py-2 rounded"
                    >
                        <LogOut className="w-5 h-5" /> Logout
                    </button>
                </div>
            )}
        </header>
    );
}
