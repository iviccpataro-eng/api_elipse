// src/utils/api.js
export async function apiFetch(url, options = {}, navigate) {
    const token = localStorage.getItem("authToken");

    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const response = await fetch(url, {
        ...options,
        headers,
    });

    let data = null;

    try {
        data = await response.json();
    } catch {
        data = {};
    }

    // --- TRATAMENTO UNIVERSAL DE TOKEN EXPIRADO ---
    if (
        response.status === 401 ||
        data?.erro?.toLowerCase?.().includes("token")
    ) {
        localStorage.removeItem("authToken");
        navigate("/login");
        return null;
    }

    return data;
}
