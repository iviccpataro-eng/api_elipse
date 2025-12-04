import { useEffect, useRef, useState } from "react";

export default function useAlarms(interval = 3000) {
  const API_BASE =
    import.meta.env.VITE_API_BASE_URL || "https://api-elipse.onrender.com";

  const shownRef = useRef({});

  const [alarms, setAlarms] = useState([]);
  const [hasNew, setHasNew] = useState(false);

  const [bannerQueue, setBannerQueue] = useState([]); // fila de banners
  const [banner, setBanner] = useState(null); // banner ativo

  const seenRef = useRef(new Set()); // alarm ids já vistos
  const pollRef = useRef(null);
  const bannerTimerRef = useRef(null);
  const lastPlayedRef = useRef(null);

  // função para tocar som (opcional — coloque arquivos em /public/sounds/)
  function playAlarmSound(severity, id) {
    try {
      if (!severity) return;
      if (lastPlayedRef.current === id) return;
      lastPlayedRef.current = id;

      const path =
        severity >= 3
          ? "/sounds/critical.mp3"
          : severity === 2
          ? "/sounds/high.mp3"
          : "/sounds/low.mp3";

      const audio = new Audio(path);
      audio.volume = severity >= 3 ? 1 : 0.6;
      audio.play().catch(() => {
        // ignora erro de autoplay
      });
    } catch (e) {
      console.warn("Erro ao tocar som:", e);
    }
  }

  async function fetchAlarms() {
    try {
      const res = await fetch(`${API_BASE}/alarms/active`);
      // endpoint retorna ARRAY (não um objeto { alarms: [...] })
      const data = await res.json();

      if (!data || !Array.isArray(data)) {
        console.warn("[useAlarms] resposta inesperada do backend:", data);
        return;
      }

      // atualiza lista exibida
      setAlarms(data);

      // detecta novos alarmes (pelo id)
      data.forEach((a) => {
      
    // Se o alarme ainda NÃO foi mostrado e está ativo
    if (a.active && !shownRef.current[a.id]) {

        shownRef.current[a.id] = true; // marcar como exibido

        setBannerQueue((q) => [
            ...q,
            {
                id: a.id,
                message: `Novo alarme: ${a.name}`,
                severity: a.severity || 0
            }
        ]);

        setHasNew(true);
        console.log("🆕 Alarme novo detectado:", a.id, a.name);
    }
    // Limpar alarmes desativados
    data.forEach((a) => {
        if (!a.active && shownRef.current[a.id]) {
            console.log("♻️ Alarme saiu, liberando para futuro:", a.id);
            delete shownRef.current[a.id];
        }
    });
    });
    } catch (err) {
      console.error("[useAlarms] Erro carregando alarmes", err);
    }
  }

  // polling
  useEffect(() => {
    fetchAlarms();
    pollRef.current = setInterval(fetchAlarms, interval);
    return () => {
      clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interval]);

  // ======= PROCESSAR FILA DE BANNERS (COM LOGS) =======
useEffect(() => {
  console.log("📢 useEffect disparou | banner =", banner, "| fila =", bannerQueue);

  // Caso: não há banner ativo e existe algo na fila → mostrar próximo
  if (!banner && bannerQueue.length > 0) {
    const nextBanner = bannerQueue[0];
    console.log("➡️ Exibindo novo banner:", nextBanner);

    setBanner(nextBanner); // ativa banner
    setBannerQueue((q) => q.slice(1)); // remove da fila

    // cria timeout para remover após 5s
    const timer = setTimeout(() => {
      console.log("⏳ Tempo expirou → removendo banner");
      setBanner(null);
    }, 5000);

    console.log("⏱️ Timer iniciado para remover banner em 5s");

    return () => {
      console.log("🧽 Limpando timer antigo (unmount/update)");
      clearTimeout(timer);
    };
  }

  // Caso: há banner ativo e fila vazia
  if (banner && bannerQueue.length === 0) {
    console.log("ℹ️ Banner ativo, mas fila está vazia.");
  }

  // Caso: nada para mostrar
  if (!banner && bannerQueue.length === 0) {
    console.log("✔ Fila vazia e nenhum banner ativo.");
  }
}, [bannerQueue, banner]);


  function closeBanner() {
    // fecha imediatamente e limpa banner atual — próxima execução do effect mostrará o próximo da fila
    setBanner(null);
  }

  // ações (placeholder — integrar backend)
  async function ack(tag, name) {
    try {
      await fetch(`${API_BASE}/alarms/ack`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag, name }),
      });
      // opcional: atualizar localmente
      fetchAlarms();
    } catch (e) {
      console.error("Erro ao ACK:", e);
    }
  }

  async function clear(tag, name) {
    try {
      await fetch(`${API_BASE}/alarms/clear`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag, name }),
      });
      fetchAlarms();
    } catch (e) {
      console.error("Erro ao limpar:", e);
    }
  }

  async function clearRecognized() {
    try {
      await fetch(`${API_BASE}/alarms/clear-recognized`, { method: "POST" });
      fetchAlarms();
    } catch (e) {
      console.error("Erro clearRecognized:", e);
    }
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
