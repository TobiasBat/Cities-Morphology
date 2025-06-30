<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import ThreeDimensionalCityComponent from '@/components/simViews/ThreeDimensionalCity.vue'
import CityControllerComponent from '@/components/simViews/CityController.vue';
import {
    computeEdgeSimulationState,
    ellipticalGridFromCityParameters,
    getPathSimulationAnimation,
    randomPathSimulation,
    type CityInputParameters,
    type PathSimulation,
    type PathSimulationMetrics
} from 'city-grid';
import {
    getNodeWeights,
    type CityGrid,
    type CityParameters,
    type CityStats
} from 'city-grid';
import PathSimulationStatsComponent from '@/components/charts/PathSimulationStats.vue';
import IconDropdownComponent from '@/components/uiElements/IconDropdown.vue';
import { CITY_PRESETS, getCityPresets } from '@/scripts/cityPresets';
import NameLabelComponent from '@/components/simViews/NameLabel.vue';
import IconButtonComponent from '@/components/uiElements/IconButton.vue';

const leftStartParameters = CITY_PRESETS.PYRAMID.parameters
const rightStartParameters = CITY_PRESETS.BOWL.parameters

const state = reactive({
    residents:
        [leftStartParameters.residents, rightStartParameters.residents],
    streetWidth:
        [5, 5],
    sprawl:
        [leftStartParameters.sprawl, rightStartParameters.sprawl],
    residentsPerBuilding:
        [leftStartParameters.personsPerBuilding, rightStartParameters.personsPerBuilding],
    areaPerResident:
        [leftStartParameters.areaPerResident, rightStartParameters.areaPerResident],
    floors:
        [leftStartParameters.floors, rightStartParameters.floors],
    heightDistribution:
        [leftStartParameters.heightParameter, rightStartParameters.heightParameter],
    e: [leftStartParameters.elongation, rightStartParameters.elongation],
    a: [9, 9],
    randomizeNodePosition: [0.0, 0.0],
    playSimulation: true,
    simulationIsRunning: [false, false],
    pathSimulations:
        [null, null] as [PathSimulation | null, PathSimulation | null],
    cityGrids:
        [null, null] as [CityGrid | null, CityGrid | null],
    pathGradientRange:
        [0, 250] as [number, number],
    prevCityGridParameters:
        [[], []] as [CityParameters[], CityParameters[]],
    prevPathSimulations:
        [[], []] as [PathSimulation[], PathSimulation[]],
    prevCityStats:
        [[], []] as [CityStats[], CityStats[]],
    renderStyle: 0, // 0 means 3D 1 means 2D 
    displayedMetric:
        'totalDistance' as keyof PathSimulationMetrics,
    cityPreset:
        ['PYRAMID', 'BOWL'], // City presets of the simulation 
    showTwo: false,
    heatMapPropertyIndex: 0,
    heatMapProperty: 'averageDist' as ('averageDist' | 'numberPaths' | 'none'),
    transparentBuildings: false,
    transparentAgents: false
})

let layoutPresets = getCityPresets()

const colorA: [number, number, number] = [177 / 255, 192 / 255, 36 / 255]
const colorB: [number, number, number] = [83 / 255, 126 / 255, 93 / 255]

const leftSim = ref()
const rightSim = ref()
const cityController = ref()

const WALKING_TIME_PER_DISTANCE = 0.01
const SIMULATION_LAST_PATH_END = 10

const DEBUG = __DEBUG_INFO__
const HIGHT_RES_SHADOWS = __HIGH_RES_SHADOWS__
/**
 * Resets the time of booth sims 
 */
function restingTimeOfSimulations() {
    if (!rightSim.value || !leftSim.value) return
    leftSim.value.resetTime()
    rightSim.value.resetTime()
}

/**
 * Append current city parameters to the history of city parameters
 */
function addToPreviousParameters() {
    if (state.cityGrids[0] && state.cityGrids[0].cityParameters) {
        state.prevCityGridParameters[0].unshift(state.cityGrids[0].cityParameters)
    }
    if (state.cityGrids[1] && state.cityGrids[1].cityParameters) {
        state.prevCityGridParameters[1].unshift(state.cityGrids[1].cityParameters)
    }
    if (state.pathSimulations[0]) state.prevPathSimulations[0].unshift(state.pathSimulations[0])
    if (state.pathSimulations[1]) state.prevPathSimulations[1].unshift(state.pathSimulations[1])

    if (state.prevCityStats[0] && state.cityGrids[0]) state.prevCityStats[0].unshift(state.cityGrids[0].stats)
    if (state.prevCityStats[1] && state.cityGrids[1]) state.prevCityStats[1].unshift(state.cityGrids[1].stats)
}

/**
 *  Updates only the Cites geometry
*/
function updateCities(): [CityGrid, CityGrid] {
    // Create layouts 
    const leftCity = ellipticalGridFromCityParameters(
        +state.residents[0],
        +state.residentsPerBuilding[0],
        +state.floors[0],
        +state.sprawl[0],
        +state.areaPerResident[0],
        +state.e[0],
        +state.heightDistribution[0]
    )

    const rightCity = ellipticalGridFromCityParameters(
        +state.residents[1],
        +state.residentsPerBuilding[1],
        +state.floors[1],
        +state.sprawl[1],
        +state.areaPerResident[1],
        +state.e[1],
        +state.heightDistribution[1]
    )

    // Set CityGrid
    if (leftSim.value) {
        leftSim.value.setCityGrid(leftCity)
        // leftSim.value.fitCityToViewport()
    }
    if (rightSim.value) {
        rightSim.value.setCityGrid(rightCity)
        // rightSim.value.fitCityToViewport()
    }

    return [leftCity, rightCity]
}

/**
 * Updates simulation for cities 
*/
function updateSimulations(leftCity: CityGrid, rightCity: CityGrid) {
    // Create Simulations 
    if (!leftCity.cityParameters || !rightCity.cityParameters) return
    const leftPathSim = randomPathSimulation(leftCity.streetGraph, leftCity.cityParameters.residents * 2, getNodeWeights(leftCity))
    computeEdgeSimulationState(leftCity.streetGraph, leftPathSim.paths)
    const leftAnimatedPathSim = getPathSimulationAnimation(leftCity.streetGraph, leftPathSim.paths, SIMULATION_LAST_PATH_END, WALKING_TIME_PER_DISTANCE)

    const rightPathSim = randomPathSimulation(rightCity.streetGraph, rightCity.cityParameters.residents * 2, getNodeWeights(rightCity))
    computeEdgeSimulationState(rightCity.streetGraph, rightPathSim.paths)
    const rightAnimatedPathSim = getPathSimulationAnimation(rightCity.streetGraph, rightPathSim.paths, SIMULATION_LAST_PATH_END, WALKING_TIME_PER_DISTANCE)

    // Set Sim
    if (leftSim.value) leftSim.value.setAnimatedPathSimulation(leftAnimatedPathSim)
    if (rightSim.value) rightSim.value.setAnimatedPathSimulation(rightAnimatedPathSim)

    state.pathSimulations[0] = leftPathSim
    state.pathSimulations[1] = rightPathSim
    state.cityGrids[0] = leftCity
    state.cityGrids[1] = rightCity
}

/**
 * Removes booth simulations
 */
function removeSimulations() {
    if (leftSim.value) leftSim.value.setAnimatedPathSimulation([])
    if (rightSim.value) rightSim.value.setAnimatedPathSimulation([])
}

/**
 * Sets city parameters to state.
 * Updates the city simulation and geometry accordingly
 * @param index left == 0 and right == 1
 * @param parameters 
 */
function setCityParameters(index: number, parameters: CityInputParameters) {
    if (index !== 0 && index !== 1) return
    state.e[index] = parameters.elongation
    state.residents[index] = parameters.residents
    state.residentsPerBuilding[index] = parameters.personsPerBuilding
    state.areaPerResident[index] = parameters.areaPerResident
    state.floors[index] = parameters.floors
    // state.streetWidth[index] = parameters.streetWidth
    state.sprawl[index] = parameters.sprawl
    state.heightDistribution[index] = parameters.heightParameter

    handleChange()
}

/**
 * Handles the input call from CityControllerComponent
 * Just updating the city Geometry
 * removes old simulations
 */
function handleInput() {
    removeSimulations()
    updateCities()
    state.cityPreset[0] = 'CUSTOM'
    state.cityPreset[1] = 'CUSTOM'
}

/**
 * Handles the change call from CityControllerComponent
 * Updates the cities geometry and the corresponding simulations 
 */
function handleChange() {
    addToPreviousParameters()
    removeSimulations()
    const cities = updateCities()
    updateSimulations(cities[0], cities[1])

}

/**
 * Formats a color vector (range 0 - 1) as rgb() string. e.g. rgb(255, 100, 40)
 * @param color 
 */
function formatToCssRGB(color: [number, number, number]): string {
    return `rgb(${color[0] * 255}, ${color[1] * 255}, ${color[2] * 255})`
}

function updateViewMode() {
    switch (state.renderStyle) {
        case 0:
            if (leftSim.value) leftSim.value.perspectiveView()
            if (rightSim.value) rightSim.value.perspectiveView()
            break
        case 1:
            if (leftSim.value) leftSim.value.topView()
            if (rightSim.value) rightSim.value.topView()
            break
    }
}

function updateHeatmapProperty() {
    switch (state.heatMapPropertyIndex) {
        case 0:
            state.heatMapProperty = 'averageDist'
            break
        case 1:
            state.heatMapProperty = 'numberPaths'
            break
    }
}

onMounted(() => {
    const cities = updateCities()
    updateSimulations(cities[0], cities[1])

    if (leftSim.value) {
        leftSim.value.fitCityToViewport()
    }
    if (rightSim.value) {
        rightSim.value.fitCityToViewport()
    }
})

watch(() => [state.renderStyle], updateViewMode)
watch(() => [state.heatMapPropertyIndex], updateHeatmapProperty)
watch(() => state.cityPreset[0], () => {
    if (!state.cityPreset[0] || !(state.cityPreset[0] in CITY_PRESETS)) return

    if (state.cityPreset[0] in CITY_PRESETS)
        setCityParameters(0, CITY_PRESETS[state.cityPreset[0]].parameters)

    if (leftSim.value) leftSim.value.fitCityToViewport(true)
})

watch(() => state.cityPreset[1], () => {
    if (!state.cityPreset[1] || !(state.cityPreset[1] in CITY_PRESETS)) return
    setCityParameters(1, CITY_PRESETS[state.cityPreset[1]].parameters)
    if (rightSim.value) rightSim.value.fitCityToViewport(true)
})

watch(rightSim, () => {
    if (rightSim.value) {
        handleChange()
        rightSim.value.fitCityToViewport(false)
        leftSim.value.fitCityToViewport(false)
        updateViewMode()
    }
})

</script>

<template>
    <div id="wrapper">
        <div id="simulations">
            <div id="leftSimulation">
                <div class="simulation">
                    <ThreeDimensionalCityComponent :play-simulation="state.playSimulation"
                        :pretty-shadows="HIGHT_RES_SHADOWS" :transparent-buildings="state.transparentBuildings"
                        :transparent-agents="state.transparentAgents" :loop="true" name="A"
                        :relative-truck-offset="[0, 0.05]" :relative-truck-offset-mobile="[0, 0]"
                        @doneComputing="(cityGrid: CityGrid, pathSimulation: PathSimulation) => { state.cityGrids[0] = cityGrid; state.pathSimulations[0] = pathSimulation; restingTimeOfSimulations() }"
                        :legend="!state.showTwo" ref="leftSim" :debug="DEBUG" :show-time-line="false"
                        :heatMapProperty="state.heatMapProperty" />
                </div>
                <div class="nameLabel">
                    <IconDropdownComponent :options="layoutPresets" :down="true"
                        v-model:option-selected="state.cityPreset[0]" :default-label="'custom'" />
                    <NameLabelComponent name="A" :e="+state.e[0]" :city-size="state.residents[0]"
                        :color="formatToCssRGB(colorA)" />
                </div>
                <div class="rightSideButtons">
                    <IconButtonComponent @click="state.showTwo = true" :title="'compare +'" v-if="!state.showTwo" />
                </div>
            </div>
            <div id="rightSimulation" v-if="state.showTwo">
                <div class="simulation">
                    <ThreeDimensionalCityComponent :play-simulation="state.playSimulation"
                        :transparent-buildings="state.transparentBuildings"
                        :transparent-agents="state.transparentAgents" :loop="true" name="B"
                        :relative-truck-offset="[0, 0.05]" :legend="true"
                        @doneComputing="(cityGrid: CityGrid, pathSimulation: PathSimulation) => { state.cityGrids[1] = cityGrid; state.pathSimulations[1] = pathSimulation; restingTimeOfSimulations() }"
                        ref="rightSim" :debug="DEBUG" :show-time-line="false"
                        :heatMapProperty="state.heatMapProperty" />
                </div>
                <div class="nameLabel">
                    <NameLabelComponent name="B" :e="+state.e[1]" :city-size="state.residents[1]"
                        :color="formatToCssRGB(colorB)" />
                    <IconDropdownComponent :options="layoutPresets" :down="true"
                        v-model:option-selected="state.cityPreset[1]" :default-label="'custom'" />
                    <IconButtonComponent @click="state.showTwo = false" :title="'×'" />
                </div>
            </div>
        </div>
        <div id="cityControllerWrapper">
            <div id="stats">
                <PathSimulationStatsComponent v-if="state.cityGrids && state.cityGrids[0] && state.cityGrids[1]"
                    :path-simulations="state.pathSimulations"
                    :city-stats="[state.cityGrids[0].stats, state.cityGrids[1].stats]"
                    :city-parameters="[state.cityGrids[0].cityParameters, state.cityGrids[1]?.cityParameters]"
                    :colors="[formatToCssRGB(colorA), formatToCssRGB(colorB)]"
                    :prev-city-grid-parameters="state.prevCityGridParameters"
                    :prev-path-simulations="state.prevPathSimulations" :prev-city-stats="state.prevCityStats"
                    :show-two="state.showTwo"
                    @clicked-parameters="(index: number, parameters: CityParameters) => { setCityParameters(index, parameters) }" />
            </div>
            <div id="cityController">
                <CityControllerComponent :show-two="state.showTwo" v-model:e-a="state.e[0]" v-model:e-b="state.e[1]"
                    v-model:residentsA="state.residents[0]" v-model:residentsB="state.residents[1]"
                    v-model:aA="state.a[0]" v-model:residents-per-building-a="state.residentsPerBuilding[0]"
                    v-model:residents-per-building-b="state.residentsPerBuilding[1]" v-model:aB="state.a[1]"
                    v-model:streetWidthA="state.streetWidth[0]" v-model:streetWidthB="state.streetWidth[1]"
                    v-model:unusedAreaOfPropertyA="state.sprawl[0]" v-model:unusedAreaOfPropertyB="state.sprawl[1]"
                    v-model:area-per-resident-a="state.areaPerResident[0]"
                    v-model:area-per-resident-b="state.areaPerResident[1]" v-model:floors-a="state.floors[0]"
                    v-model:floors-b="state.floors[1]" v-model:play="state.playSimulation"
                    v-model:transparent-buildings="state.transparentBuildings"
                    v-model:transparent-agents="state.transparentAgents"
                    v-model:height-distribution-a="state.heightDistribution[0]"
                    v-model:height-distribution-b="state.heightDistribution[1]" v-model:render-style="state.renderStyle"
                    v-model:heat-map-property-index="state.heatMapPropertyIndex" @add-compare="addToPreviousParameters"
                    @input="handleInput" @change="handleChange" ref="cityController" />
            </div>
        </div>
    </div>
</template>

<style scoped>
#wrapper {
    height: 100svh;
    width: 100vw;
    position: fixed;
    overflow-y: hidden;
}

#navComp {
    position: fixed;
    top: 0px;
    left: 0px;
    z-index: 100;
    position: absolute;
}

#simulations {
    width: calc(100% - var(--nav-width));

    height: 100svh;
    display: flex;
    gap: 3px;
    overflow: hidden;
    position: absolute;
    top: 0;
}

#leftSimulation,
#rightSimulation {
    width: 100%;
    height: 100%;
    background: var(--bg-color2);
    position: relative;
    /**TODO REMOVE! */
    /** background-color: rgb(255, 255, 255); */
}

#leftSimulation {
    border-top-left-radius: 6px;
    border-bottom-left-radius: 6px;
}

.nameLabel {
    display: flex;
    justify-content: center;
    position: absolute;
    top: 12px;
    width: 100%;
    /* display: none; */
    z-index: 3;
}

#rightSimulation .nameLabel {
    justify-content: end;
    width: calc(100% - 12px);
    pointer-events: none;
}

#leftSimulation .nameLabel {
    justify-content: start;
    width: calc(100% - 12px);
    left: 12px;
    pointer-events: none;
}

.rightSideButtons {
    width: calc(100% - 24px);
    display: flex;
    justify-content: end;
    margin-top: 12px;
    margin-left: 12px;
    pointer-events: none;
    z-index: 2;
    position: relative;
}

.simulation {
    height: 100%;
    width: 100%;
    top: 0;
    position: absolute;
    z-index: 1;

}

#cityControllerWrapper {
    display: flex;
    flex-direction: column;
    height: calc(100svh - 26px);
    width: calc(100% - var(--nav-width) - 4px);
    left: 0px;
    position: absolute;
    justify-content: flex-end;
    align-items: center;
    gap: 0px;
    pointer-events: none;
    padding-left: 0;
}

#stats {
    height: 150px;
    width: calc(100vw - var(--nav-width));
    width: 400px;
    position: relative;
    position: absolute;
    top: 12px;
    z-index: 4;
}

#cityController {
    width: 60vw;
    height: auto;
    pointer-events: auto;
    max-width: 1000px;
    z-index: 4;
}

.backgroundContainer {
    z-index: 0;
}

#results {
    position: fixed;
    width: calc(100vw - 48px);
    height: calc(100svh - 48px);
    left: 24px;
    top: 24px;
    background-color: var(--bg-color);
    filter: var(--element-shadow);
    border-radius: 2px;
    overflow-y: hidden;
}

@media screen and (max-width: 1000px) {
    #cityController {
        width: calc(100% - 48px);
    }
}

@media screen and (max-width: 600px) {
    #simulations {
        flex-direction: column;
        height: 85svh;
        margin-top: 15svh;
    }

    #leftSimulation,
    #rightSimulation {
        height: 100%;
    }

    #stats {
        height: calc(15svh - 1.5px);
        border-radius: 1.5px;
        width: 100%;
        position: relative;
        position: absolute;
        top: 0px;
        z-index: 4;
        background-color: var(--bg-color2);
        border-top-left-radius: 6px;
        border-bottom-left-radius: 6px;
    }

    #cityControllerWrapper {
        height: 100svh;
        bottom: 0px;
        filter: none;
    }

    #cityController {
        width: 100%;
        pointer-events: none;
        display: block;
        padding-bottom: 0px;
        box-sizing: content-box;
    }

    #simulations {
        gap: 1.5px;

    }

    #rightSimulation .nameLabel {
        width: calc(100% - 6px);
        left: 3px;
        justify-content: flex-end;
        flex-direction: row-reverse;
    }

    #leftSimulation .nameLabel {
        width: calc(100% - 6px);
        left: 3px;
    }

    .nameLabel {
        top: 8px;
    }

    .rightSideButtons {
        width: calc(100% - 12px);
        display: flex;
        justify-content: end;
        margin-top: 8px;
        padding-right: 0px;
        margin-left: 6px;
        pointer-events: none;
        z-index: 2;
        position: relative;
    }
}
</style>