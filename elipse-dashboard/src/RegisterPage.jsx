import { useState, useEffect } from "react";

export default function RegisterPage() {
    const params = new URLSearchParams(window.location.search);
    const invite = params.get("invite");

    const [valid, setValid] = useState(null);
    const [user, setUser] = useState("");
    const [senha, setSenha] = useState("");
    const [msg, setMsg] = useState("");

    useEffect(() => {
        if (!invite) {
            setValid(false);
            return;
        }
        fetch(`${API_BASE}/auth/verify-invite`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ invite })
        })
            .then((res) => res.json())
            .then((data) => setValid(data.valid))
            .catch(() => setValid(false));
    }, [invite]);

    const handleRegister = async (e) => {
        e.preventDefault();
        const res = await fetch(`${API_BASE}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ invite, user, senha })
        });
        const data = await res.json();
        if (res.ok) setMsg("✅ Usuário registrado com sucesso!");
        else setMsg("❌ " + (data.erro || "Erro no registro"));
    };

    if (valid === null) return <p>Verificando convite...</p>;
    if (!valid) return <p className="text-red-500">Convite inválido ou expirado.</p>;

    return (
        <form onSubmit={handleRegister} className="max-w-md mx-auto mt-20 p-6 bg-white shadow rounded">
            <h1 className="text-xl font-bold mb-4">Registrar Usuário</h1>
            {msg && <p className="mb-2">{msg}</p>}
            <input
                type="text"
                placeholder="Usuário"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                className="w-full p-2 border rounded mb-2"
            />
            <input
                type="password"
                placeholder="Senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full p-2 border rounded mb-2"
            />
            <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">
                Registrar
            </button>
        </form>
    );
}
