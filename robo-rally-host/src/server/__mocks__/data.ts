import { senderMaker, type ClientToServerEvents, type Server2MainMessage, type ServerToClientEvents, type SocketData } from "@/shared/models/connection";
import type { EventsMap } from "node_modules/socket.io/dist/typed-events";
import type { Server, Socket } from "socket.io";
import { store as original_store, connections as original_connections } from "../data"
import { Server2Main } from "@/shared/models/events";
import { jest } from '@jest/globals'

export declare type RRSocketServer = Server<ClientToServerEvents, ServerToClientEvents, EventsMap, SocketData>
export declare type RRSocketConnection = Socket<ClientToServerEvents, ServerToClientEvents, EventsMap, SocketData>

export const store = original_store
export const connections = original_connections

export const mock_sendable = {
    send: jest.fn((message: any,
        sendHandle?: any,
        options?: { keepOpen?: boolean|undefined } | undefined,
        callback?: ((error: Error|null) => void) | undefined
    ): boolean => {
        return true
    })
}

export const S2MSend = senderMaker<Server2Main>(mock_sendable)
