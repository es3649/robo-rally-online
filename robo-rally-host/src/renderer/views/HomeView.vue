<script setup lang="ts">
import router from '../router';
function beginSetup(): void {
    router.replace('/board-loader')
}
</script>

<template>
    <main>
        <h1>Welcome to</h1>
        <img src="../../shared/assets/rrlogofinal.png" alt="RoboRally Logo"></img>
        <button class="big-button" @click="beginSetup()">Begin Setup</button>
    </main>
</template>