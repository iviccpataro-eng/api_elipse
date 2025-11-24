// src/utils/normalizeVariable.js
export function normalizeVariable(v = []) {
    return {
        tipo: v[0] ?? "",
        nome: v[1] ?? "",
        valor: v[2] ?? "",
        unidade: v[3] ?? "",
        hasGraph: v[4] ?? true,
        nominal: v[5] ?? null,
        raw: v
    };
}
