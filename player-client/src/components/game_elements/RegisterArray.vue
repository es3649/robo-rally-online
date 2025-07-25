<script setup lang="ts">
import { useGameStateStore } from '@/stores/client_game_state'
import ProgrammingCard from '@/shared/components/ProgrammingCard.vue'
import { ProgrammingCard as Card } from '@/shared/models/game_data';
import draggable from 'vuedraggable';
import { GamePhase } from '@/shared/models/game_data';

const props = defineProps<{
    disabled: boolean
}>()

const c_gs = useGameStateStore()

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
 * This is currently passed to @add on the draggable to stop the registers from getting too
 * long, however it's kind of a band-aid. I would like to prevent new objects from being added
 * at all, instead of just removing them after the fact.
 * 
 * If the registers are set to be the correct size with overflow=hidden in CSS, this actually
 * looks OK because you can't see the other one going in
 * 
 * I may be able to use the @move, @change, or @update handles as well.
 */
function rebalance(): void  {
    // TODO: if we have crab legs, the length is 2, and it contains one turn and a move forward,
    // then move the cards elsewhere to hold, and create a move right/left
    c_gs.registers.forEach((register:Card[]) => {
        // make sure that the register isn't too full
        while (register.length > 1) {
            // take the card off
            const card = register.pop()
            // put it back in the hand
            c_gs.programming_hand.push(card)
        }
    })
}
</script>

<template>
    <div class="register-array">
        <div v-for="(_, idx) in c_gs.registers" class="register">
            <draggable
                class="drop-area"
                :disabled="!c_gs.programming_enabled"
                v-model="c_gs.registers[idx]"
                @add="rebalance"
                group="in_play"
                item-key="id"
            >
                <template #item="{ element: card }">
                    <ProgrammingCard fill_color="#456" border_color="#123" :value="card.action" :size="70"></ProgrammingCard>
                </template>
            </draggable>
        </div>
    </div>
</template>

<style scoped>

.register-array {
    display: flex;
    flex-direction: column;
}

.empty-slot, .register {
    --border: .0625rem;
    --dim: calc(var(--border) * 2 + var(--card-dim));
    margin: calc(var(--card-margin) - var(--border));
    border: var(--border) solid var(--primary);
    border-radius: var(--card-border-radius);
    height: var(--dim);
    width: var(--dim);
    overflow: hidden;
    background-color: var(--secondary);
}

.drop-area {
    height: var(--dim);
    width: var(--dim);
}

@media screen and (min-width: 1080px) {
    .register-array {
        flex-direction: row;
    }
}

</style>