<script setup lang="ts">
import type { GameAction } from '../models/game_data'
import ProgrammingCard from './ProgrammingCard.vue'

const props = defineProps<{
    event: GameAction
}>()
</script>

<template>
    <div class="gridded action_grid">
        <div>
            <p class="no-top-margin">{{ event.actor.name }}</p>
            <p>{{ event.action.action.toString() }}</p>
        </div>
        <div class="grid-right">
            <ProgrammingCard :value="event.action.action" :size="70" :fill_color="event.actor.character.color.fill_color" :border_color="event.actor.character.color.border_color" />
        </div>
    </div>
</template>

<style scoped>
.action_grid {
    grid-template-columns: 1fr 1fr;
}
</style>