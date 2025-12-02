import React, { useEffect } from "react";
import { TriangleAlert, X } from "lucide-react";

export default function AlarmBanner({ banner, onClose }) {
    if (!banner) return null;

    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000);

        return () => clearTimeout(timer);
    }, [banner]);

    const colors = {
        0: "bg-blue-100 text-blue-900",
        1: "bg-yellow-100 text-[#D4A202]",
        2: "bg-red-100 text-red-800",
        3: "bg-red-600 text-[#EFB807] animate-pulse"
    }[severity] || "bg-gray-300 text-gray-800";

    return (
        <div
            className={`
                fixed top-4 left-1/2 -translate-x-1/2
                px-4 py-2 rounded-lg shadow-lg z-50
                flex items-center gap-3
                animate-slideDown
                ${colors[banner.severity] || "bg-red-600 text-white"}
            `}
        >
            <TriangleAlert className="w-6 h-6" />
            <span>{banner.message}</span>

            <button onClick={onClose} className="ml-3">
                <X className="w-5 h-5" />
            </button>
        </div>
    );
}
