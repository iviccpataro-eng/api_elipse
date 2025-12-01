// src/hooks/useAlarms.js
import { useEffect, useState, useRef } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://api-elipse.onrender.com";

export default function useAlarms(pollInterval = 5000) {

    const [alarms, setAlarms] = useState([]);
    const [hasNew, setHasNew] = useState(false);

    // FILA DE NOTIFICAÇÕES
    const [bannerQueue, setBannerQueue] = useState([]);
    const [activeBanner, setActiveBanner] = useState(null);

    // Controle de som (evita tocar repetidamente)
    const lastPlayedId = useRef(null);

    // ================================
    // 🔊 FUNÇÃO PARA TOCAR SOM
    // ================================
    function playAlarmSound(severity, id) {
        if (lastPlayedId.current === id) return; // evita duplicação
        lastPlayedId.current = id;

        let soundPath = "";

        if (severity === 1) soundPath = "/sounds/info.mp3";
        else if (severity === 2) soundPath = "/sounds/alarm.mp3";
        else if (severity === 3) soundPath = "/sounds/critical.mp3";
        else return;

        const audio = new Audio(soundPath);
        audio.volume = severity === 3 ? 1.0 : 0.5;

        audio.play().catch(() => {});
    }

    // ================================
    // ⬇ Processo do próximo banner
    // ================================
    useEffect(() => {
        if (!activeBanner && bannerQueue.length > 0) {
            const next = bannerQueue[0];
            setActiveBanner(next);

            const timer = setTimeout(() => {
                setActiveBanner(null);
                setBannerQueue((q) => q.slice(1));
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [activeBanner, bannerQueue]);

    // ================================
    // 🔎 FETCH DE ALARMES
    // ================================
    useEffect(() => {
        async function fetchAlarms() {
            try {
                const res = await fetch(`${API_BASE}/alarms/active`);
                const list = await res.json();

                // detecta novos alarmes
                list.forEach(a => {
                    if (!alarms.find(x => x.id === a.id)) {

                        // toca som
                        playAlarmSound(a.severity, a.id);

                        // adiciona à fila de banners
                        setBannerQueue(q => [
                            ...q,
                            {
                                message: `Novo alarme: ${a.name}`,
                                severity: a.severity
                            }
                        ]);

                        setHasNew(true);
                    }
                });

                setAlarms(list);

            } catch (err) {
                console.error("Erro ao buscar alarmes", err);
            }
        }

        fetchAlarms();
        const t = setInterval(fetchAlarms, pollInterval);
        return () => clearInterval(t);

    }, [pollInterval, alarms]);

    // ================================
    // 🟡 ACIONADORES
    // ================================
    async function ack(tag, name) {
        await fetch(`${API_BASE}/alarms/ack`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tag, name })
        });
    }

    async function clear(tag, name) {
        await fetch(`${API_BASE}/alarms/clear`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tag, name })
        });
    }

    async function clearRecognized() {
        await fetch(`${API_BASE}/alarms/clear-recognized`, {
            method: "POST"
        });
    }

    return {
        alarms,
        hasNew,
        setHasNew,
        banner: activeBanner,
        bannerQueue,
        ack,
        clear,
        clearRecognized
    };
}
