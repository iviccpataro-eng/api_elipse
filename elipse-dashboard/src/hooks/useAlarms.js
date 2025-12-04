import { useEffect, useRef, useState } from "react";

export default function useAlarms(interval = 3000) {
  const API_BASE =
    import.meta.env.VITE_API_BASE_URL || "https://api-elipse.onrender.com";

  const [alarms, setAlarms] = useState([]);
  const [hasNew, setHasNew] = useState(false);

  const [bannerQueue, setBannerQueue] = useState([]);
  const [banner, setBanner] = useState(null);

  const shownRef = useRef({}); // alarmes já notificados
  const pollRef = useRef(null);
  const timerRef = useRef(null);

  /* ============================================================
     🔊 Som do alarme
  ============================================================ */
  const lastSoundRef = useRef(null);

  function playAlarmSound(sev, id) {
    try {
      if (lastSoundRef.current === id) return;
      lastSoundRef.current = id;

      let path =
        sev >= 3
          ? "/sounds/critical.mp3"
          : sev === 2
          ? "/sounds/high.mp3"
          : "/sounds/low.mp3";

      const audio = new Audio(path);
      audio.volume = sev >= 3 ? 1 : 0.6;
      audio.play().catch(() => {});
    } catch {}
  }

  /* ============================================================
     📡 Fetch de alarmes
  ============================================================ */
  async function fetchAlarms() {
    try {
      const res = await fetch(`${API_BASE}/alarms/active`);
      const list = await res.json();

      if (!Array.isArray(list)) {
        console.warn("Resposta inesperada:", list);
        return;
      }

      setAlarms(list);

      // Detectar novos alarmes
      list.forEach((a) => {
        if (a.active && !shownRef.current[a.id]) {
          shownRef.current[a.id] = true;

          playAlarmSound(a.severity, a.id);

          setBannerQueue((q) => [
            ...q,
            {
              id: a.id,
              message: `Novo alarme: ${a.name}`,
              severity: a.severity || 0,
            },
          ]);

          setHasNew(true);
        }
      });

      // Permitir alarme notificar de novo caso ele feche e volte
      Object.keys(shownRef.current).forEach((id) => {
        if (!list.find((a) => a.id == id)) {
          delete shownRef.current[id];
        }
      });
    } catch (err) {
      console.error("Erro ao buscar alarmes:", err);
    }
  }

  /* ============================================================
     🔄 Polling
  ============================================================ */
  useEffect(() => {
    fetchAlarms();
    pollRef.current = setInterval(fetchAlarms, interval);
    return () => clearInterval(pollRef.current);
  }, [interval]);

  /* ============================================================
     🎯 Sistema de fila real dos banners
  ============================================================ */
  useEffect(() => {
    // Nada a fazer se já tem banner exibido
    if (banner) return;

    if (bannerQueue.length === 0) return;

    // SEVERIDADE MAIS ALTA SEMPRE PRIMEIRO
    const sorted = [...bannerQueue].sort(
      (a, b) => b.severity - a.severity
    );

    const next = sorted[0];

    // Remove esse da fila
    setBannerQueue((q) => q.filter((x) => x !== next));

    // Exibe
    setBanner(next);

    // 🔥 se alarme é crítico, NÃO SOME
    if (next.severity >= 3) return;

    // ⏳ remove após 5 segundos
    timerRef.current = setTimeout(() => {
      setBanner(null);
    }, 5000);

    return () => clearTimeout(timerRef.current);
  }, [bannerQueue, banner]);

  /* ============================================================
     ❌ Fechar banner manualmente
  ============================================================ */
  function closeBanner() {
    clearTimeout(timerRef.current);
    setBanner(null);
  }

  /* ============================================================
     🔧 Ações ACK / CLEAR
  ============================================================ */
  async function ack(tag, name) {
    await fetch(`${API_BASE}/alarms/ack`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tag, name }),
    });
    fetchAlarms();
  }

  async function clear(tag, name) {
    await fetch(`${API_BASE}/alarms/clear`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tag, name }),
    });
    fetchAlarms();
  }

  async function clearRecognized() {
    await fetch(`${API_BASE}/alarms/clear-recognized`, {
      method: "POST",
    });
    fetchAlarms();
  }

  return {
    alarms,
    hasNew,
    banner,
    closeBanner,
    ack,
    clear,
    clearRecognized,
  };
}
