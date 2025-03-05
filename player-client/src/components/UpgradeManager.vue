<script setup lang="ts">
import { GamePhase } from '@/models/game_data';
import { useGameStateStore } from '@/stores/client_game_state';

const c_gs = useGameStateStore()

function finished() {
    c_gs.phase = GamePhase.Programming
}

</script>

<template>
    <main>
        <p>There's nothing to see here</p>
         <!-- current execution (register #, cur player, ) -->
         <button @click="c_gs.draw_upgrade" 
                :disabled="c_gs.energy < 1"
                :title="c_gs.energy < 1 ? 'Insufficient energy' : undefined"
            >Draw Upgrade (1 Energy)</button>
        <button @click="finished()">Continue</button>
    </main>
</template>