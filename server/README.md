# RoboRally `online` server

This module contains the server components for RoboRally `online`.

It is a Node+Express server in Typescript

## API Documentation

The server exposes the following API endpoints:

 * `/API/join`
 * `/API/games`

### `/API/games`

This endpoint accepts the POST, and DELETE methods.

#### POST

Creates a new game

Request Structure:

```json
{
  "game_type": "<the type of game: live|virtual>",
  "player_name": "<the name of the player creating the game>"
}
```

Response Structure:

```json
{
  "room_code": "<a 4-digit room code to identify the lobby>",
  "host_code": "<A UUID assigned to the host to validate their hostliness when they join the game>",
}
```

#### DELETE

Deletes the game

### `/API/join`

#### POST

Join a game (return connection details for the game)

Request structure:
```json
{
    "player_name": "<some name>",
    "game_code": "<some code, as returned from POST /API/game>",
    "host_key": "<optional: host key, as returned from POST /API/game>"
}
```

Return structure:
```json
{
    "host": "<an IP address or domain name where the game server can be reached>",
    "port": "<the port on the the host where the player is expected to connect>",
    "AES": "<a base64 encoded AES key which will be used for the TCP connection>"
}
```

## TCP Protocol

Once a game is joined, the client is expected to establish a TCP connection with the game server so that the client and server can have effective bidirectional communication without a need for polling.