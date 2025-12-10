// src/hooks/useAlarms.js
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * useAlarms()
 * ----------------------------------------------------------------------
 * ✔ Realiza polling de /alarms/actives
 * ✔ Detecta novos alarmes
 * ✔ Reproduz sons por severidade
 * ✔ Mantém fila (queue) com prioridade
 * ✔ Timeout automático para severidade 0–2
 * ✔ Sem timeout para severidade 3
 * ✔ Marca alarmes como "notified" no backend
 * ✔ Exponibiliza função goToEquipment() para navegação
 * ----------------------------------------------------------------------
 */

export default function useAlarms(interval = 3000) {
  const navigate = useNavigate();

  const API_BASE =
    import.meta.env.VITE_API_BASE_URL || "https://api-elipse.onrender.com";

  const [alarms, setAlarms] = useState([]);
  const [hasNew, setHasNew] = useState(false);

  const [bannerQueue, setBannerQueue] = useState([]);
  const [banner, setBanner] = useState(null);

  const shownRef = useRef({});
  const pollRef = useRef(null);
  const timerRef = useRef(null);

  /* ============================================================
     🔊 SOM DO ALARME
  ============================================================ */
  const lastSoundRef = useRef(null);

  function playAlarmSound(sev, key) {
    try {
      if (lastSoundRef.current === key) return;
      lastSoundRef.current = key;

      const path =
        sev = 3 ? "/sounds/critical.mp3"
          : sev === 2 ? "/sounds/high.mp3"
          : sev === 1 ? "/sounds/low.mp3"
          : "";

      const audio = new Audio(path);
      audio.volume = sev >= 3 ? 1 : 0.6;
      audio.play().catch(() => {});
    } catch {}
  }

  /* ============================================================
     📡 FETCH DE ALARMES
  ============================================================ */
  async function fetchAlarms() {
    try {
      const res = await fetch(`${API_BASE}/alarms/actives`);
      const json = await res.json();

      if (!json.ok) return;

      const list = json.alarms || [];
      setAlarms(list);

      list.forEach((a) => {
        const key = `${a.tag}|${a.name}`;

        if (a.active && !shownRef.current[key]) {
          shownRef.current[key] = true;

          playAlarmSound(a.severity, key);

          setBannerQueue((q) => [
            ...q,
            {
              id: a.id,
              tag: a.tag,
              name: a.name,
              severity: a.severity,
              source: a.source,
              disciplineRoute: getDisciplineRoute(a.tag),
            },
          ]);

          setHasNew(true);
        }
      });

      // remove alarmes que deixaram de existir
      Object.keys(shownRef.current).forEach((key) => {
        const exists = list.find((a) => `${a.tag}|${a.name}` === key && a.active);
        if (!exists) delete shownRef.current[key];
      });
    } catch (err) {
      console.error("Erro ao buscar alarmes:", err);
    }
  }

  /* ============================================================
     🔄 POLLING
  ============================================================ */
  useEffect(() => {
    fetchAlarms();
    pollRef.current = setInterval(fetchAlarms, interval);
    return () => clearInterval(pollRef.current);
  }, [interval]);

  /* ============================================================
     🟧 AUX: ROTA pela disciplina
  ============================================================ */
  function getDisciplineRoute(tag) {
    const d = tag.split("/")[0];

    switch (d) {
      case "AC": return "arcondicionado";
      case "IL": return "iluminacao";
      case "EL": return "eletrica";
      case "HD": return "hidraulica";
      default:   return "equipamento";
    }
  }

  /* ============================================================
     🟧 Atualizar notified = true
  ============================================================ */
  async function markAsNotified(id) {
    if (!id) return;
    try {
      await fetch(`${API_BASE}/alarms/notified`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, notified: true }),
      });
    } catch (err) {
      console.warn("Erro ao atualizar notified:", err);
    }
  }

  /* ============================================================
   🎯 FILA DO BANNER — PRIORIDADE + TIMEOUT + LOGS
  ============================================================ */
  useEffect(() => {
    console.log("%c[BANNER] useEffect disparou", "color: #0af");

    console.log("→ Banner atual:", banner);
    console.log("→ Fila atual:", bannerQueue);

    // Se já há um banner exibido → aguarda
    if (banner) {
      console.log("%c[BANNER] Há banner ativo, aguardando timeout.", "color: orange");
      return;
    }

    // Fila vazia → nada a fazer
    if (bannerQueue.length === 0) {
      console.log("%c[BANNER] Fila vazia, nada a exibir.", "color: gray");
      return;
    }

    // Ordenar por severidade (críticos primeiro)
    const sorted = [...bannerQueue].sort((a, b) => b.severity - a.severity);
    const next = sorted[0];

    console.log("%c[BANNER] Próximo banner selecionado:", "color: #0f0", next);

    // Remover o próximo da fila
    setBannerQueue((q) => {
      const newQueue = q.filter((item) => item !== next);
      console.log("%c[BANNER] Fila após remover NEXT:", "color: #ff0", newQueue);
      return newQueue;
    });

    // Exibir banner
    setBanner(next);
    console.log("%c[BANNER] Banner exibido:", "color: #0f0", next);

    // Atualiza notified
    if (next.id) {
      console.log("%c[BANNER] Marcando como notified no backend…", "color: cyan");
      markAsNotified(next.id);
    }

    // Severidade crítica → sem timeout
    if (next.severity >= 3) {
      console.log("%c[BANNER] Banner crítico → sem timeout.", "color: red");
      return;
    }

    // Cria timeout de 5s
    console.log("%c[BANNER] Criando timeout de 5s…", "color: lightblue");

    timerRef.current = setTimeout(() => {
      console.log("%c[BANNER] Timeout atingido → removendo banner!", "color: yellow");
      setBanner(null);
    }, 5000);

    // Cleanup
    return () => {
      console.log("%c[BANNER] Limpando timeout anterior…", "color: gray");
      clearTimeout(timerRef.current);
    };
  }, [bannerQueue, banner]);


  /* ============================================================
     ❌ FECHAR BANNER manual
  ============================================================ */
  function closeBanner() {
    clearTimeout(timerRef.current);
    setBanner(null);
  }

  /* ============================================================
     🔵 Clique → ir para equipamento
  ============================================================ */
  function goToEquipment(tag, disciplineRoute) {
    navigate(`/${disciplineRoute}/equipamento/${encodeURIComponent(tag)}`);
  }

  /* ============================================================
     🔧 AÇÕES (ACK / CLEAR)
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
    goToEquipment,

    ack,
    clear,
    clearRecognized,
  };
}
