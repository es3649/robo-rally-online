<script setup lang="ts">
import { useConnectionStore } from '@/stores/client_connection';
import ConnectionStatus from './ConnectionStatus.vue';
import { GameWindows, useGameStateStore } from '@/stores/client_game_state';
import { GamePhase } from '@/shared/models/game_data';

const c_cs = useConnectionStore()
const c_gs = useGameStateStore()

function programming() {
  c_gs.programming_enabled = true
  c_gs.phase = GamePhase.Programming
}

function upgrade() {
  c_gs.phase = GamePhase.Upgrade
}

function activation() {
  c_gs.phase = GamePhase.Activation
}

function show_help() {
    c_gs.help_open = true
}

function get_input() {
    c_gs.request = {
        prompt: "Choose one of these bodacious options",
        options: [
            "Battleship",
            "Clue",
            "Electric Football",
            "Twister"
        ],
        expiration: 30
    }
    c_gs.game_display = GameWindows.DEFAULT
}

</script>

<template>
    <main>
        <h2>Settings</h2>
        <h3>Control Buttons</h3>
         <button @click="upgrade">Upgrade</button>
            <button @click="programming">Programming</button>
            <button @click="activation">Activation</button>
            <div class="control">
                <button @click="c_gs.new_action()">New action</button>
                <button @click="show_help()">Show help</button>
                <button @click="get_input">Get Input</button>
            </div>
        <p>Session ID: <span class="text-primary text-smaller">{{ c_cs.id ? c_cs.id : "<none>" }}</span></p>
        <p>Connection Status: <span v-if="c_cs.connected" class="connected">Connected</span>
            <span v-else class="disconnected">
                <button @click="c_cs.connect()">Reconnect</button>
            </span>
        </p>
        <h3>Credits</h3>
        <p class="text-smaller">Development: Eric Steadman.
            <br />
            Game Design: Richard Garfield and Renegade Game Studios.
            <br />
            This project is not affiliated with nor endorsed by Richard Garfield nor Renegade Game Studios.
        </p>
    </main>
</template>

<style lang="css" scoped>
.connected {
    color: darkgreen;
}

.disconnected {
    color: var(--invert-color-text);
}
</style>