import React from "react";
import { Check, X, Clock, Trash2 } from "lucide-react";

function getAlarmStyle(alarm) {
    const active = alarm.active;
    const ack = alarm.ack;
    const sev = Number(alarm.severity ?? 0);

    let severityLabel = "";
    let className = "";

    switch (sev) {
        case 0: severityLabel = "Alarme Info."; break;
        case 1: severityLabel = "Alarme Baixo"; break;
        case 2: severityLabel = "Alarme Alto"; break;
        case 3: severityLabel = "Alarme Crítico"; break;
        default: severityLabel = "Desconhecido";
    }

    if (ack) {
        className = active ? "bg-green-100 text-green-800" : "bg-gray-100 text-green-900";
        return { severityLabel, className };
    }

    switch (sev) {
        case 0: className = active ? "bg-blue-100 text-blue-900" : "bg-gray-100 text-blue-900"; break;
        case 1: className = active ? "bg-yellow-100 text-[#D4A202]" : "bg-gray-100 text-[#D4A202]"; break;
        case 2: className = active ? "bg-red-100 text-red-800" : "bg-gray-100 text-red-800"; break;
        case 3: className = active ? "bg-red-600 text-[#EFB807] animate-pulse" : "bg-red-100 text-[#D4A202]"; break;
        default: className = "bg-gray-100 text-gray-800";
    }

    return { severityLabel, className };
}

function formatShort(dt) {
    if (!dt) return "-";
    try { return new Date(dt).toLocaleString(); }
    catch { return dt; }
}

export function AlarmRowHeader() {
    return (
        <div className="
            hidden md:grid grid-cols-12 
            font-semibold text-xs text-gray-600 
            px-2 py-1 border-b bg-white sticky top-0 z-20
            divide-x-2 divide-gray-200
        ">
            <div className="col-span-3">Nome</div>
            <div className="col-span-1 text-center">Ativo</div>
            <div className="col-span-1 text-center">Severidade</div>
            <div className="col-span-2 text-center">Entrada</div>
            <div className="col-span-2 text-center">Saída</div>
            <div className="col-span-2 text-center">Reconhecimento</div>
            <div className="col-span-1 text-center">Ações</div>
        </div>
    );
}

export default function AlarmRow({ alarm, onAck, onClear }) {
    const { severityLabel, className } = getAlarmStyle(alarm);

    return (
        <div className={`px-2 py-1 rounded-lg border shadow-sm ${className}`}>

            {/* DESKTOP */}
            <div className="hidden md:grid grid-cols-12 gap-2 items-center text-xs">

                <div className="col-span-3 font-medium">{alarm.name}</div>

                <div className="col-span-1 flex items-center justify-center">
                    {alarm.active ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                </div>

                <div className="col-span-1">{severityLabel}</div>

                <div className="col-span-2">{formatShort(alarm.timestampIn)}</div>

                <div className="col-span-2">{formatShort(alarm.timestampOut)}</div>

                <div className="col-span-1 flex items-center justify-center">
                    {alarm.ack ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                </div>

                <div className="col-span-1">{formatShort(alarm.ackTimestamp)}</div>

                {/* ACTIONS → dentro da grid */}
                <div className="col-span-1 flex items-center gap-1 justify-center">

                    {/* RECONHECER */}
                    <button
                        onClick={() => onAck(alarm.tag, alarm.name)}
                        disabled={alarm.ack}
                        title={alarm.ack ? "Já reconhecido" : "Reconhecer"}
                        className={`
                            p-1 rounded 
                            ${alarm.ack ? "opacity-40 cursor-not-allowed" : "hover:bg-white/40"}
                        `}
                    >
                        <Check className="w-4 h-4" />
                    </button>

                    {/* FINALIZAR */}
                    <button
                        onClick={() => onClear(alarm.tag, alarm.name)}
                        disabled={!alarm.ack || alarm.active}
                        title={
                            !alarm.ack ? "Reconheça antes"
                                : alarm.active ? "Não pode finalizar ativo"
                                    : "Finalizar"
                        }
                        className={`
                            p-1 rounded 
                            ${!alarm.ack || alarm.active ? "opacity-40 cursor-not-allowed" : "hover:bg-white/40"}
                        `}
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>

            </div>

            {/* MOBILE (igual antes) */}
            <div className="lg:hidden flex flex-col gap-1 text-sm">
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
                </div>

                <div className="text-xs flex justify-end opacity-70">
                    ACK: {formatShort(alarm.ackTimestamp)}
                </div>
            </div>
        </div>
    );
}
