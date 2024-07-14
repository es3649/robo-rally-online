<script setup lang="ts">
import { ref } from 'vue'
import type { Ref } from 'vue';
import { useGameStateStore } from '@/stores/game_state'
import ProgrammingCard from './ProgrammingCard.vue'
import { ProgrammingCard as Card } from '@/models/game_data';
import draggable from 'vuedraggable';
import { GamePhase } from '@/models/game_data';

const game_state = useGameStateStore()

declare type onMoveEvent<T> = {
    to: HTMLElement,
    from: HTMLElement,
    dragged: HTMLElement,
    draggedRect: DOMRect,
    related: HTMLElement,
    relatedRect: DOMRect,
    willInsertAfter: boolean,
    index: number,
    element: T,
    futureIndex: number
}

/**
 * This is currently passed to @change on the draggable to stop the registers from getting too
 * long, however it's kind of a band-aid. I would like to prevent new objects from being added
 * at all, instead of just removing them after the fact.
 * 
 * If the registers are set to be the correct size with overflow=hidden in CSS, this actually
 * looks OK because you can't see the other one going in
 * 
 * I may be able to use the @move, @add, or @update handles as well.
 */
function rebalance(): void  {
    game_state.registers.forEach((register:Card[]) => {
        // make sure that the register isn't too full
        while (register.length > 1) {
            // take the card off
            const card = register.pop()
            // put it back in the hand
            game_state.programming_hand.push(card)
        }
    })
}


</script>

<template>
    <div class="register-array">
        <div v-for="(_, idx) in game_state.registers">
            <draggable
                class="register"
                :disabled="game_state.phase != GamePhase.Programming"
                v-model="game_state.registers[idx]"
                @change="rebalance"
                group="in_play"
                item-key="id"
            >
                <template #item="{ element: card }">
                    <ProgrammingCard fill_color="#456" border_color="#123" :value="card.action"></ProgrammingCard>
                </template>
            </draggable>
        </div>
    </div>




    
</template>

<style scoped>
.register-array {
    display: flex;
}
.empty-slot, .register {
    min-width: 100px;
    height: 117px;
    overflow: hidden;
    background-color: #808080;
    border-color: #353535;
    border-style: solid;
    border-width: 3px;
    border-radius: 10px;
}
</style>