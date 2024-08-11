<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';
// import components and views

// window.electronAPI.sendMessage('Hello from App.vue!')
</script>

<template>
    <div>
        <h1>Welcome!</h1>
        <p>Now rendering a Vue App :D</p>
        <nav>
            <RouterLink to="/robots">Robots</RouterLink>
            &nbsp;
            <RouterLink to="/board">Board</RouterLink>
        </nav>
        <RouterView />
    </div>
</template>