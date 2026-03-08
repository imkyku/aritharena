import { io, Socket } from 'socket.io-client';

let socketInstance: Socket | null = null;

export function getSocket(token: string): Socket {
  if (socketInstance && socketInstance.connected) {
    return socketInstance;
  }

  const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || '/';

  socketInstance = io(`${socketUrl}/realtime`, {
    transports: ['websocket'],
    auth: {
      token,
    },
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 500,
  });

  return socketInstance;
}

export function disconnectSocket(): void {
  if (!socketInstance) {
    return;
  }

  socketInstance.disconnect();
  socketInstance = null;
}
