<script setup lang="ts">
import { useGameStateStore } from '@/stores/client_game_state';

const game_state = useGameStateStore()
</script>

<template>
    <table>
        <thead>
            <td>Player</td>
            <td>Energy</td>
            <td>Checkpoints</td>
            <td>Priority</td>
        </thead>
        <tbody>
            <tr v-for="player in game_state.opponent_states">
                <td :class="{ inactive: !player.active }">{{ player.name }}</td>
                <td>{{ player.energy }}</td>
                <td>{{ player.checkpoints }}</td>
                <td>{{ player.priority }}</td>
            </tr>
        </tbody>
    </table>
</template>

<style scoped>

.inactive {
    color: #666;
    text-decoration: line-through;
}
</style>