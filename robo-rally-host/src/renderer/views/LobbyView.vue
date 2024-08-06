<script setup lang="ts">
import { gameStore } from '../../main/stores/game_store';
import { Ref, ref } from 'vue';

const board: Ref<string> = ref("")
const lobby_open: Ref<boolean> = ref(false)

function openLobby(): void {

    lobby_open.value = true
    gameStore.lobby_closed = false
}
</script>

<template>
    <main>
        <!--
        - start with selecting board settings and whatnot
        - have a button to open the lobby to players, and display local IP address
        - display which players have joined, which bot they have selected, and whether the bot is online yet
        - button to start the game -->
        <select id="board_select" v-model="board">
            <option value="" default disabled>Choose a Board</option>
            <option value="the_keep">The Keep</option>
            <option value="laser_maze">Laser Maze</option>
        </select>
        
        <p>{{ board }}</p>
        <button v-if="!lobby_open" :disabled="board==''" @click="openLobby">Start Lobby</button>
    </main>
</template>