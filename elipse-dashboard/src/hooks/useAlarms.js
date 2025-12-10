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
  async function markAsNotified(id) {
    if (!id) return;
    try {
      await fetch(`${API_BASE}/alarms/notified`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, notified: true }),
      });
    } catch (err) {
      console.warn("[useAlarms] markAsNotified error", err);
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

    // Se já tem banner exibido, aguarda
    if (banner) {
      console.log("%c[useAlarms] já existe banner ativo, aguardando sua saída", "color: orange");
      return;
    }

    if (bannerQueue.length === 0) {
      console.log("%c[useAlarms] fila vazia", "color: gray");
      return;
    }

    // Escolhe next por severidade (maior primeiro), depois FIFO
    const sorted = [...bannerQueue].sort((a, b) => {
      if (b.severity !== a.severity) return b.severity - a.severity;
      return 0;
    });

    const next = sorted[0];
    if (!next) return;

    console.log("%c[useAlarms] selecionado next:", "color: #0a0", next);

    // Remover da fila por key
    setBannerQueue((q) => {
      const newQ = q.filter((item) => item.key !== next.key);
      console.log("%c[useAlarms] fila após remover next:", "color: #ff0", newQ.map(i=>i.key));
      return newQ;
    });

    // Exibe
    setBanner(next);
    console.log("%c[useAlarms] exibindo banner:", "color: #0f0", next);

    // marca notified
    if (next.id) {
      console.log("%c[useAlarms] marcando notified para id", "color: cyan", next.id);
      markAsNotified(next.id);
    }

    // se crítico -> não timeout
    if (next.severity >= 3) {
      console.log("%c[useAlarms] banner crítico (sem timeout)", "color: red");
      return;
    }

    // cria timeout
    console.log("%c[useAlarms] criando timeout 5s para key", "color: lightblue", next.key);
    timerRef.current = setTimeout(() => {
      console.log("%c[useAlarms] timeout expirou para key -> removendo banner", "color: yellow", next.key);
      setBanner(null);
      // OBS: não removemos shownRef aqui para evitar re-enfileirar imediatamente
      // se desejar permitir reaparecer, poderia-se remover shownRef[next.key] aqui.
    }, 5000);

    return () => {
      console.log("%c[useAlarms] cleanup: limpando timeout anterior", "color: gray");
      clearTimeout(timerRef.current);
    };
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
