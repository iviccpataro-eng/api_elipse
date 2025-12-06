// components/AlarmBanner.jsx
import React from "react";
import { X } from "lucide-react";

/**
 * Banner de alarme com suporte a severidade, timeout e navegação.
 *
 * Exige o objeto:
 * banner = {
 *   name,
 *   equipment,
 *   floor,
 *   building,
 *   severity,
 *   tag,
 *   disciplineRoute,
 * }
 */

export default function AlarmBanner({ banner, onClose, onClick }) {
    if (!banner) return null;

    const { name, equipment, floor, building, severity } = banner;

    // Classes por severidade (mantidas)
    const classes =
        severity === 3
            ? "bg-red-600 text-yellow-400 animate-pulse"
            : severity === 2
                ? "bg-red-100 text-red-800"
                : severity === 1
                    ? "bg-yellow-100 text-[#D4A202]"
                    : "bg-blue-100 text-blue-900";

    return (
        <div
            className={`fixed top-20 left-1/2 -translate-x-1/2 z-[9999] shadow-lg px-6 py-3 rounded-lg cursor-pointer transition-all w-[90%] max-w-2xl ${classes}`}
            onClick={onClick}
        >
            <TriangleAlert className="w-5 h-5" />
            {/* DESKTOP / TABLET */}
            <div className="hidden sm:flex flex-col">
                <p className="font-bold text-lg">
                    {name} – {equipment} – {floor} – {building}
                </p>
            </div>

            {/* CELULAR */}
            <div className="sm:hidden flex flex-col">
                <p className="font-bold text-lg">{name}</p>
                <p className="text-sm opacity-80 -mt-1">
                    {equipment} – {floor} – {building}
                </p>
            </div>

            <button
                className="absolute top-2 right-2 p-1"
                onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                }}
            >
                <X size={18} />
            </button>
        </div>
    );
}
