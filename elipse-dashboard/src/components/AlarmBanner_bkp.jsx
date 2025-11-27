// src/components/AlarmBanner.jsx
import React, { useEffect } from "react";
import { TriangleAlert, X } from "lucide-react";

export default function AlarmBanner({ message, visible, onClose }) {
    useEffect(() => {
        if (!visible) return;
        const timer = setTimeout(() => onClose(), 5000);
        return () => clearTimeout(timer);
    }, [visible, onClose]);

    if (!visible || !message) return null;

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white
                    px-4 py-2 rounded-lg shadow-lg flex items-center gap-3 z-50 animate-slideDown">
            <TriangleAlert className="w-5 h-5" />
            <span className="font-medium">{message}</span>
            <button onClick={onClose} className="ml-3">
                <X className="w-4 h-4 text-white opacity-80" />
            </button>
        </div>
    );
}
