console.log('running serverjs')
import express, { type Express } from 'express'
import { createServer } from 'http'
import { randomUUID } from 'crypto'
import { Server, Socket } from 'socket.io'
import type { GameAction, RegisterArray } from "./main/models/game_data"
import { Client2Server, Default, Server2Main, Main2Server, type Main2ServerMessage, Server2Client } from './main/models/events'
// import dotenv from 'dotenv'

// import { getRobotsHandler, selectRobotHandler } from './main/server/handlers/robot_handlers'

import { senderMaker, type ClientToServerEvents, type ServerToClientEvents, type SocketData} from './main/models/connection'
import type { EventsMap } from 'node_modules/socket.io/dist/typed-events'
import { useBot } from './server/robot_handlers'

export const app: Express = express()
const port = process.env.PORT || 80
const server = createServer(app)
// we may need to reset the path here
// https://socket.io/docs/v4/server-options/#path
// const io = new Server<ClientToServerEvents, ServerToClientEvents>(server)
const io = new Server<ClientToServerEvents, ServerToClientEvents, EventsMap, SocketData>(server, {
    cors: {
        origin: "http://localhost:5174"
    }
})

// add a file handler at the root
app.use(express.static('assets/public_html'))

// create a sender wrapper for server to main communications
const S2MSender = senderMaker<Server2Main>(process)

// this connections map will hold all the socket connections in case we need to
// send a message to a particular user
const connections: Map<string, Socket> = new Map<string,Socket>()

// handle the connection event
io.on(Default.CONNECTION, (socket) => {
    console.log('a user connected')

    // generate a socket ID and store it
    const id = randomUUID()
    connections.set(id, socket)
    socket.data.id = id

    // connection events
    socket.on(Default.DISCONNECT, () => {
        console.log('a user disconnected')
        // remove the user from the connections
        connections.delete(socket.data.id)
        // notify the main that the player has disconnected
        S2MSender<never>({
            name: Server2Main.PLAYER_DISCONNECTED,
            id: socket.data.id
        })
    })
    
    // lobby events
    socket.on(Client2Server.JOIN_GAME, makeJoinHandler(socket.data.id))

    socket.on(Client2Server.GET_ID, (callback:(id:string) => void) => callback(socket.data.id))

    // game events
    socket.on(Client2Server.LIST_BOTS, () => S2MSender<never>({name: Server2Main.LIST_BOTS}))
    socket.on(Client2Server.SELECT_BOTS, (bot:string) => S2MSender<string>({
        name:Server2Main.SELECT_BOT,
        id: socket.data.id,
        data: bot
    }))
    socket.on(Client2Server.PROGRAM_SUBMIT, (program:RegisterArray) => { S2MSender<RegisterArray>({
        name: Server2Main.PROGRAM_SET,
        id: socket.id,
        data: program
    })})
    socket.on(Client2Server.PROGRAM_SHUTDOWN, () => S2MSender<never>({
        name: Server2Main.PROGRAM_SHUTDOWN,
        id: socket.data.id
    }))
    socket.on('client:request-upgrade', () => {console.log('client:request-upgrade is not implemented')})
    socket.on('client:add-upgrade', () => {console.log('client:add-upgrade is not implemented')})
})

// determine which message was received, send it back
process.on('message', (message: Main2ServerMessage<any>) => {
    switch (message.name) {
        case Main2Server.BOT_SELECTED:
            // we may need a server-level bot listing
            io.emit(Server2Client.BOT_SELECTED, message.data)
            break
        case Main2Server.GAME_ACTION:
            io.emit(Server2Client.GAME_ACTION, message.data)
            break
        case Main2Server.PHASE_UPDATE:
            io.emit(Server2Client.PHASE_UPDATE)
            break
        case Main2Server.RESET:
            io.emit(Server2Client.RESET)
            break
    }
})

// listen and serve
// app.listen(port, () => {
server.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});
