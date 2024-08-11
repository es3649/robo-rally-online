console.log('running serverjs')
import express, { type Express } from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
// import dotenv from 'dotenv'
import cors from 'cors'
// import { joinHandler } from './main/server/handlers/join_handlers'
// import { getRobotsHandler, selectRobotHandler } from './main/server/handlers/robot_handlers'

// import { ClientToServerEvents, ServerToClientEvents} from '../models/connection'

const app: Express = express()
const port = process.env.PORT || 80
const server = createServer(app)
// we may need to reset the path here
// https://socket.io/docs/v4/server-options/#path
// const io = new Server<ClientToServerEvents, ServerToClientEvents>(server)
// const io = new Server(server)

app.use(cors())

// add a file handler at the root
// app.get('/', express.static('./public'))

app.use(express.static(__dirname+'/public'))

// handle the connection event
// io.on('connection', (socket) => {
//     console.log('a user connected')
    
//     // lobby events
//     socket.on('join', joinHandler)
//     socket.on('getRobots', getRobotsHandler)
//     socket.on('selectRobot', selectRobotHandler)

//     // game events
// })

process.parentPort.once('message', (e) => {
    const [port] = e.ports
    console.log('got a message')
})


// listen and serve
// app.listen(port, () => {
server.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});

console.log("Hello World")