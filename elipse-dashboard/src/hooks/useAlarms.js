import { useEffect, useRef, useState } from "react";

export default function useAlarms(interval = 3000) {
  const API_BASE =
    import.meta.env.VITE_API_BASE_URL || "https://api-elipse.onrender.com";

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
          ? "/sounds/alarm.mp3"
          : "/sounds/info.mp3";

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
        const id = a?.id;
        if (!id) return;

        if (!seenRef.current.has(id)) {
          // novo
          seenRef.current.add(id);

          const sev = Number(a.severity ?? 0);

          // opcional: tocar som
          // playAlarmSound(sev, id);

          // enfileira banner com dados mínimos
          setBannerQueue((q) => [
            ...q,
            {
              id,
              message: `Novo alarme: ${a.name}`,
              severity: sev,
              name: a.name,
            },
          ]);

          setHasNew(true);
        }
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

  // processa fila de banners (um por vez)
  useEffect(() => {
    if (banner) return; // já tem ativo
    if (bannerQueue.length === 0) return;

    const next = bannerQueue[0];
    setBanner(next);
    setBannerQueue((q) => q.slice(1));

    // timer para fechar automaticamente
    bannerTimerRef.current = setTimeout(() => {
      setBanner(null);
    }, 5000);

    return () => {
      clearTimeout(bannerTimerRef.current);
    };
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
