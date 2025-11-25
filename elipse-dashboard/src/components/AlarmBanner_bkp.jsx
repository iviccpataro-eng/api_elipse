import React, { useEffect } from "react";
import { AlarmTriangle } from "lucide-react";

export default function AlarmBanner({ message, visible, onClose }) {
    useEffect(() => {
        if (!visible) return;
        const timer = setTimeout(() => onClose(), 5000);
        return () => clearTimeout(timer);
    }, [visible]);

    if (!visible) return null;

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white 
                        px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-slideDown">
            <AlarmTriangle className="w-6 h-6" />
            <span>{message}</span>
        </div>
    );
}
