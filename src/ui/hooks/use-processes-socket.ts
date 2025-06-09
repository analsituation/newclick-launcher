import { useEffect } from "react";
import type { RunningProcesses } from "../../dto/types";

export function useProcessSocket(onUpdate: (data: RunningProcesses) => void) {
  useEffect(() => {
    const socket = new WebSocket("ws://localhost:4000");

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === "processes") {
        onUpdate(message.data);
      }
    };

    socket.onerror = (error) => {
      console.error("Ошибка WebSocket", error);
    };

    return () => {
      socket.close();
    };
  }, [onUpdate]);
}
