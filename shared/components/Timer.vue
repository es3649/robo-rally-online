<script setup lang="ts">
import { ref } from 'vue';


const props = defineProps<{
    timeout: number
}>()

const emit = defineEmits({
    "time-up"() { return true }
})

const timer = ref(props.timeout)
if (timer.value !== undefined && timer.value > 0) {
    // set the time to countdown
    timer.value = props.timeout
    const to = setInterval(() => {
        // decrement every second
        timer.value -= 1

        if (timer.value <= 0) {
            // destroy the component or notify the parent that time is up
            emit('time-up')
            clearInterval(to)
        }
    }, 1000)
}

</script>

<template>
    <span>{{ timer }}</span>
</template>