# RoboRally Online

RoboRally Online is a Typescript/robotics implementation of the RoboRally board game, by Richard Garfield and Renegade Game Studio.

One day, while playing RoboRally, I thought to myself, _"How cool would it be if the robots on the board were actual robots, and I could actually program them?"_ so I decided to make it for real.
I started with a high-school physics knowledge of electronics, then read forums, watched videos, and bothered friends until I was able to figure out how to make it work.
This repository contains a majority of the files and code needed to bring the project to life.

**Disclaimer**: This project is not affiliated with nor endorsed by Richard Garfield nor Renegade Game Studio

## Contents

* [Contents](#contents)
* [Setup Instructions](#setup-instructions)
* [Project Structure](#project-structure)
    * [Player Client](#player-client)
    * [Host Application](#host-application)
    * [Bot Drivers](#bot-drivers)
    * [Schematics](#schematics)

## Setup Instructions

This project is the fullest stack application&mdash;all it's missing is a database.
Instructions for setting up a game (assuming the code is installed, running, and the bots are assembled) can be found in [playing.md](./doc/playing.md).
More comprehensive setup instructions, including instructions for setting up the execution environment and assembling bots, are provided in [setup.md](./doc/setup.md).

## Project Structure

The project is broken into 4 main parts:

* Player Client
* Host Application
* Bot Drivers
* Schematics

### Player Client

The Player Client, contained in the `player-client` directory, is a Vue+Vite+Pinia web application which provides a web interface for playing the game

### Host Application

The host application, in the `robo-rally-host` folder, is an Electron+Vite+Vue3 desktop application written in Typescript which provides an interface for starting the game, choosing some game settings, and managing Bluetooth connections with the robots.
It also contains a express-powered and socket.io-enabled server for hosting and joining games, and for handling communication with the players.
This server serves the Player Client.

### Bot Drivers

The bot drivers, in the `bot-drivers` directory, are a series of Arduino programs, designed to control robots over a Bluetooth connection managed by the host.

### Schematics

The `schematics` folder contains PCB and CAD schematics.

The PCB schematics are created using KiCad to model the custom boards used inside each robot.
For simplicity, there is one schematic to service all bots, and thus all robot features will be supported on each PCB.
Robots which do not support a certain feature, will simply have relevant components omitted, and will not have those components supported in their drivers.

CAD schematics are created in OnShape, and contain the 3D models for the robots.
Each of these is unique.
