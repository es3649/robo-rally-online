import express, { Express, Request, Response } from 'express'
import dotenv from "dotenv";

import { games_post_handler, games_delete_handler } from './handlers/game_handlers'
import { join_post_handler } from './handlers/join_handlers'

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

// define the endpoints
// this is pretty simple thanks to express
app.post('/API/]games', games_post_handler)
app.delete('/API/games', games_delete_handler)
app.post('/API/join', join_post_handler)

// add a file handler at the root
app.use('/', express.static('public'))

// listen and serve
app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
