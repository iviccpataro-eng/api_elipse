import React from "react";
import InviteGenerator from "./components/InviteGenerator";
import SystemConfig from "./components/SystemConfig";
import UpdateProfile from "./components/UpdateProfile";

export default function ToolsPage({ token, user }) {
    const handleSystemConfig = (config) => {
        console.log("Configurações do sistema:", config);
        // Aqui você pode salvar no localStorage, no backend ou aplicar no app
    };

    return (
        <div className="p-6 grid gap-6 md:grid-cols-2">
            {user?.role === "admin" && <InviteGenerator token={token} />}
            <SystemConfig onChange={handleSystemConfig} />
            <UpdateProfile token={token} />
        </div>
    );
}
