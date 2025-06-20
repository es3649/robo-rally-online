<script setup lang="ts">
import { GamePhase } from '@/shared/models/game_data';
import { GameWindows, useGameStateStore } from '@/stores/client_game_state';

const c_gs = useGameStateStore()

function finished() {
    c_gs.phase = GamePhase.Programming
    c_gs.game_display = GameWindows.DEFAULT
}

</script>

<template>
    <main>
        <div>
            <h3>Installed Upgrades</h3>
            <p>Not Implemented</p>
        </div>
        <div v-if="c_gs.phase == GamePhase.Upgrade">
            <!-- current execution (register #, cur player, ) -->
            <h3>Upgrade Hand</h3>
            <button @click="c_gs.draw_upgrade"
            class="draw"
            :disabled="c_gs.energy < 1"
            :title="c_gs.energy < 1 ? 'Insufficient energy' : undefined"
            >Draw (1⚡️)</button>
            <p>Not Implemented</p>
            <button @click="finished()">Continue</button>
        </div>
    </main>
</template>

<style scoped>
h3 .draw {
    display: inline;
}
</style>