<script setup lang="ts">
import router from '../router';
function beginSetup(): void {
    router.replace('/boardloader')
}
</script>

<template>
    <main>
        <h1>Home</h1>
        <button @click="beginSetup()">Begin Setup</button>
    </main>
</template>