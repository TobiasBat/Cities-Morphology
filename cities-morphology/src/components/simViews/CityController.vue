<script setup lang="ts">
import DoubleSlider from '@/components/uiElements/DoubleSlider.vue'
import IconButton from '@/components/uiElements/IconButton.vue'
import { reactive } from 'vue';
import IconToggle from '@/components/uiElements/IconToggle.vue';
import playIcon from '@/assets/images/playIcon.png'
import pauseIcon from '@/assets/images/pauseIcon.png'

import populationIcon from '@/assets/images/variableIcons/population.png'
import sprawlIcon from '@/assets/images/variableIcons/spall.png'
import personPerBuildingIcon from '@/assets/images/variableIcons/personPerBuilding.png'
import elongationIcon from '@/assets/images/variableIcons/elongation.png'
import heightDistIcon from '@/assets/images/variableIcons/heightDist.png'
import floorsIcon from '@/assets/images/variableIcons/floors.png'

import agentSolidIcon from '@/assets/images/agent-solid.svg'
import agentTransparentIcon from '@/assets/images/agent-transparent.svg'
import buildingSolidIcon from '@/assets/images/building-solid.svg'
import buildingTransparentIcon from '@/assets/images/building-transparent.svg'

const eA = defineModel('eA')
const eB = defineModel('eB')
const residentsA = defineModel('residentsA')
const residentsB = defineModel('residentsB')
const streetWidthA = defineModel('streetWidthA')
const streetWidthB = defineModel('streetWidthB')
const unusedAreaOfPropertyA = defineModel('unusedAreaOfPropertyA')
const unusedAreaOfPropertyB = defineModel('unusedAreaOfPropertyB')
const residentsPerBuildingA = defineModel('residentsPerBuildingA')
const residentsPerBuildingB = defineModel('residentsPerBuildingB')
const areaPerResidentA = defineModel('areaPerResidentA')
const areaPerResidentB = defineModel('areaPerResidentB')
const floorsA = defineModel('floorsA')
const floorsB = defineModel('floorsB')
const play = defineModel('play')
const transparentBuildings = defineModel('transparentBuildings')
const transparentAgents = defineModel('transparentAgents')
const renderStyle = defineModel<number | unknown>('renderStyle')
const heightDistributionA = defineModel('heightDistributionA')
const heightDistributionB = defineModel('heightDistributionB')
const heatMapPropertyIndex = defineModel<number | unknown>('heatMapPropertyIndex')

const props = defineProps({
    advanced: {
        type: Boolean,
        default: false
    },
    showTwo: {
        type: Boolean,
        default: true
    }
})

const state = reactive({
    open: false,
    mobile: false,
})

const emit = defineEmits<{
    (e: 'change'): void,
    (e: 'input'): void,
    (e: 'addCompare'): void
}>()

function checkMobile() {
    state.mobile = window.innerWidth <= 600
}

window.addEventListener('resize', checkMobile);
checkMobile()
</script>

<template>
    <div :class="`controller ${(state.mobile && !state.open) ? 'closed' : ''}`">
        <div :class="`sliderController ${(state.mobile && !state.open) ? 'closed' : ''}`">
            <DoubleSlider label="Elongation" :show-two="props.showTwo" :min="1" :max="3" v-model:value-A="eA"
                v-model:value-B="eB" :icon="elongationIcon" @change="emit('change')" @input="emit('input')"
                ref="elongation" />

            <DoubleSlider label="Population" :show-two="props.showTwo" v-model:value-A="residentsA"
                v-model:value-B="residentsB" :step="1" :min="100" :max="3000" :icon="populationIcon"
                @change="emit('change')" @input="emit('input')" ref="residents" />

            <DoubleSlider label="Persons per building" :show-two="props.showTwo" v-model:value-A="residentsPerBuildingA"
                v-model:value-B="residentsPerBuildingB" :min="1" :max="30" :icon="personPerBuildingIcon"
                @change="emit('change')" @input="emit('input')" ref="personsPerBuilding" />

            <DoubleSlider v-if="props.advanced" label="Area per resident" :show-two="props.showTwo"
                v-model:value-A="areaPerResidentA" v-model:value-B="areaPerResidentB" :min="10" :max="100"
                @change="emit('change')" @input="emit('input')" />

            <DoubleSlider v-if="props.advanced" :show-two="props.showTwo" label="Street Width"
                v-model:value-A="streetWidthA" v-model:value-B="streetWidthB" :min="6" :max="26"
                @change="emit('change')" @input="emit('input')" />

            <DoubleSlider label="Sprawl" :show-two="props.showTwo" v-model:value-A="unusedAreaOfPropertyA"
                v-model:value-B="unusedAreaOfPropertyB" :min="5" :max="50" :icon="sprawlIcon" @change="emit('change')"
                @input="emit('input')" ref="sprawl" />

            <DoubleSlider label="Avg. floors" :show-two="props.showTwo" v-model:value-A="floorsA"
                v-model:value-B="floorsB" :min="1" :max="10" :step="1" :icon="floorsIcon" @change="emit('change')"
                @input="emit('input')" ref="buildingHeight" />

            <DoubleSlider label="Profile" :show-two="props.showTwo" v-model:value-A="heightDistributionA"
                v-model:value-B="heightDistributionB" :min="-10" :max="10" :icon="heightDistIcon"
                @change="emit('change')" @input="emit('input')" ref="heightDist" />
        </div>
        <div id="startButtonContainer">
            <IconToggle :titles="['3D', '2D']" v-model:option-selected="renderStyle" />
            <IconToggle :titles="['Distance', 'Congestion']" v-model:option-selected="heatMapPropertyIndex" />
            <IconButton :title="play ? '' : ''" @click="() => { play = !play }" :icon="play ? pauseIcon : playIcon"
                :large-icon="true" />
            <IconButton :icon="transparentBuildings ? buildingSolidIcon : buildingTransparentIcon" :large-icon="true"
                @click="transparentBuildings = !transparentBuildings" />
            <IconButton :icon="transparentAgents ? agentSolidIcon : agentTransparentIcon"
                @click="transparentAgents = !transparentAgents" :large-icon="true" />
            <IconButton :title="state.open ? 'Close' : 'Parameters'" id="filterButton"
                @click="state.open = !state.open" />

        </div>
    </div>
</template>

<style scoped>
.controller {
    width: 100%;
    height: auto;
    min-height: 10px;
    background-color: var(--bg-color);
    border-radius: 2px;
    padding: 12px var(--font-size) 24px;
    box-sizing: border-box;
    position: relative;
    color: var(--color-text);
    pointer-events: none;
    filter: var(--element-shadow);
}

.controller.inactive {
    pointer-events: none;
    color: var(--color-text-shade2);
}

.controller.closed {
    background-color: transparent;
}

.sliderController {
    pointer-events: auto;
}

.sliderController.closed {
    display: none;
}

#startButtonContainer {
    width: calc(100% - 36px);
    display: flex;
    justify-content: center;
    position: absolute;
    bottom: -20px;
    gap: 6px;
    height: 40px;
}

#filterButton {
    display: none;
    min-width: none;
    padding-left: 12px;
    padding-right: 12px;

}

@media screen and (max-width: 600px) {
    .sliderController {
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 24px;
    }

    #startButtonContainer {
        bottom: 3px;
        width: 100%;
        max-width: 100%;
        justify-content: flex-end;
        padding: 0;
        padding-bottom: 12px;
        padding-left: 6px;
        padding-right: 6px;
        margin: 0;
        left: 0;
        flex-wrap: wrap-reverse;
        gap: 3px;
        height: auto;
        flex-direction: row-reverse;
    }

    #filterButton {
        display: inline;
    }

    .controller {
        margin-left: 0;
        width: 100%;
        left: 0;
        box-sizing: border-box;
        height: 85svh;
    }
}
</style>