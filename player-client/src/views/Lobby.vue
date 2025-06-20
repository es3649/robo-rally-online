<script setup lang="ts">
import type { Character, CharacterID } from '@/shared/models/player';
import { useConnectionStore } from '@/stores/client_connection';
import { useGameStateStore } from '@/stores/client_game_state';
import { ref } from 'vue';


const c_cs = useConnectionStore()
const c_gs = useGameStateStore()
// when we load, request the available characters, and display them

const selecting = ref(false)
// TODO rotate image while waiting for game start
const loading_images = [
  c_gs.character?.sprite_large,
  '/src/assets/loading/schematic.png',
  '/src/assets/loading/PCB_sheet.png'
]
const loading_image_idx = ref(0)

c_cs.getCharacters((result: Character[], available: CharacterID[]) => {
  for (const character of available) {
    c_gs.available_characters.add(character)
  }
  c_gs.all_characters = result
})

function select(character: Character) {
  selecting.value = true
  console.log("Selected: ", character)
  c_cs.selectCharacter(character.id, (message?: string) => {
    if (message) {
      console.log(message)
    } else {
      c_gs.character = character
    }
    selecting.value = false
  }) 
}

setInterval(() => {
  if(loading_image_idx.value + 1 >= loading_images.length) {
    loading_image_idx.value = 0
  } else {
    loading_image_idx.value++
  }
}, 5000)
</script>

<template>
  <main>
    <!-- <h2 class="text-center">Lobby</h2> -->
    <div v-if="c_gs.character === undefined">
      <h4 class="text-center">Select a character</h4>
      <div class="flex-rows character-grid">
        <div v-for="character of c_gs.all_characters" :key="character.id" class="gridded character-card flex-1">
          <img class="sprite" :src="character.sprite_small" :alt="`Small sprite of ${character.name }`">
          <div class="text-center">
            <p class="no-top-margin">{{ character.name }}</p>
            <button :disabled="selecting || !c_gs.available_characters.has(character.id)" @click="select(character)">Select</button>
          </div>
        </div>
      </div>
    </div>
    <div v-else>
      <h2>Waiting for the host to start the game</h2>
      <!-- <img :src="c_gs.character.sprite_large" :alt="`Small sprite of ${c_gs.character.name}`"> -->
      <p>Character: {{ c_gs.character.name }}</p>
      <img class="loading" :src="loading_images[loading_image_idx]">
    </div>
  </main>
</template>

<style lang="css" scoped>
main {
  margin: 0px 8px;
}

.character-grid {
  grid-template-columns: 1fr 1fr;
  justify-content: center;
  gap: 0.5em;
}

.character-card {
  align-items: center;
  justify-items: center;
  background-color: var(--secondary);
  border: .125em var(--accent) solid;
  border-radius: .5em;
  /* margin: .5em; */
  width: 100%;
  padding: .5em;
  grid-template-rows: 1fr 1fr;
  max-width: 250px;
}

.sprite {
  max-width: 150px;
}


</style>