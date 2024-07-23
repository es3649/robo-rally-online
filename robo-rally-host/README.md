# Robo Rally Host

RoboRally Host is a desktop application made with Electron and Vite+Typescript.
It contains the Express server which serves up the compiled player-client files, it manages the websocket connections which the player-clients establish to send and receive game data, it runs the game server, and manages the Bluetooth connections to the robots.
It really is the workhorse of the entire system.

It is designed to be run on Raspberry Pi 5, probably with some kind of screen attached, but I haven't figured that part out yet.