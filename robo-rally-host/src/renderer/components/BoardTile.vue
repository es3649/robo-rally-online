<script setup lang="ts">
import { Space, SpaceBoundaries, WallType } from '../../main/game_manager/board';
import { Rotation, RotationDirection } from '../../main/models/movement';
import { ref } from 'vue'
import { SpaceCoverType } from '../../main/game_manager/board'

const props = defineProps<{
    tile: Space
    boundary: SpaceBoundaries
    dim: number
}>()

const parent_style = ref(`width: ${props.dim}px; height: ${props.dim}px;`)

// tile background generated randomly
const background_path = ref(`res://tiles/empty_${Math.floor(Math.random()*5)}.svg`)
const background_transform = ref(`transform: rotate(${Math.floor(Math.random()*4)*90}deg);`)

// get the data and transform for a tile
const tile_path = ref('')
const tile_transform = ref('')

if (props.tile.type !== undefined) {
    tile_path.value = `res://tiles/${props.tile.type}.svg`
}
if (props.tile.orientation !== undefined) {
    const r = Rotation.fromOrientation(props.tile.orientation)
    const mod = r.direction == RotationDirection.CW ? 1 : -1
    tile_transform.value = `transform: rotate(${90*r.units*mod}deg);`
}

// get the data and transform for a cover
const cover_path = ref('')
const cover_transform = ref('')

if (props.tile.cover !== undefined) {
    if (SpaceCoverType.isCRUSHER(props.tile.cover)) {
        cover_path.value = 'res://tiles/crusher.svg'
    } else if (SpaceCoverType.isCHECKPOINT(props.tile.cover)) {
        cover_path.value = `res://tiles/checkpoint_${props.tile.cover.number}.svg`
    } else {    
        cover_path.value = `res://tiles/${props.tile.cover}.svg`
    }
}
if (props.tile.cover_orientation !== undefined) {
    const r = Rotation.fromOrientation(props.tile.cover_orientation)
    const mod = r.direction == RotationDirection.CW ? 1 : -1
    cover_transform.value = `transform: rotate(${90*r.units*mod}deg);`
}

// finally, handle walls
const wall_n_path = ref('')
const wall_e_path = ref('')
const wall_s_path = ref('')
const wall_w_path = ref('')

/**
 * Make the parent div fit to dim and the others just width: 100%
 */

if (props.boundary?.n) {
    if (WallType.isPUSH(props.boundary.n)) {
        wall_n_path.value = 'res://tiles/push.svg'
    } else {
        wall_n_path.value = `res://tiles/${props.boundary.n}.svg`
    }
}
if (props.boundary?.e) {
    if (WallType.isPUSH(props.boundary.e)) {
        wall_e_path.value = 'res://tiles/push.svg'
    } else {
        wall_e_path.value = `res://tiles/${props.boundary.e}.svg`
    }
}
if (props.boundary?.s) {
    if (WallType.isPUSH(props.boundary.s)) {
        wall_s_path.value = 'res://tiles/push.svg'
    } else {
        wall_s_path.value = `res://tiles/${props.boundary.s}.svg`
    }
}
if (props.boundary?.w) {
    if (WallType.isPUSH(props.boundary.w)) {
        wall_w_path.value = 'res://tiles/push.svg'
    } else {
        wall_w_path.value = `res://tiles/${props.boundary.w}.svg`
    }
}

// compute the transforms for each wall which is undefined
</script>

<template>
    <!--  -->
    <div class="parent" :style="parent_style"> 
        <img :src="background_path" :style="background_transform" class="sized">
        <img v-if="tile_path!=''" :src="tile_path" :style="tile_transform" class="sized overlaid tile">
        <img v-if="cover_path!=''" :src="cover_path" :style="cover_transform" class="sized overlaid cover">
        <img v-if="wall_n_path" :src="wall_n_path" class="sized overlaid wall_n" />
        <img v-if="wall_e_path" :src="wall_e_path" class="sized overlaid wall_e" />
        <img v-if="wall_w_path" :src="wall_w_path" class="sized overlaid wall_w" />
        <img v-if="wall_s_path" :src="wall_s_path" class="sized overlaid wall_s" />
    </div>
</template>

<style scoped>
.sized {
    width: 100%;
    height: 100%;
}
.parent {
    position: relative;
    display: block;
}
.overlaid {
    position: absolute;
    bottom: 0;
    right: 0;
}
.tile {
    z-index: 1;
}
.cover {
    z-index: 2;
}
.wall_n {
    transform: rotate(90deg);
    z-index: 3;
}
.wall_e {
    transform: rotate(180deg);
    z-index: 3;
}
.wall_s {
    transform: rotate(-90deg);
    z-index: 3;
}
.wall_w {
    z-index: 3;
}
</style>