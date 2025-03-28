<script setup lang="ts">
import PlayerDataBrief from '@/shared/components/PlayerDataBrief.vue';
import { useGameStateStore } from '@/stores/client_game_state';

const c_gs = useGameStateStore()
</script>

<template>
    <ul>
        <li v-for="state of c_gs.opponent_states">
            <PlayerDataBrief :state="state"/>
        </li>
    </ul>
</template>

<style scoped>

.inactive {
    color: #666;
    text-decoration: line-through;
}
</style>