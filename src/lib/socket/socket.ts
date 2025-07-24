import { useEffect, useRef } from "react";

interface SocketEvent {
    type: string;
    data: any;
}

export interface SocketProvider {
    connect: () => void;
    disconnect: () => void;
    on: (event: string, callback: (message: MessageEvent<string>) => void) => void;
    emit: (event: string, data?: any) => void;
}

export const useSocket = (url: string): SocketProvider => {
    const socketRef = useRef<WebSocket | null>(null);

    const connect = () => {
        if (socketRef.current) return;

        socketRef.current = new WebSocket(url);

        socketRef.current.onopen = () => {
            console.log("WebSocket connected");
        };

        socketRef.current.onclose = () => {
            console.log("WebSocket disconnected");
        };

        socketRef.current.onerror = (error) => {
            console.error("WebSocket error:", error);
        };
    };

    const disconnect = () => {
        if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
        }
    };

    const on = (event: string, callback: (message: MessageEvent<string>) => void) => {
        if (!socketRef.current) return;

        socketRef.current.onmessage = (event) => {
            const message = JSON.parse(event.data) as SocketEvent;
            if (message.type === event) {
                callback(event);
            }
        };
    };

    const emit = (event: string, data?: any) => {
        if (!socketRef.current) return;

        const message = {
            type: event,
            data: data
        };

        socketRef.current.send(JSON.stringify(message));
    };

    useEffect(() => {
        connect();

        return () => {
            disconnect();
        };
    }, [url]);

    return {
        connect,
        disconnect,
        on,
        emit
    };
};
