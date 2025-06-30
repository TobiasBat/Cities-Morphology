<script lang="ts" setup>
import { onMounted, reactive, ref, watch } from 'vue';
import ThreeDimensionalCityComponent from '@/components/simViews/ThreeDimensionalCity.vue';
import {
    ellipticalGridFromCityParameters,
    getNodeWeights,
    type CityGrid,
    type CityParameters
} from 'city-grid';
import SliderComponent from '@/components/uiElements/Slider.vue';
import { IntroductionViews } from '@/scripts/introductionViews';
import {
    computeEdgeSimulationState,
    getPathSimulationAnimation,
    pathSimulation,
    randomPathSimulation,
    type PathSimulationMetrics,
    type PathSimulationVariationResult
} from 'city-grid';
import {
    computePathSimulationVariationsWorker,
} from 'city-grid-webworker'

import populationIcon from '@/assets/images/variableIcons/population.png'
import sprawlIcon from '@/assets/images/variableIcons/spall.png'
import personPerBuildingIcon from '@/assets/images/variableIcons/personPerBuilding.png'
import elongationIcon from '@/assets/images/variableIcons/elongation.png'
import heightDistIcon from '@/assets/images/variableIcons/heightDist.png'
import floorsIcon from '@/assets/images/variableIcons/floors.png'
import { CITY_PRESETS } from '@/scripts/cityPresets';


const threeView = ref()

const props = defineProps<{
    view: IntroductionViews,
}>()

const emit = defineEmits<{
    (e: 'change', cityParameters: CityParameters, pathSimulationMetrics: PathSimulationMetrics): void
    (e: 'variations', results: PathSimulationVariationResult[], valueAltered: keyof CityParameters): void
    (e: 'secondaryResults', results: PathSimulationVariationResult[], valueAltered: keyof CityParameters): void
    (e: 'input', cityParameters: CityParameters): void
}>()

const startingCityParameters = CITY_PRESETS.SMALL_DENSE.parameters

const state = reactive({
    residents: startingCityParameters.residents,
    personsPerBuilding: startingCityParameters.personsPerBuilding,
    floors: startingCityParameters.floors,
    unusedAreaOfProperty: startingCityParameters.sprawl,
    areaPerResident: startingCityParameters.areaPerResident,
    e: startingCityParameters.elongation,
    heightDistributions: startingCityParameters.heightParameter,
    playSimulation: false,
    walkingTimePerDistance: 0.01,
    simulationLastPathEnd: 3.0,
    renderLabels: false
})

let cityGrid: CityGrid | null = null

const DEBUG = __DEBUG_INFO__
const HIGHT_RES_SHADOWS = __HIGH_RES_SHADOWS__

/**
 * Resets city to initial parameters. 
 * Recreates simulation
 */
function resetCityToDefault() {
    state.residents = startingCityParameters.residents
    state.personsPerBuilding = startingCityParameters.personsPerBuilding
    state.floors = startingCityParameters.floors
    state.unusedAreaOfProperty = startingCityParameters.sprawl
    state.areaPerResident = startingCityParameters.areaPerResident
    state.e = startingCityParameters.elongation
    state.heightDistributions = startingCityParameters.heightParameter
    handleChange()
}

/**
 * To change the labels for agents and start / end points
 * @param show 
 */
function updateLabels(show: boolean) {
    if (show) {
        state.renderLabels = true
        threeView.value.removeLabels()
        threeView.value.addStartEndPointLabels()
        threeView.value.addAgentLabels()

    } else {
        state.renderLabels = false
        threeView.value.removeLabels()
    }
}

/**
 * emits @input
 */
function handleInput() {
    removeSimulation()
    updateCity()
}

/**
 * emits @change
 */
function handleChange() {
    removeSimulation()
    updateCity()
    threeView.value.fitCityToViewport(true)
    addSimulation()
}

/**
 * emits @variations
 */
function computeVariations(valueToBeAltered: keyof CityParameters, domain: [number, number], steps: number) {
    if (!cityGrid || !cityGrid.cityParameters) return

    emit('variations', [], valueToBeAltered)

    const delta = domain[1] - domain[0]
    const stepSize = delta / (steps - 1)

    const values = []
    for (let i = 0; i < steps; i++) {
        values.push(i * stepSize + domain[0])
    }

    computePathSimulationVariationsWorker(
        cityGrid.cityParameters,
        valueToBeAltered,
        values,
        {
            value: 1.0,
            type: 'share'
        },
        true
    )
        .then((results) => {
            emit('variations', results, valueToBeAltered)
        })
}

/**
 * emits secondaryResults
 * @param valueToBeAltered 
 * @param values 
 */
function computeSecondaryResults(valueToBeAltered: keyof CityParameters, values: number[]) {
    if (!cityGrid || !cityGrid.cityParameters) return
    emit('secondaryResults', [], valueToBeAltered)

    computePathSimulationVariationsWorker(
        cityGrid.cityParameters,
        valueToBeAltered,
        values,
        {
            value: 1.0,
            type: 'share'
        }
    )
        .then((results) => {
            emit('secondaryResults', results, valueToBeAltered)
        })

}

/**
 * Computes & Updates geometry of city
 */
function updateCity() {
    cityGrid = ellipticalGridFromCityParameters(
        state.residents,
        state.personsPerBuilding,
        state.floors,
        // state.streetWidth,
        +state.unusedAreaOfProperty,
        state.areaPerResident,
        state.e,
        state.heightDistributions
    )
    // randomizeNodePosition(cityGrid, 0.2)
    threeView.value.setCityGrid(cityGrid)
}

function removeSimulation() {
    if (!threeView) return
    threeView.value.setAnimatedPathSimulation([])
}

/**
 * Updates city to demo simulation
 */
function addSimplifiedSimulation() {
    if (!cityGrid || !cityGrid.cityParameters || !threeView) return
    const pathSim = pathSimulation(
        cityGrid.streetGraph, [
        ['1', '78'],
        ['55', '28']
    ]
    )

    computeEdgeSimulationState(cityGrid.streetGraph, pathSim.paths)

    state.walkingTimePerDistance = 0.1
    state.simulationLastPathEnd = 10
    state.playSimulation = true

    const animatedPathSim = getPathSimulationAnimation(cityGrid.streetGraph, pathSim.paths, state.simulationLastPathEnd, state.walkingTimePerDistance)
    threeView.value.setAnimatedPathSimulation(animatedPathSim)
}

/**
 * updates simulations of city 
 * emits @change when done
 * @param options 
 */
function addSimulation(options?: { numAgents?: number }) {
    if (!cityGrid || !cityGrid.cityParameters || !threeView) return
    let numAgents = cityGrid.cityParameters.residents
    if (options && options.numAgents) {
        numAgents = options.numAgents
    }
    const pathSim = randomPathSimulation(
        cityGrid.streetGraph,
        numAgents,
        getNodeWeights(cityGrid)
    )

    computeEdgeSimulationState(cityGrid.streetGraph, pathSim.paths)

    state.walkingTimePerDistance = 0.03
    state.simulationLastPathEnd = 10
    state.playSimulation = true

    const animatedPathSim = getPathSimulationAnimation(cityGrid.streetGraph, pathSim.paths, state.simulationLastPathEnd, state.walkingTimePerDistance)

    threeView.value.setAnimatedPathSimulation(animatedPathSim)
    emit('change', cityGrid.cityParameters, pathSim.metrics)
}

/**
 * Updates perspective and type of simulation based on view
 * @param view 
 * @param transition if the perspective change is animated 
 */
function updateVisualization(view: IntroductionViews, transition: boolean) {
    const subdivisionSteps = 10
    switch (view) {
        case IntroductionViews.TITLE:
            threeView.value.fitCityToViewport(transition)
            threeView.value.setPolarAngle(Math.PI * 0.2, transition)
            threeView.value.zoomTo(100, transition)
            removeSimulation()
            addSimulation({ numAgents: 30 })
            threeView.value.setHeatMapLineWidth(0.9)
            updateLabels(false)
            break
        case IntroductionViews.AGENTS_EXPLAIN:
            resetCityToDefault()
            threeView.value.setPolarAngle(Math.PI * 0.1, transition)
            threeView.value.fitCityToViewport(transition)
            threeView.value.setHeatMapLineWidth(1.2)
            addSimplifiedSimulation()
            updateLabels(true)
            break
        case IntroductionViews.INITIAL_SIM:
            resetCityToDefault()
            addSimulation()
            threeView.value.setPolarAngle(Math.PI * 0.0, transition)
            updateLabels(false)
            break
        case IntroductionViews.SIZE:
            computeVariations('residents', [100, 1500], subdivisionSteps)
            computeSecondaryResults('residents', [450, 450 * 2])
            threeView.value.setPolarAngle(Math.PI * 0.2, transition)
            updateLabels(false)
            break
        case IntroductionViews.SPRAWL:
            computeVariations('sprawl', [5, 50], subdivisionSteps)
            updateLabels(false)
            break
        case IntroductionViews.ELONGATION:
            computeVariations('elongation', [1, 3], subdivisionSteps)
            threeView.value.setPolarAngle(Math.PI * 0.2, transition)
            updateLabels(false)
            break
        case IntroductionViews.BUILDING_SIZE:
            computeVariations('personsPerBuilding', [1, 20], subdivisionSteps)
            threeView.value.setPolarAngle(Math.PI / 4, transition)
            computeVariations('floors', [1, 10], subdivisionSteps)
            updateLabels(false)
            break
        case IntroductionViews.PYRAMID:
            threeView.value.setPolarAngle(Math.PI / 2.5, transition)
            computeVariations('heightParameter', [-10, 10], subdivisionSteps)
            updateLabels(false)
            break
    }
}

onMounted(() => {
    updateCity()
    threeView.value.fitCityToViewport(false)
    updateVisualization(props.view, false)
})

watch(() => [props.view], () => {
    updateVisualization(props.view, true)
})

</script>
<template>
    <div id="wrapper">
        <ThreeDimensionalCityComponent :play-simulation="state.playSimulation" ref="threeView"
            :walking_time_per_distance="state.walkingTimePerDistance"
            :simulation_last_path_end="state.simulationLastPathEnd" :loop="true"
            :legend="(props.view !== IntroductionViews.TITLE && props.view !== IntroductionViews.OTHER)"
            :roofColor="[190 / 255, 190 / 255, 190 / 255]" :updateLabelsPosition="state.renderLabels"
            :show-time-line="false" :debug="DEBUG" :dolly="false" :pretty-shadows="HIGHT_RES_SHADOWS" />
        <div id="sliderContainer">
            <SliderComponent label="Population" v-model:value="state.residents" :min="100" :max="1500" :step="10"
                :motivator="true" v-if="props.view === IntroductionViews.SIZE" class="sliderComponent"
                :icon="populationIcon" @input="handleInput" @change="handleChange" />
            <SliderComponent :label="'Sprawl'" v-model:value="state.unusedAreaOfProperty" :min="5" :max="50" :step="1"
                :icon="sprawlIcon" v-if="props.view === IntroductionViews.SPRAWL" class="sliderComponent"
                @input="handleInput" @change="handleChange" />
            <SliderComponent :label="'Elongation'" v-model:value="state.e" :min="1" :max="3" :step="0.05"
                :icon="elongationIcon" v-if="props.view === IntroductionViews.ELONGATION" class="sliderComponent"
                @input="handleInput" @change="handleChange" />

            <SliderComponent :label="'Persons per building'" v-model:value="state.personsPerBuilding" :min="1" :max="30"
                :step="1" v-if="props.view === IntroductionViews.BUILDING_SIZE" class="sliderComponent"
                :icon="personPerBuildingIcon" @input="handleInput"
                @change="handleChange(); computeVariations('floors', [1, 10], 10)" />
            <SliderComponent :label="'Avg. floors'" v-model:value="state.floors" :min="1" :max="10" :step="1"
                v-if="props.view === IntroductionViews.BUILDING_SIZE" class="sliderComponent" :icon="floorsIcon"
                @input="handleInput" @change="handleChange(); computeVariations('personsPerBuilding', [1, 30], 10)" />

            <SliderComponent :label="'Profile'" v-model:value="state.heightDistributions" :min="-10"
                v-if="props.view === IntroductionViews.PYRAMID" :step="0.1" :max="10" :icon="heightDistIcon"
                class="sliderComponent" @input="handleInput" @change="handleChange" />
        </div>
    </div>
</template>
<style scoped>
#wrapper {
    width: 100%;
    height: 100%;
    position: relative;
}

#sliderContainer {
    position: relative;
    bottom: 50px;
    transform: translate(0, -100%);
    width: calc(100% - 64px);
    padding-left: 32px;
    padding-right: 32px;
    display: flex;
    flex-direction: column;
    gap: 6px;
}


.sliderComponent {
    position: relative !important;
    width: 100%;
    opacity: 1;
}

/* .sliderComponent.hidden {
    animation-name: sliderHideAnimation;
    animation-duration: 0.6s;
    animation-fill-mode: forwards;
    display: none !important;
}

.sliderComponent.show {
    animation-name: sliderShowAnimation;
    animation-duration: 0.6s;
    animation-fill-mode: forwards;
    animation-delay: 0.8s;
    opacity: 0;
    display: inherit !important;
}

@keyframes sliderHideAnimation {
    0% {
        opacity: 1.0;
        bottom: 0;
    }

    100% {
        opacity: 0;
        bottom: 12px;
    }
}

@keyframes sliderShowAnimation {
    0% {
        opacity: 0.0;
        bottom: -12px;
    }

    100% {
        opacity: 1.0;
        bottom: 0px;
    }
} */

@media screen and (max-width: 600px) {
    #sliderContainer {
        padding-left: 12px;
        padding-right: 12px;
        bottom: 12px;
        width: 100%;
        gap: 3px;
    }
}
</style>