<script setup lang="ts">
import { useGameStateStore } from '@/stores/game_state'

const game_state = useGameStateStore()
</script>

<template>
    Energy: {{ game_state.energy }}
</template>