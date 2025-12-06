// src/components/AlarmBanner.jsx
import React from "react";
import { TriangleAlert, X } from "lucide-react";

export default function AlarmBanner({ banner, onClose, onClick }) {
    if (!banner) return null;

    const { message = "", severity = 0 } = banner;

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
            className={`fixed top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg flex items-center gap-3 z-50 cursor-pointer ${classes}`}
            onClick={onClick}
        >
            <TriangleAlert className="w-5 h-5" />

            <span className="font-medium">{message}</span>

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                }}
                className="ml-3"
            >
                <X className="w-4 h-4 opacity-80" />
            </button>
        </div>
    );
}
