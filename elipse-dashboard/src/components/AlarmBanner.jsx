// src/components/AlarmBanner.jsx
import React from "react";
import { TriangleAlert, X } from "lucide-react";

/**
 * banner = {
 *   name,
 *   source,
 *   severity,
 *   disciplineRoute,
 *   tag
 * }
 */

export default function AlarmBanner({ banner, onClose, onClick }) {
    if (!banner) return null;

    const { name, source, severity } = banner;

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
            className={`fixed top-[80px] left-1/2 -translate-x-1/2 z-[9999] shadow-lg px-6 py-3 rounded-lg cursor-pointer transition-all w-[90%] max-w-2xl flex flex-col gap-1 ${classes}`}
            onClick={onClick}
        >
            <div className="flex items-center gap-2">
                <TriangleAlert className="w-5 h-5 shrink-0" />
                <span className="font-bold text-lg">{name}</span>
            </div>

            <span className="text-sm opacity-90">{source}</span>

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
