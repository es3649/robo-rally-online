import express, {Express, Request, Response} from 'express'
import dotenv from "dotenv";

import {games_get_handler, games_post_handler, games_delete_handler} from './handlers/game_handlers'
import {join_post_handler} from './handlers/join_handlers'

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

app.get('/', (req: Request, res: Response): void => {
  res.send('Express + TypeScript Server');
});

// define the endpoints
// this is pretty simple thanks to express
app.get('/games', games_get_handler)
app.post('/games', games_post_handler)
app.delete('/games', games_delete_handler)
app.post('/join', join_post_handler)

// listen and serve
app.listen(80, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
