<script setup lang="ts">
import { GamePhase } from '@/shared/models/game_data';
import { useGameStateStore } from '@/stores/client_game_state';

const c_gs = useGameStateStore()

function finished() {
    c_gs.phase = GamePhase.Programming
}

</script>

<template>
    <main>
        <h2>Upgrades</h2>
        <div v-if="c_gs.phase == GamePhase.Upgrade">
            <!-- current execution (register #, cur player, ) -->
            <button @click="c_gs.draw_upgrade" 
            :disabled="c_gs.energy < 1"
            :title="c_gs.energy < 1 ? 'Insufficient energy' : undefined"
            >Draw Upgrade (1 Energy)</button>
            <h3>Upgrade Hand</h3>
            <p>Not Implemented</p>
            <button @click="finished()">Continue</button>
        </div>
        <div>
            <h3>Installed Upgrades</h3>
            <p>Not Implemented</p>
        </div>
    </main>
</template>