<script setup lang="ts">
import router from '../router';
function beginSetup(): void {
    window.electronAPI.connectRobot('ur mom')
    router.push('/lobby')
}
</script>

<template>
    <main>
        <h1>Home</h1>
        <button @click="beginSetup()">Begin Setup</button>
    </main>
</template>