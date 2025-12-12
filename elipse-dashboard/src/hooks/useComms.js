// src/hooks/useComms.js

import { useEffect, useState } from "react";

/* ============================================================
   CONFIGURAÇÃO DA API
   ============================================================ */

const API_URL = "https://api-elipse.onrender.com";

/**
 * Função base de requests para toda a API
 */
async function apiFetch(endpoint, options = {}) {
  const defaultHeaders = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {})
    }
  });

  let data = null;
  try {
    data = await response.json();
  } catch (_) {
    data = null;
  }

  if (!response.ok) {
    throw {
      status: response.status,
      message: data?.erro || "Erro na requisição"
    };
  }

  return data;
}

/* ============================================================
   SERVIÇOS / ENDPOINTS DO BACKEND
   ============================================================ */

/** GET /comms */
export function getAllComms() {
  return apiFetch("/comms");
}

/** GET /comms/:deviceId */
export function getComm(deviceId) {
  return apiFetch(`/comms/${deviceId}`);
}

/** GET /comms/tree/all */
export function getCommsTree() {
  return apiFetch("/comms/tree/all");
}

/* ============================================================
   CUSTOM HOOKS PARA CONSUMO NO REACT
   ============================================================ */

/** Hook para listar todos os equipamentos */
export function useCommsList() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllComms()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}

/** Hook para buscar a árvore de comunicação */
export function useCommTree() {
  const [tree, setTree] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCommsTree()
      .then((res) => setTree(res.tree))
      .finally(() => setLoading(false));
  }, []);

  return { tree, loading };
}

/** Hook para detalhes de um equipamento */
export function useCommDetails(deviceId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!deviceId) return;
    getComm(deviceId)
      .then(setData)
      .finally(() => setLoading(false));
  }, [deviceId]);

  return { data, loading };
}
