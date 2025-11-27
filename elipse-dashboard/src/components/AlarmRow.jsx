// src/components/AlarmRow.jsx
import React from "react";
import { Check, X, Clock } from "lucide-react";

function getAlarmStyle(alarm) {
    const active = alarm.active;
    const ack = alarm.ack;
    const sev = Number(alarm.severity ?? 0);

    let severityLabel = "";
    let className = "";

    // ✔ Definição do nome da severidade
    switch (sev) {
        case 0: severityLabel = "Alarme Info."; break;
        case 1: severityLabel = "Alarme Baixo"; break;
        case 2: severityLabel = "Alarme Alto"; break;
        case 3: severityLabel = "Alarme Crítico"; break;
        default: severityLabel = "Desconhecido";
    }

    // ✔ Se reconhecido, aplica paleta verde/cinza
    if (ack) {
        className = active
            ? "bg-green-100 text-green-800"
            : "bg-gray-100 text-green-900";
        return { severityLabel, className };
    }

    // ✔ Cores por severidade + ativo/inativo
    switch (sev) {
        case 0:
            className = active ? "bg-blue-100 text-blue-900" : "bg-gray-100 text-blue-900";
            break;

        case 1:
            className = active ? "bg-yellow-100 text-[#D4A202]" : "bg-gray-100 text-[#D4A202]";
            break;

        case 2:
            className = active ? "bg-red-100 text-red-800" : "bg-gray-100 text-red-800";
            break;

        case 3:
            className = active
                ? "bg-red-600 text-[#EFB807] animate-pulse"
                : "bg-red-100 text-[#D4A202]";
            break;

        default:
            className = "bg-gray-100 text-gray-800";
            break;
    }

    return { severityLabel, className };
}

function formatShort(dt) {
    if (!dt) return "-";
    try {
        return new Date(dt).toLocaleString();
    } catch {
        return dt;
    }
}

export default function AlarmRow({ alarm, onAck, onClear }) {
    const { severityLabel, className } = getAlarmStyle(alarm);

    return (
        <div className={`p-3 rounded-xl shadow-sm border border-transparent ${className}`}>

            {/* DESKTOP / TABLET */}
            <div className="hidden md:grid grid-cols-12 gap-3 items-center">
                <div className="col-span-3 font-medium">{alarm.name}</div>

                <div className="col-span-1 flex items-center justify-center">
                    {alarm.active ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                </div>

                <div className="col-span-2 text-sm">{severityLabel}</div>

                <div className="col-span-2 text-sm">{formatShort(alarm.timestampIn)}</div>

                <div className="col-span-2 text-sm">{formatShort(alarm.timestampOut)}</div>

                <div className="col-span-1 flex items-center justify-center">
                    {alarm.ack ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                </div>

                <div className="col-span-1 text-sm">{alarm.ackUser || "-"}</div>

                <div className="col-span-1 text-sm">{formatShort(alarm.ackTimestamp)}</div>
            </div>

            {/* MOBILE */}
            <div className="md:hidden flex flex-col gap-2 text-sm">

                <div className="flex justify-between items-center">
                    <div className="font-medium">{alarm.name}</div>

                    <div className="flex items-center gap-2">
                        {alarm.active ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                        <span>{severityLabel}</span>
                    </div>
                </div>

                <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{formatShort(alarm.timestampIn)}</span>
                        <span className="opacity-60">/</span>
                        <span>{formatShort(alarm.timestampOut)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        {alarm.ack ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                        <span>{alarm.ackUser || "-"}</span>
                        <span className="opacity-60">{formatShort(alarm.ackTimestamp)}</span>
                    </div>
                </div>
            </div>

            {/* ACTIONS */}
            <div className="mt-3 flex gap-2 justify-end">
                <button
                    onClick={() => onAck(alarm.tag, alarm.name)}
                    className="px-2 py-1 rounded bg-white/20 hover:bg-white/30 text-sm font-medium"
                >
                    Reconhecer
                </button>

                <button
                    onClick={() => onClear(alarm.tag, alarm.name)}
                    className="px-2 py-1 rounded bg-white/20 hover:bg-white/30 text-sm font-medium"
                >
                    Finalizar
                </button>
            </div>
        </div>
    );
}
