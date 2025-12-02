import { useEffect, useRef, useState } from "react";

export default function useAlarms(interval = 3000) {

    const API_BASE =
        import.meta.env.VITE_API_BASE_URL || "https://api-elipse.onrender.com";

    const [alarms, setAlarms] = useState([]);
    const [hasNew, setHasNew] = useState(false);

    const [bannerQueue, setBannerQueue] = useState([]);
    const [banner, setBanner] = useState(null);

    // Guarda quais alarmes já foram vistos
    const lastAlarmRef = useRef({});

    // ======================
    // 🔎 FETCH DE ALARMES
    // ======================
    async function fetchAlarms() {
        try {
            const res = await fetch(`${API_BASE}/alarms/active`);
            const data = await res.json();

            console.log("🔍 API retornou:", data);

            // Data precisa ser um array
            if (!data || !Array.isArray(data)) {
                console.warn("❗ A API não retornou lista de alarmes.");
                return;
            }

            // Atualiza lista
            setAlarms(data);

            // Detecta novos alarmes
            data.forEach((a) => {
                if (!lastAlarmRef.current[a.id]) {
                    lastAlarmRef.current[a.id] = true;

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

    // ======================
    // 🟦 PROCESSA FILA DE BANNERS
    // ======================
    useEffect(() => {
        if (!banner && bannerQueue.length > 0) {
            const next = bannerQueue[0];

            setBanner(next);
            setBannerQueue((q) => q.slice(1));

            // Auto-fechar em 5s
            const t = setTimeout(() => {
                setBanner(null);
            }, 5000);

            return () => clearTimeout(t);
        }
    }, [bannerQueue, banner]);

    // Botão fechar
    function closeBanner() {
        setBanner(null);
    }

    return {
        alarms,
        hasNew,
        banner,
        closeBanner,
        setBanner,
        // ainda vamos conectar com backend depois:
        ack: () => {},
        clear: () => {},
        clearRecognized: () => {},
    };
}
