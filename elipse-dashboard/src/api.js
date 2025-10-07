// src/api.js
export async function apiFetch(url, options = {}) {
  const token = localStorage.getItem("authToken");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  // Adiciona Authorization apenas se houver token válido
  if (token && token !== "undefined") {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });

  // Se token inválido → força logout automático
  if (response.status === 401 || response.status === 403) {
    console.warn("[API] Token inválido ou expirado — limpando sessão");
    localStorage.removeItem("authToken");
    localStorage.removeItem("userInfo");
    window.location.href = "/"; // redireciona para login
  }

  return response;
}
