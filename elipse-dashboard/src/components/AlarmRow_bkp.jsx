// src/components/AlarmRow.jsx
import React from "react";
import { Check, X, AlertTriangle, Clock } from "lucide-react";

/**
 * alarm: {
 *  id, tag, name, active, severity, timestampIn, timestampOut, ack, ackUser, ackTimestamp, message
 * }
 */

function getAlarmClasses(alarm) {
    const isAck = alarm.ack;
    const active = alarm.active;
    const sev = Number(alarm.severity || 0);

    // Colors mapping (Tailwind classes)
    if (isAck) {
        return active ? "bg-green-100 text-green-800" : "bg-gray-100 text-green-900";
    }

    switch (sev) {
        case 0:
            return active ? "bg-blue-100 text-blue-900" : "bg-gray-100 text-blue-900";
        case 1:
            return active ? "bg-yellow-100 text-[#D4A202]" : "bg-gray-100 text-[#D4A202]";
        case 2:
            return active ? "bg-red-100 text-red-800" : "bg-gray-100 text-red-800";
        case 3:
            // active:true -> blinking: use animate-pulse and stronger bg/text
            return active ? "bg-red-600 text-[#EFB807] animate-pulse" : "bg-red-100 text-[#D4A202]";
        default:
            return "bg-gray-100 text-gray-800";
    }
}

function formatShort(dt) {
    if (!dt) return "-";
    try {
        const d = new Date(dt);
        return d.toLocaleString();
    } catch {
        return dt;
    }
}

export default function AlarmRow({ alarm, onAck, onClear }) {
    const cls = getAlarmClasses(alarm);

    return (
        <div className={`p-3 rounded-xl shadow-sm ${cls} border border-transparent`}>
            {/* Desktop / Tablet layout (one line) */}
            <div className="hidden md:grid grid-cols-12 gap-3 items-center">
                <div className="col-span-3 font-medium">{alarm.name}</div>
                <div className="col-span-1 flex items-center justify-center">
                    {alarm.active ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                </div>
                <div className="col-span-1 text-center">{alarm.severity}</div>
                <div className="col-span-2 text-sm">{formatShort(alarm.timestampIn)}</div>
                <div className="col-span-2 text-sm">{formatShort(alarm.timestampOut)}</div>
                <div className="col-span-1 flex items-center justify-center">
                    {alarm.ack ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                </div>
                <div className="col-span-1 text-sm">{alarm.ackUser || "-"}</div>
                <div className="col-span-1 text-sm">{formatShort(alarm.ackTimestamp)}</div>
            </div>

            {/* Mobile layout (two lines) */}
            <div className="md:hidden flex flex-col gap-2">
                <div className="flex justify-between items-center">
                    <div className="font-medium">{alarm.name}</div>
                    <div className="flex items-center gap-2">
                        {alarm.active ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                        <span className="text-sm">{alarm.severity}</span>
                    </div>
                </div>

                <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{formatShort(alarm.timestampIn)}</span>
                        <span className="opacity-60">/</span>
                        <span>{formatShort(alarm.timestampOut)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        {alarm.ack ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                        <span className="text-xs">{alarm.ackUser || "-"}</span>
                        <span className="text-xs opacity-60">{formatShort(alarm.ackTimestamp)}</span>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="mt-2 flex gap-2 justify-end">
                <button
                    onClick={() => onAck(alarm.tag, alarm.name)}
                    className="px-2 py-1 rounded bg-white/20 hover:bg-white/30 text-sm"
                >
                    Reconhecer
                </button>
                <button
                    onClick={() => onClear(alarm.tag, alarm.name)}
                    className="px-2 py-1 rounded bg-white/20 hover:bg-white/30 text-sm"
                >
                    Finalizar
                </button>
            </div>
        </div>
    );
}
