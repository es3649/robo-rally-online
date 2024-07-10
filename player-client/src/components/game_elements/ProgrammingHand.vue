<script setup lang="ts">
import { useGameStateStore } from '@/stores/game_state'
import ProgrammingCard from './ProgrammingCard.vue'

const game_state = useGameStateStore()
</script>

<template>
    <ProgrammingCard v-for="card in game_state.programming_hand" :value="card" fill_color="#a0a0a0" border_color="#353535"></ProgrammingCard>
</template>