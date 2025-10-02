// src/components/Navbar.jsx
import React, { useState } from "react";
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

export default function Navbar({ onLogout }) {
    const [menuOpen, setMenuOpen] = useState(false);

    const navItems = [
        { to: "/dashboard", label: "Dashboard", icon: <Eye className="w-5 h-5" /> },
        { to: "/dashboard/ar", label: "Ar Condicionado", icon: <Fan className="w-5 h-5" /> },
        { to: "/dashboard/iluminacao", label: "Iluminação", icon: <Lightbulb className="w-5 h-5" /> },
        { to: "/dashboard/eletrica", label: "Elétrica", icon: <Zap className="w-5 h-5" /> },
        { to: "/dashboard/hidraulica", label: "Hidráulica", icon: <Droplet className="w-5 h-5" /> },
        { to: "/dashboard/incendio", label: "Incêndio", icon: <Flame className="w-5 h-5" /> },
        { to: "/dashboard/comunicacao", label: "Comunicação", icon: <Signal className="w-5 h-5" /> },
        { to: "/dashboard/tools", label: "Ferramentas", icon: <Settings className="w-5 h-5" /> },
    ];

    return (
        <header className="bg-gray-800 text-white px-6 py-4 flex items-center justify-between">
            {/* Logo + Nome do prédio */}
            <div className="flex items-center gap-3">
                <img src=".\images\logo.png" alt="Logo" className="h-10 w-10" />
                <div className="h-8 w-px bg-gray-500" />
                <span className="text-lg font-semibold">Edifício Exemplo</span>
            </div>

            {/* Menu Desktop (≥1280px) - Texto */}
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

            {/* Menu Tablet (1024px–1279px) - Ícones */}
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
                            className="hover:text-blue-400"
                        >
                            {item.label}
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
