<script setup lang="ts">
import router from '../router'
import Robot from '../components/Robot.vue'

import { bots } from '../../main/data/robots';

setInterval(() => {
    // call the main process back to get the status of this robot, and see if anyone is using it
}, 2000) // every 2s
</script>

<template>
    <h1>Robot Settings</h1>
    <button @click="router.replace('/lobby')">&lt;&nbsp;Back</button>

    <div v-for="bot of bots">
        <Robot :robot="bot" />
    </div>
    
    
    <p>Twonky</p> <!-- true to RoboRally -->
    <p>Panzer-X90</p> <!-- pretty much a tank -->
    <p>Zephyr (MarkII)</p> <!-- sleek and hexagonal, 6-wheels, spikes on/between the wheels -->
    <p>Bladestorm</p> <!-- spin bot but with a more stable base -->
    <p>Axel-V8</p> <!-- zoom bot, has 2 big wheels, a spoiler, and shaker scoop -->
    <p>Thor</p> <!-- Norse-themed hammer bot -->
</template>