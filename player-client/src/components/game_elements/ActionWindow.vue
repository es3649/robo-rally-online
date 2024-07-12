<script setup lang="ts">
import ProgrammingCard from './ProgrammingCard.vue'
import { useGameStateStore } from '@/stores/game_state'

const game_state = useGameStateStore()

</script>

<template>
    <main>
        <h5>{{ game_state.action?.actor.name }}</h5>
        <ProgrammingCard 
            v-if="game_state.action"
            :size="75"
            :value="game_state.action?.action.action" 
            :fill_color="game_state.action?.actor.colors?.fill_color"
            :border_color="game_state.action?.actor.colors?.border_color"
        />
    </main>
</template>