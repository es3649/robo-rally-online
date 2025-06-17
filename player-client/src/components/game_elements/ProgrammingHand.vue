<script setup lang="ts">
import { useGameStateStore } from '@/stores/client_game_state'
import ProgrammingCard from '@/shared/components/ProgrammingCard.vue'
import draggable from 'vuedraggable';
import { ref } from 'vue';

const game_state = useGameStateStore()

const drag = ref(false)
</script>

<template>
    <draggable class="hand" v-model="game_state.programming_hand" @start="drag=true" @end="drag=false" group="in_play" item-key="id">
        <template #item="{ element }">
            <ProgrammingCard class="a-card" :value="element?.action" fill_color="#a0a0a0" border_color="#353535" :size="50"></ProgrammingCard>
        </template>
    </draggable>
</template>

<style scoped>
.a-card {
    width: 100px;
    height: 100px;
    flex: 1;
}

.hand {
    display: flex;
    flex-wrap: wrap;
}
</style>