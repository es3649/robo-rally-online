<script setup lang="ts">
import { useGameStateStore } from '@/stores/client_game_state'
import ProgrammingCard from '@/shared/components/ProgrammingCard.vue'
import draggable from 'vuedraggable';
import { ref } from 'vue';

const game_state = useGameStateStore()

const drag = ref(false)
</script>

<template>
    <draggable class="hand flex flex-rows" v-model="game_state.programming_hand" @start="drag=true" @end="drag=false" group="in_play" item-key="id">
        <template #item="{ element }">
            <ProgrammingCard :value="element?.action" fill_color="#a0a0a0" border_color="#353535" :size="70"></ProgrammingCard>
        </template>
    </draggable>
</template>

<style scoped>

.hand {
    margin: var(--card-margin);
    gap: calc(2 * var(--card-margin));
    align-content: flex-start;
}
</style>