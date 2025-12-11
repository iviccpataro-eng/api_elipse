// src/hooks/useAlarms.js
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * useAlarms - robust version
 * - evita re-enfileirar o mesmo alarme usando chave única (tag|name)
 * - remove da fila por chave (não por objeto)
 * - logs detalhados
 * - timeout de 5s para severidades 0..2
 * - sem timeout para severidade 3
 */

export default function useAlarms(interval = 3000) {
  const navigate = useNavigate();
  const API_BASE =
    import.meta.env.VITE_API_BASE_URL || "https://api-elipse.onrender.com";

  const [alarms, setAlarms] = useState([]);
  const [hasNew, setHasNew] = useState(false);

  // fila de banners: cada item tem { key, id, tag, name, severity, source, disciplineRoute }
  const [bannerQueue, setBannerQueue] = useState([]);
  const [banner, setBanner] = useState(null);

  // shownRef guarda chaves já exibidas (key => true)
  const shownRef = useRef({});
  const pollRef = useRef(null);
  const timerRef = useRef(null);

  /* ============================================================
     🔊 SOM DO ALARME (mantive sua lógica)
  ============================================================ */
  const lastSoundRef = useRef(null);
  function playAlarmSound(sev, key) {
    try {
      if (lastSoundRef.current === key) return;
      lastSoundRef.current = key;
      const path =
        sev >= 3 ? "/sounds/critical.mp3"
          : sev === 2
          ? "/sounds/high.mp3"
          : sev === 1 
          ? "/sounds/low.mp3"
          : "";
      const audio = new Audio(path);
      audio.volume = sev >= 3 ? 1 : 0.6;
      audio.play().catch(() => {});
    } catch {}
  }

  /* ============================================================
     🔧 util: rota por disciplina
  ============================================================ */
  function getDisciplineRoute(tag) {
    const d = (tag || "").split("/")[0] || "";
    switch (d) {
      case "AC": return "arcondicionado";
      case "IL": return "iluminacao";
      case "EL": return "eletrica";
      case "HD": return "hidraulica";
      default:   return "equipamento";
    }
  }

  /* ============================================================
     🟦 Atualizar notified no backend
  ============================================================ */
 async function markAsNotified(alarm) {
    if (!alarm) return;

    try {
      // Caso tenha ID → usa ID
      if (alarm.id) {
        await fetch(`${API_BASE}/alarms/notified`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: alarm.id, notified: true })
        });
        return;
      }

      // Caso NÃO tenha ID → envia tag + name
      await fetch(`${API_BASE}/alarms/notified`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tag: alarm.tag,
          name: alarm.name,
          notified: true
        })
      });
    } catch (err) {
      console.warn("Erro ao marcar notified:", err);
    }
  }

  /* ============================================================
     📡 Buscar alarmes (polling)
  ============================================================ */
  async function fetchAlarms() {
    try {
      const res = await fetch(`${API_BASE}/alarms/actives`);
      const json = await res.json();
      if (!json || !json.ok) {
        // log leve
        console.warn("[useAlarms] resposta inválida de /alarms/actives", json);
        return;
      }

      const list = json.alarms || [];
      setAlarms(list);

      // Percorre e enfileira apenas novos (usando key)
      list.forEach((a) => {
        const key = `${a.tag}|${a.name}`;

        // se ativo e NÃO foi mostrado antes, enfileira
        if (a.active && !shownRef.current[key]) {
          shownRef.current[key] = true; // marca como já enfileirado/mostrado para não duplicar
          playAlarmSound(a.severity, key);

          const item = {
            key,
            id: a.id ?? null,
            tag: a.tag,
            name: a.name,
            severity: a.severity ?? 0,
            source: a.source || "",
            disciplineRoute: getDisciplineRoute(a.tag),
          };

          console.log("%c[useAlarms] enfileirando novo alarme:", "color: #0a0", item);
          setBannerQueue((q) => [...q, item]);
          setHasNew(true);
        }
      });

      // remove chaves de shownRef que não existem mais como ativos (se quiser reaparecer quando voltar)
      Object.keys(shownRef.current).forEach((k) => {
        const still = list.find((a) => `${a.tag}|${a.name}` === k && a.active);
        if (!still) {
          // permite reaparecer futuramente caso volte a ficar ativo
          delete shownRef.current[k];
        }
      });
    } catch (err) {
      console.error("[useAlarms] Erro ao buscar alarmes:", err);
    }
  }

  /* ============================================================
     🔁 polling setup
  ============================================================ */
  useEffect(() => {
    fetchAlarms();
    pollRef.current = setInterval(fetchAlarms, interval);
    return () => clearInterval(pollRef.current);
  }, [interval]);

  /* ============================================================
     ▶️ FILA: consumo em sequência com timeout
     - remove da fila por key
     - logs detalhados
  ============================================================ */
  useEffect(() => {
  console.log("%c[useAlarms] fila-effect disparou", "color: #06f");
  console.log("  banner atual:", banner);
  console.log("  fila:", bannerQueue.map((i) => i.key));

  // Se já existe banner exibido, apenas aguarda seu timeout
  if (banner) {
    console.log("%c[useAlarms] já existe banner ativo, não mexer", "color: orange");
    return;
  }

  // Sem itens na fila, nada a fazer
  if (bannerQueue.length === 0) {
    console.log("%c[useAlarms] fila vazia", "color: gray");
    return;
  }

  // Seleciona por severidade
  const sorted = [...bannerQueue].sort((a, b) => b.severity - a.severity);
  const next = sorted[0];

  console.log("%c[useAlarms] selecionado next:", "color: #0a0", next);

  // Remove da fila por key
  setBannerQueue((q) => q.filter((item) => item.key !== next.key));

  // Exibe o banner
  setBanner(next);

  markAsNotified(next);

  // Severidade crítica não tem timeout
  if (next.severity >= 3) return;

  // Timeout de 5 segundos
  timerRef.current = setTimeout(() => {
    console.log("%c[useAlarms] timeout concluiu — removendo banner", "color: yellow");
    setBanner(null);
  }, 5000);

  // ⚠️ AGORA NÃO TEM MAIS CLEANUP
  // SÓ TEMOS UM CLEANUP NO closeBanner()
}, [bannerQueue, banner]);

  /* ============================================================
     manual close
  ============================================================ */
  function closeBanner() {
    clearTimeout(timerRef.current);
    setBanner(null);
  }

  /* ============================================================
     navegação
  ============================================================ */
  function goToEquipment(tag, disciplineRoute) {
    navigate(`/${disciplineRoute}/equipamento/${encodeURIComponent(tag)}`);
  }

  /* ============================================================
     ack / clear / clearRecognized
  ============================================================ */
  async function ack(tag, name) {
    try {
      await fetch(`${API_BASE}/alarms/ack`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag, name }),
      });
    } catch (err) {
      console.warn("[useAlarms] ack error", err);
    } finally {
      fetchAlarms();
    }
  }

  async function clear(tag, name) {
    try {
      await fetch(`${API_BASE}/alarms/clear`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag, name }),
      });
    } catch (err) {
      console.warn("[useAlarms] clear error", err);
    } finally {
      fetchAlarms();
    }
  }

  async function clearRecognized() {
    try {
      await fetch(`${API_BASE}/alarms/clear-recognized`, {
        method: "POST",
      });
    } catch (err) {
      console.warn("[useAlarms] clearRecognized error", err);
    } finally {
      fetchAlarms();
    }
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
