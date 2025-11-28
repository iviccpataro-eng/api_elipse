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
        <div className="hidden md:grid grid-cols-12 font-semibold text-xs text-gray-600 px-3 py-2">
            <div className="col-span-3">Nome</div>
            <div className="col-span-1 text-center">Ativo</div>
            <div className="col-span-2">Severidade</div>
            <div className="col-span-2">Entrada</div>
            <div className="col-span-2">Saída</div>
            <div className="col-span-1 text-center">ACK</div>
            <div className="col-span-1">Ações</div>
        </div>
    );
}

export default function AlarmRow({ alarm, onAck, onClear }) {
    const { severityLabel, className } = getAlarmStyle(alarm);

    return (
        <div className={`p-3 rounded-xl shadow-sm border border-transparent ${className}`}>

            {/* DESKTOP */}
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

                {/* ACTIONS */}
                <div className="mt-3 flex gap-2 justify-end">

                    {/* RECONHECER */}
                    <button
                        onClick={() => onAck(alarm.tag, alarm.name)}
                        disabled={alarm.ack}  // já reconhecido → desativa
                        title={alarm.ack ? "Já reconhecido" : "Reconhecer alarme"}
                        className={`p-2 rounded ${alarm.ack
                            ? "bg-white/10 text-gray-400 cursor-not-allowed"
                            : "bg-white/20 hover:bg-white/30 text-gray-700"}`}>
                        <Check className="w-5 h-5" />
                    </button>

                    {/* FINALIZAR */}
                    <button
                        onClick={() => onClear(alarm.tag, alarm.name)}
                        disabled={!alarm.ack || alarm.active}
                        title={
                            !alarm.ack
                                ? "Reconheça antes de finalizar"
                                : alarm.active
                                    ? "Não é possível finalizar um alarme ativo"
                                    : "Finalizar alarme"
                        }
                        className={`p-2 rounded ${!alarm.ack || alarm.active
                            ? "bg-white/10 text-gray-400 cursor-not-allowed"
                            : "bg-white/20 hover:bg-white/30 text-gray-700"}`}>
                        <Trash2 className="w-5 h-5" />
                    </button>

                </div>

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
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => onAck(alarm.tag, alarm.name)}
                        className="px-2 py-1 rounded bg-white/30 hover:bg-white/40 text-xs font-medium"
                    >
                        Reconhecer
                    </button>

                    <button
                        onClick={() => onClear(alarm.tag, alarm.name)}
                        className="px-2 py-1 rounded bg-white/30 hover:bg-white/40 text-xs font-medium"
                    >
                        Finalizar
                    </button>
                </div>
            </div>
        </div>
    );
}
