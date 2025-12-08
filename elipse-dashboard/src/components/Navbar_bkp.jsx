// src/components/Navbar.jsx
import React, { useState, useEffect, useRef } from "react";
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

function getInitials(name = "") {
    return name
        .split(" ")
        .map((p) => p[0]?.toUpperCase())
        .join("")
        .slice(0, 2);
}

function translateRole(role) {
    if (!role) return "Usuário";
    const map = {
        admin: "Administrador",
        user: "Operador",
        supervisor: "Supervisor",
        client: "Cliente",
        maintenance: "Manutenção",
    };
    return map[role.toLowerCase()] || role;
}

export default function Navbar({ onLogout }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [buildingName, setBuildingName] = useState("Carregando...");
    const [user, setUser] = useState({ name: "Usuário", role: "operator", image: null });

    const avatarDesktopRef = useRef(null);
    const avatarTabletRef = useRef(null);

    // Fechar UserMenu ao clicar fora
    useEffect(() => {
        function handleClickOutside(e) {
            const clickedOutsideDesktop =
                avatarDesktopRef.current &&
                !avatarDesktopRef.current.contains(e.target);

            const clickedOutsideTablet =
                avatarTabletRef.current &&
                !avatarTabletRef.current.contains(e.target);

            if (clickedOutsideDesktop && clickedOutsideTablet) {
                setUserMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchBuildingName = async () => {
            try {
                const token = localStorage.getItem("authToken");
                const res = await fetch(`${API_BASE}/config/system`, {
                    headers: { Authorization: `Bearer ${token}` },
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

        // Carregar usuário salvo no token
        try {
            const token = localStorage.getItem("authToken");
            if (token) {
                const payload = JSON.parse(atob(token.split(".")[1]));

                setUser({
                    name:
                        payload?.user ||     // ✔ valor REAL do seu token
                        payload?.username ||
                        payload?.name ||
                        "Usuário",
                    role: payload?.role || "operador",
                    image: payload?.image || null,
                });
            }
        } catch (err) {
            console.error("Erro ao decodificar token:", err);
        }
    }, []);

    const navItems = [
        { to: "/dashboard", label: "Dashboard", icon: <Eye className="w-5 h-5" /> },
        { to: "/arcondicionado", label: "Ar Condicionado", icon: <Fan className="w-5 h-5" /> },
        { to: "/iluminacao", label: "Iluminação", icon: <Lightbulb className="w-5 h-5" /> },
        { to: "/eletrica", label: "Elétrica", icon: <Zap className="w-5 h-5" /> },
        { to: "/hidraulica", label: "Hidráulica", icon: <Droplet className="w-5 h-5" /> },
        { to: "/incendio", label: "Incêndio", icon: <Flame className="w-5 h-5" /> },
        { to: "/comunicacao", label: "Comunicação", icon: <Signal className="w-5 h-5" /> },
    ];

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-gray-800 text-white px-6 py-4 flex items-center justify-between shadow-md">

            {/* LOGO + EDIFÍCIO */}
            <div className="flex items-center gap-4">
                <img src={logo} alt="Logo" className="h-10 w-20 object-contain" />
                <div className="border-l border-gray-500 h-8" />
                <span className="text-lg font-semibold whitespace-nowrap">{buildingName}</span>
            </div>

            {/* DESKTOP NAV */}
            <nav className="hidden xl:flex gap-6 items-center">

                {navItems.map((item) => (
                    <Link key={item.to} to={item.to} className="hover:text-blue-400">
                        {item.label}
                    </Link>
                ))}

                {/* AVATAR */}
                <div ref={avatarDesktopRef} className="relative">
                    <button
                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                        className="w-10 h-10 rounded-full bg-gray-600 hover:bg-gray-500 flex items-center justify-center font-semibold"
                    >
                        {user.image ? (
                            <img
                                src={user.image}
                                alt="avatar"
                                className="w-full h-full object-cover rounded-full"
                            />
                        ) : (
                            getInitials(user.name)
                        )}
                    </button>

                    {/* DROPDOWN */}
                    {userMenuOpen && (
                        <div className="absolute right-0 mt-3 w-56 bg-white text-gray-800 rounded-xl shadow-xl p-4 z-50"
                            onClick={(e) => e.stopPropagation()}>
                            <div className="flex flex-col items-center pb-3 border-b">
                                <div className="w-14 h-14 rounded-full bg-gray-300 flex items-center justify-center text-lg font-bold">
                                    {getInitials(user.name)}
                                </div>
                                <p className="mt-2 font-semibold">{user.name}</p>
                                <p className="text-sm italic text-gray-500">{translateRole(user.role)}</p>
                            </div>

                            {/* MENU OPTIONS */}
                            <div className="flex flex-col pt-3">
                                <Link
                                    to="/tools"
                                    onClick={() => setUserMenuOpen(false)} // 👈 fecha o menu corretamente
                                    className="px-2 py-2 hover:bg-gray-100 rounded flex items-center gap-2"
                                >

                                    <Settings className="w-4 h-4" /> Configurações
                                </Link>
                                <button
                                    onClick={() => {
                                        setUserMenuOpen(false); // 👈 fecha menu
                                        onLogout(); // 👈 executa logout sem interferência
                                    }}
                                    className="px-2 py-2 hover:bg-gray-100 rounded flex items-center gap-2 text-red-600">
                                    <LogOut className="w-4 h-4" /> Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </nav>

            {/* TABLET NAV */}
            <nav className="hidden lg:flex xl:hidden gap-6 items-center">

                {navItems.map((item) => (
                    <Link key={item.to} to={item.to}>
                        {item.icon}
                    </Link>
                ))}

                {/* AVATAR */}
                <div ref={avatarTabletRef} className="relative">
                    <button
                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                        className="w-10 h-10 rounded-full bg-gray-600 hover:bg-gray-500 flex items-center justify-center font-semibold"
                    >
                        {getInitials(user.name)}
                    </button>

                    {userMenuOpen && (
                        <div className="absolute right-0 mt-3 w-56 bg-white text-gray-800 rounded-xl shadow-xl p-4 z-50"
                            onClick={(e) => e.stopPropagation()}>

                            <div className="flex flex-col items-center pb-3 border-b">
                                <div className="w-14 h-14 rounded-full bg-gray-300 flex items-center justify-center text-lg font-bold">
                                    {getInitials(user.name)}
                                </div>
                                <p className="mt-2 font-semibold">{user.name}</p>
                                <p className="text-sm italic text-gray-500">{translateRole(user.role)}</p>
                            </div>

                            <div className="flex flex-col pt-3">
                                <Link to="/tools"
                                    onClick={() => setUserMenuOpen(false)} // 👈 fecha o menu corretamente
                                    className="px-2 py-2 hover:bg-gray-100 rounded flex items-center gap-2">
                                    <Settings className="w-4 h-4" /> Configurações
                                </Link>
                                <button
                                    onClick={() => {
                                        setUserMenuOpen(false); // 👈 fecha menu
                                        onLogout(); // 👈 executa logout sem interferência
                                    }}
                                    className="px-2 py-2 hover:bg-gray-100 rounded flex items-center gap-2 text-red-600">
                                    <LogOut className="w-4 h-4" /> Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>

            </nav>

            {/* MOBILE MENU BUTTON */}
            <div className="lg:hidden">
                <button onClick={() => setMenuOpen(!menuOpen)}>
                    {menuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
                </button>
            </div>

            {/* MOBILE DRAWER */}
            {menuOpen && (
                <div className="absolute top-16 left-0 w-full bg-gray-900 text-white flex flex-col gap-6 p-6 z-50">

                    {/* USER BLOCK */}
                    <div className="flex items-center gap-3 pb-4 border-b border-gray-700">
                        <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center text-lg font-semibold">
                            {getInitials(user.name)}
                        </div>
                        <div>
                            <p className="font-semibold">{user.name}</p>
                            <p className="text-sm italic text-gray-300">{translateRole(user.role)}</p>
                        </div>
                    </div>

                    {navItems.map((item) => (
                        <Link
                            key={item.to}
                            to={item.to}
                            onClick={() => setMenuOpen(false)}
                            className="hover:text-blue-400 flex items-center gap-3 text-lg"
                        >
                            {item.icon}
                            {item.label}
                        </Link>
                    ))}

                    {/* BOTTOM ACTIONS */}
                    <div className="pt-4 border-t border-gray-700 flex flex-col gap-4">
                        <Link to="/tools" className="flex items-center gap-2 hover:text-blue-400">
                            <Settings className="w-5 h-5" /> Configurações
                        </Link>

                        <button
                            onClick={() => { setMenuOpen(false); onLogout(); }}
                            className="flex items-center gap-2 text-red-500"
                        >
                            <LogOut className="w-5 h-5" /> Logout
                        </button>
                    </div>
                </div>
            )}
        </header>
    );
}
