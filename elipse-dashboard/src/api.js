// src/api.js
export async function apiFetch(url, options = {}) {
  const token = localStorage.getItem("authToken");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  // Só adiciona Authorization se o token for válido
  if (token && token !== "undefined") {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });

  // Tratamento automático de erro 401/403
  if (response.status === 401 || response.status === 403) {
    console.warn("[API] Token inválido — limpando sessão");
    localStorage.removeItem("authToken");
    localStorage.removeItem("userInfo");
    window.location.href = "/";
  }

  return response;
}
