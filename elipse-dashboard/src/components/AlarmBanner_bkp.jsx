// src/components/AlarmBanner.jsx
import React, { useEffect } from "react";
import { TriangleAlert, X } from "lucide-react";

export default function AlarmBanner({ message, severity = 2, visible, onClose }) {

    useEffect(() => {
        if (!visible) return;
        const t = setTimeout(() => onClose(), 4000);
        return () => clearTimeout(t);
    }, [visible, message, onClose]);

    if (!visible || !message) return null;

    const classes = {
        0: "bg-blue-100 text-blue-900",
        1: "bg-yellow-100 text-[#D4A202]",
        2: "bg-red-100 text-red-800",
        3: "bg-red-600 text-[#EFB807] animate-pulse"
    }[severity] || "bg-gray-200 text-gray-800";

    return (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg 
            flex items-center gap-3 z-50 animate-slideDown ${classes}`}>

            <TriangleAlert className="w-5 h-5" />
            <span className="font-medium">{message}</span>

            <button onClick={onClose} className="ml-3">
                <X className="w-4 h-4 opacity-80" />
            </button>
        </div>
    );
}
