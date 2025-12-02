// src/hooks/useAlarms.js
import { useEffect, useState, useRef } from "react";

const API_BASE =
    import.meta.env.VITE_API_BASE_URL || "https://api-elipse.onrender.com";

export default function useAlarms(pollInterval = 5000) {

    const [alarms, setAlarms] = useState([]);
    const [hasNew, setHasNew] = useState(false);

    // FILA DE NOTIFICAÇÕES
    const [bannerQueue, setBannerQueue] = useState([]);
    const [activeBanner, setActiveBanner] = useState(null);

    // Evita repetição de som
    const lastPlayedId = useRef(null);

    // 🔊 Sons
    function playAlarmSound(severity, id) {
        if (lastPlayedId.current === id) return;
        lastPlayedId.current = id;

        let file = null;

        if (severity === 1) file = "/sounds/info.mp3";
        if (severity === 2) file = "/sounds/alarm.mp3";
        if (severity === 3) file = "/sounds/critical.mp3";

        if (!file) return;

        const audio = new Audio(file);
        audio.volume = severity === 3 ? 1.0 : 0.5;

        audio.play().catch(() => {});
    }

    // PROCESSA O PRÓXIMO BANNER
    useEffect(() => {
        if (!activeBanner && bannerQueue.length > 0) {
            const next = bannerQueue[0];
            setActiveBanner(next);

            const timer = setTimeout(() => {
                setActiveBanner(null);
                setBannerQueue(q => q.slice(1));
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [activeBanner, bannerQueue]);

    // BUSCA ALARMES
    useEffect(() => {
        async function fetchAlarms() {
            try {
                const res = await fetch(`${API_BASE}/alarms/active`);
                const list = await res.json();

                // detecta novos
                list.forEach(a => {
                    const exists = alarms.some(x => x.id === a.id);
                    if (!exists) {

                        // som
                        playAlarmSound(a.severity, a.id);

                        // adiciona na fila
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

    // AÇÕES
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
        await fetch(`${API_BASE}/alarms/clear-recognized`, { method: "POST" });
    }

    function closeBanner() {
    setActiveBanner(null);
    setBannerQueue(q => q.slice(1));
}

    return {
        alarms,
        hasNew,
        setHasNew,
        banner: activeBanner,
        setBanner: setActiveBanner,
        bannerQueue,
        ack,
        clear,
        clearRecognized,
        closeBanner
    };
}
