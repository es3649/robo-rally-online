<script setup lang="ts">
import type { GameAction } from '../models/game_data'
import ProgrammingCard from './ProgrammingCard.vue'

const props = defineProps<{
    event: GameAction
}>()
</script>

<template>
    <div>
        <p>{{ event.actor.name }}</p>
        <ProgrammingCard :value="event.action.action" :size="25" :fill_color="event.actor.character.color.fill_color" :border_color="event.actor.character.color.border_color" />
    </div>
</template>