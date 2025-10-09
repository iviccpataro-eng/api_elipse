// src/components/Navbar.jsx
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
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
    const location = useLocation();

    useEffect(() => {
        const fetchBuildingName = async () => {
            try {
                const res = await fetch(`${API_BASE}/config/building`);
                if (res.ok) {
                    const data = await res.json();
                    setBuildingName(data.name || "Edifício Padrão");
                } else {
                    setBuildingName("Edifício Padrão");
                }
            } catch (err) {
                console.error("Erro ao buscar nome do edifício:", err);
                setBuildingName("Edifício Padrão");
            }
        };
        fetchBuildingName();
    }, []);

    const navItems = [
        { to: "/dashboard", label: "Dashboard", icon: <Eye className="w-5 h-5" /> },
        { to: "/dashboard/ar", label: "Ar Condicionado", icon: <Fan className="w-5 h-5" /> },
        { to: "/dashboard/iluminacao", label: "Iluminação", icon: <Lightbulb className="w-5 h-5" /> },
        { to: "/dashboard/eletrica", label: "Elétrica", icon: <Zap className="w-5 h-5" /> },
        { to: "/dashboard/hidraulica", label: "Hidráulica", icon: <Droplet className="w-5 h-5" /> },
        { to: "/dashboard/incendio", label: "Incêndio", icon: <Flame className="w-5 h-5" /> },
        { to: "/dashboard/comunicacao", label: "Comunicação", icon: <Signal className="w-5 h-5" /> },
        { to: "/tools", label: "Ferramentas", icon: <Settings className="w-5 h-5" /> },
    ];

    return (
        <header
            className="px-6 py-4 flex items-center justify-between relative shadow-md transition-colors"
            style={{
                backgroundColor: "var(--navbar-bg)",
                color: "var(--navbar-text)",
                borderBottom: "1px solid var(--border-color)",
            }}
        >
            {/* Logo + Nome do prédio */}
            <div className="flex items-center gap-3">
                <img src={logo} alt="Logo" className="h-10 w-20" />
                <div
                    className="h-8 w-px"
                    style={{ backgroundColor: "var(--border-color)" }}
                />
                <span className="text-lg font-semibold">{buildingName}</span>
            </div>

            {/* Menu Desktop (≥1280px) - Texto */}
            <nav className="hidden xl:flex gap-6 items-center">
                {navItems.map((item) => (
                    <Link
                        key={item.to}
                        to={item.to}
                        className={`hover:text-[var(--accent)] transition-colors ${location.pathname === item.to
                            ? "font-semibold text-[var(--accent)]"
                            : ""
                            }`}
                    >
                        {item.label}
                    </Link>
                ))}
                <button
                    onClick={onLogout}
                    className="flex items-center gap-2 px-3 py-2 rounded transition"
                    style={{
                        backgroundColor: "var(--danger)",
                        color: "#fff",
                    }}
                    onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "var(--danger-hover)")
                    }
                    onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "var(--danger)")
                    }
                >
                    <LogOut className="w-5 h-5" /> Logout
                </button>
            </nav>

            {/* Menu Tablet (1024px–1279px) - Ícones */}
            <nav className="hidden lg:flex xl:hidden gap-6 items-center">
                {navItems.map((item) => (
                    <Link
                        key={item.to}
                        to={item.to}
                        className={`hover:text-[var(--accent)] ${location.pathname === item.to
                            ? "text-[var(--accent)]"
                            : ""
                            }`}
                    >
                        {item.icon}
                    </Link>
                ))}
                <button
                    onClick={onLogout}
                    className="p-2 rounded transition"
                    style={{ backgroundColor: "var(--danger)", color: "#fff" }}
                    onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "var(--danger-hover)")
                    }
                    onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "var(--danger)")
                    }
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </nav>

            {/* Menu Mobile (<1024px) */}
            <div className="lg:hidden">
                <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    style={{ color: "var(--navbar-text)" }}
                >
                    {menuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
                </button>
            </div>

            {/* Drawer Mobile */}
            {menuOpen && (
                <div
                    className="absolute top-16 left-0 w-full flex flex-col gap-4 p-6 z-50 transition-all"
                    style={{
                        backgroundColor: "var(--navbar-bg)",
                        color: "var(--navbar-text)",
                        borderTop: "1px solid var(--border-color)",
                    }}
                >
                    {navItems.map((item) => (
                        <Link
                            key={item.to}
                            to={item.to}
                            onClick={() => setMenuOpen(false)}
                            className={`flex items-center gap-2 hover:text-[var(--accent)] ${location.pathname === item.to
                                ? "text-[var(--accent)]"
                                : ""
                                }`}
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
                        className="flex items-center gap-2 px-3 py-2 rounded transition"
                        style={{
                            backgroundColor: "var(--danger)",
                            color: "#fff",
                        }}
                        onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor =
                            "var(--danger-hover)")
                        }
                        onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor = "var(--danger)")
                        }
                    >
                        <LogOut className="w-5 h-5" /> Logout
                    </button>
                </div>
            )}
        </header>
    );
}
