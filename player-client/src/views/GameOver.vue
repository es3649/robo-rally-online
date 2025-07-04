<script setup lang="ts">
import { useGameStateStore } from '@/stores/client_game_state';


const c_gs = useGameStateStore()
</script>

<template>
    <div class="text-center">
        <div v-if="c_gs.winner != undefined">
            <div class="background-card">
                <h1>Game Over</h1>
                <h2 class="inline-large">Winner: {{ c_gs.winner.name }}</h2>
                &nbsp;<span class="inline-large text-smaller">as</span>&nbsp;
                <h2 class="inline-large">{{ c_gs.winner.character.name }}</h2>
            </div>
            <!-- <br/> -->
            <img class="large-sprite margin-above" :src="c_gs.winner.character.sprite_large" :alt="`Large sprite of ${c_gs.winner.character.name}`">
        </div>
        <div v-else>
            <div class="background-card">
                <h1>Game Over</h1>
                <h2>No Contest!</h2>
            </div>
            <img class="large-sprite margin-above" src="@/assets/rrlogofinal.png" alt="RoboRally logo">
        </div>
        <p class="background-card">Reset the game on the console</p>
    </div>
</template>

<style scoped>
h2 {
    margin: .25em 0px;
}

@media screen and (max-width: 1079px) {
    .margin-above {
        margin-top: 1.5em;
    }
}
</style>