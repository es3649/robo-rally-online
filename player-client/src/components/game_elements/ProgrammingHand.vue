<script setup lang="ts">
import { useGameStateStore } from '@/stores/game_state'
import ProgrammingCard from './ProgrammingCard.vue'
import draggable from 'vuedraggable';
import { GamePhase } from '@/models/game_data';
import { ref } from 'vue';

const game_state = useGameStateStore()

const drag = ref(false)
</script>

<template>
    <draggable class="hand" v-model="game_state.programming_hand" @start="drag=true" @end="drag=false" group="in_play" item-key="id">
        <template #item="{ element }">
            <ProgrammingCard class="a-card" :value="element?.action" fill_color="#a0a0a0" border_color="#353535"></ProgrammingCard>
        </template>
    </draggable>
</template>

<style scoped>
.a-card {
    width: 100px;
    height: 100px;
}

.hand {
    display: flex;
}
</style>