import { io } from "socket.io-client";
// import type { ClientToServerEvents, ServerToClientEvents } from "./models/connection";

const URL = process.env.NODE_ENV === "production" ? '/' : 'http://localhost'
console.log(`using ${URL}`)

// export const socket: Socket<ClientToServerEvents, ServerToClientEvents> = io(URL);
export const socket = io(URL);

// io: undefined as  Socket<ClientToServerEvents, ServerToClientEvents>|undefined,
