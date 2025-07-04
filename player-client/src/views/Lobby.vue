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
  '/src/assets/loading/schematic_sheet.png',
  '/src/assets/loading/PCB_sheet.png',
  '/src/assets/loading/motor_schematic_sheet.png'
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
      // Add the character's sprite to the array and set the index to point at that character
      loading_images.push(character.sprite_large)
      loading_image_idx.value = loading_images.length - 1
      start_loading_screens()
    }
    selecting.value = false
  }) 
}

function start_loading_screens() {
  setInterval(() => {
    if(loading_image_idx.value + 1 >= loading_images.length) {
      loading_image_idx.value = 0
    } else {
      loading_image_idx.value++
    }
  }, 5000)
}
</script>

<template>
  <main>
    <!-- <h2 class="text-center">Lobby</h2> -->
    <div v-if="c_gs.character === undefined" class="background-card character-content">
      <h4 class="text-center">Select a character</h4>
      <div class="flex flex-rows character-grid">
        <div v-for="character of c_gs.all_characters" :key="character.id"
            class="gridded character-card flex-1"
            :class="{faded: !c_gs.available_characters.has(character.id)}">
          <img class="sprite" :src="character.sprite_small" :alt="`Small sprite of ${character.name }`">
          <div class="text-center">
            <p class="no-top-margin">{{ character.name }}</p>
            <button :disabled="selecting || !c_gs.available_characters.has(character.id)" @click="select(character)">Select</button>
          </div>
        </div>
      </div>
    </div>
    <div v-else>
      <div class="background-card wait-screen">
        <h2>Waiting for the host to start the game</h2>
        <!-- <img :src="c_gs.character.sprite_large" :alt="`Small sprite of ${c_gs.character.name}`"> -->
        <p>Character: {{ c_gs.character.name }}</p>
      </div>
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
  max-height: 100%;
  overflow: scroll;
  transition: all .5s ease-out;
}

.faded {
  opacity: 70%;
}

.character-content {
  margin: 10%;
  border-radius: 4vh;
}

.wait-screen {
  padding: .5em;
}

@media screen and (max-width: 1079px) {
  .character-content {
    padding-top: .5em;
    padding-bottom: 1em;
  }
}
</style>