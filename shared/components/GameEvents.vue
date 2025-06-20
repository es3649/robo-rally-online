<script setup lang="ts">
import { ref } from 'vue';
import type { GameAction } from '../models/game_data'
import GameEvent from "./GameEvent.vue"

const props = defineProps<{
    events: GameAction[],
    max_events: number,
}>()

</script>

<template>
    <div class="gridded event-grid">
        <GameEvent v-for="event of props.events.slice(-max_events).reverse()" :event="event" />
    </div>
</template>

<style scoped>
.event-grid {
    grid-template-columns: 1fr;
    gap: var(--card-margin);
    margin-top: var(--card-margin);
}
</style>