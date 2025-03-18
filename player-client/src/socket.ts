import { io, Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "./shared/models/connection";
// import type { ClientToServerEvents, ServerToClientEvents } from "./models/connection";

const URL = process.env.NODE_ENV === "production" ? '/' : 'http://localhost'
console.log(`using ${URL}`)

// export const socket: Socket<ClientToServerEvents, ServerToClientEvents> = io(URL);
export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(URL);

export const TIMEOUT = 5000

// io: undefined as  Socket<ClientToServerEvents, ServerToClientEvents>|undefined,
