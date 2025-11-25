import React from "react";
import { Bell, BellRing } from "lucide-react";

export default function AlarmFab({ count, hasNew, onClick }) {
    return (
        <button
            onClick={onClick}
            className="fixed bottom-6 right-6 bg-white shadow-xl rounded-full 
                       w-14 h-14 flex items-center justify-center border
                       hover:shadow-2xl transition z-50"
        >
            {hasNew ? (
                <BellRing className="w-8 h-8 text-red-600" />
            ) : (
                <Bell className="w-8 h-8 text-gray-600" />
            )}

            {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white 
                                 text-xs rounded-full px-2 py-0.5">
                    {count}
                </span>
            )}
        </button>
    );
}
