import { useState } from "react";
import NodeTooltip from "./TooltipNode";

export default function NodeBox({ info }) {
    const [hover, setHover] = useState(false);

    const online = info.communication;

    return (
        <div
            className="relative"
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
        >
            <div
                className={`px-4 py-2 rounded-md border-2 shadow-sm cursor-pointer
          ${online ? "bg-green-100 border-green-500" : "bg-red-100 border-red-500"}`}
            >
                <div className="font-semibold text-gray-700">{info.name}</div>
                <div className="text-xs text-gray-500">{info.model}</div>
                <div className="text-xs">
                    Status: <span className="font-semibold">{online ? "Online" : "Offline"}</span>
                </div>
            </div>

            {hover && (
                <NodeTooltip info={info} />
            )}
        </div>
    );
}
