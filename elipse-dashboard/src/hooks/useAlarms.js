import { useEffect, useRef, useState } from "react";

export default function useAlarms(interval = 3000) {
    const [alarms, setAlarms] = useState([]);
    const [hasNew, setHasNew] = useState(false);

    const [bannerQueue, setBannerQueue] = useState([]); // FILA
    const [banner, setBanner] = useState(null);         // Banner atual

    const lastAlarmRef = useRef({});

    // ======= FETCH DOS ALARMES =======
    async function fetchAlarms() {
        try {
            const res = await fetch("/alarms/active");
            const data = await res.json();

            if (!data.alarms) return;

            setAlarms(data.alarms);

            // Detectar novos alarmes
            data.alarms.forEach((a) => {
                if (!lastAlarmRef.current[a.id]) {
                    lastAlarmRef.current[a.id] = true;

                    // Adiciona à FILA de banners
                    setBannerQueue((q) => [
                        ...q,
                        {
                            message: `Novo alarme: ${a.name}`,
                            severity: a.severity,
                        },
                    ]);

                    setHasNew(true);
                }
            });
        } catch (err) {
            console.error("Erro carregando alarmes", err);
        }
    }

    // Loop automático
    useEffect(() => {
        fetchAlarms();
        const timer = setInterval(fetchAlarms, interval);
        return () => clearInterval(timer);
    }, []);

    // ======= PROCESSAR FILA DE BANNERS =======
    useEffect(() => {
        if (!banner && bannerQueue.length > 0) {
            // Pega o próximo banner
            setBanner(bannerQueue[0]);

            // Remove o da fila
            setBannerQueue((q) => q.slice(1));
        }
    }, [bannerQueue, banner]);

    // Fechar banner
    function closeBanner() {
        setBanner(null);
    }

    // Outros controles
    function ack(id) {
        console.log("Reconhecer", id);
    }

    function clear(id) {
        console.log("Limpar", id);
    }

    function clearRecognized() {
        console.log("Limpar reconhecidos");
    }

    return {
        alarms,
        hasNew,
        banner,
        setBanner,
        closeBanner,
        ack,
        clear,
        clearRecognized,
    };
}
