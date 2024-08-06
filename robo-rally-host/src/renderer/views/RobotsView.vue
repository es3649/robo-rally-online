<script setup lang="ts">
import router from '../router'
</script>

<template>
    <h1>Robot Settings</h1>
    <button @click="router.back()">&lt;&nbsp;Back</button>

    <p>Twonky</p> <!-- true to RoboRally -->
    <p>Panzer-X90</p> <!-- pretty much a tank -->
    <p>Zephyr (MarkII)</p> <!-- sleek and hexagonal, 6-wheels, spikes on/between the wheels -->
    <p>Bladestorm</p> <!-- spin bot but with a more stable base -->
    <p>Axel-V8</p> <!-- zoom bot, has 2 big wheels, a spoiler, and shaker scoop -->
    <p>Thor</p> <!-- Norse-themed hammer bot -->
</template>