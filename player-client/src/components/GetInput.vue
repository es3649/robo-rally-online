<script setup lang="ts">
import Timer from '@/shared/components/Timer.vue';
import type { PendingActionChoice } from '@/shared/models/connection';
import { ref } from 'vue';

const props = defineProps<{
    request: PendingActionChoice
}>()

const emit = defineEmits({
    // this emission should handle removal of the component
    selected(selection: string) { return true }
})

const selected = ref('')

function make_selection() {
    if (selected.value == '') {
        return
    }

    console.log('Selection made:', selected.value)
    emit('selected', selected.value)
}

function time_up() {
    if (!selected.value) {
        selected.value = props.request.options[Math.floor(Math.random()*props.request.options.length)]
    }
    make_selection()
}
</script>

<template>
    <form @submit.prevent="make_selection">
        <h3>Make a selection:</h3>
        <p>{{ request.prompt }}</p>
        <ul>
            <li v-for="option of request.options">
                <input type="radio" :value="option" v-model="selected" name="selection">
                <label :for="option">{{ option }}</label>
            </li>
        </ul>
        <input type="submit" :disabled="selected == ''">

        <p>Time Remaining: <Timer :timeout="request.expiration" @time-up="time_up" /> </p>
    </form>
</template>