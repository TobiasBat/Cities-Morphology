<!-- 
 Vue Container around City Renderer 
 -->
<script setup lang="ts">
import { type CityGrid } from 'city-grid';
import { onMounted, onUnmounted, ref, watch } from 'vue';
import {
    type PathSimulationAnimation
} from 'city-grid'

import LegendRangeComponent from './LegendRange.vue';
import { CityRenderer } from '@/modules/city-renderer';
import { getRangeLinearColor } from '@/modules/city-renderer/utility';

const prop = defineProps({
    playSimulation: {
        type: Boolean,
        default: false
    },
    walking_time_per_distance: {
        type: Number,
        default: 0.02
    },
    debug: {
        type: Boolean,
        default: false
    },
    legend: {
        type: Boolean,
        default: false
    },
    prettyShadows: {
        default: false
    },
    heatMapProperty: {
        default:
            'averageDist' as ('averageDist' | 'numberPaths' | 'none')
    },
    distanceGradientDomain: {
        default: [50, 175, 300] as [number, number, number]
    },
    distanceGradientRange: {
        default:
            ['#C3C9FF', '#FFCE84', '#F7432B'] as [string, string, string]
    },
    conjunctionGradientDomain: {
        default: [0, 50, 100] as [number, number, number]
    },
    conjunctionGradientRange: {
        default:
            ['#F6EFFF', '#DABEFF', '#6A00FF'] as [string, string, string]
    },
    transparentBuildings: {
        default: false
    },
    transparentAgents: {
        default: false
    }
})

const emit = defineEmits(['simulating', 'done'])

const cityCanvasContainer = ref()

let cityRenderer: undefined | CityRenderer

function resetTime() {
    cityRenderer?.resetTime()
}

/**
 * Updating the city mesh
 * @param grid 
 */
function setCityGrid(grid: CityGrid) {
    cityRenderer?.updateCity(grid)
}

function fitCityToViewport(transition: boolean) {
    cityRenderer?.fitCityToViewport(transition)
}

function setCameraPosition(x: number, y: number, z: number) {
    cityRenderer?.controls.setPosition(x, y, z, true)
}

function setPolarAngle(polarAngle: number, transition: boolean) {
    cityRenderer?.controls.rotatePolarTo(polarAngle, transition)
}

function setAzimuthAngle(azimuthAngle: number, transition: boolean) {
    cityRenderer?.controls.rotateAzimuthTo(azimuthAngle, transition)
}

function truck(x: number, y: number, enableTransition: boolean) {
    cityRenderer?.controls.truck(x, y, enableTransition)
}

function zoomTo(zoom: number, transition: boolean) {
    cityRenderer?.controls.dollyTo(zoom, transition)
}

function addAgentLabels() {
    cityRenderer?.addAgentLabels()
}

function addStartEndPointLabels() {
    cityRenderer?.addStartEndPointLabels()
}

function removeLabels() {
    cityRenderer?.removeLabels()
}

function topView() {
    cityRenderer?.topView()
}

function perspectiveView() {
    cityRenderer?.perspectiveView()
}

function getHeatMapProperties() {
    return {
        pathGradientDomain:
            prop.heatMapProperty === 'averageDist' ?
                prop.distanceGradientDomain :
                prop.conjunctionGradientDomain,
        gradientRange:
            prop.heatMapProperty === 'averageDist' ?
                getRangeLinearColor(prop.distanceGradientRange) :
                getRangeLinearColor(prop.conjunctionGradientRange)
    }
}

function getAgentProperties(pathSim?: PathSimulationAnimation) {
    return {
        animatedPathSimulation: pathSim,
        gradientRange: prop.heatMapProperty === 'averageDist' ?
            getRangeLinearColor(prop.distanceGradientRange) :
            getRangeLinearColor(['rgb(220, 220, 220)', 'rgb(220, 220, 220)', 'rgb(220, 220, 220)'])
    }
}

/**
 * Setter function to set a new animated path simulation
 * Updates line and agents geometry accordingly.
 * Resets simulation time
 */
function setAnimatedPathSimulation(pathSim: PathSimulationAnimation) {
    if (!cityRenderer) return
    cityRenderer.addAgents(getAgentProperties(pathSim))
    cityRenderer.addHeatmap(
        prop.heatMapProperty, getHeatMapProperties())
    cityRenderer.simulationTime = 0
}

function setHeatMapLineWidth(lineWidth: number) {
    if (cityRenderer)
        cityRenderer.heatMapMaterial.linewidth = lineWidth
}

function updateRenderProperties() {
    cityRenderer?.setMaterialProperties({
        buildingOpacity:
            prop.transparentBuildings ?
                0.5 : 1,
        agentOpacity:
            prop.transparentAgents ?
                0.1 : 1
    })
}

onMounted(() => {
    cityRenderer = new CityRenderer(cityCanvasContainer.value, { debug: prop.debug, prettyShadows: prop.prettyShadows })
    // cityRenderer.agentsGroup.visible = false
    // cityRenderer.heatMapGroup.visible = false
    updateRenderProperties()
})

onUnmounted(() => {
    cityRenderer?.dispose()
})

defineExpose({
    resetTime,
    setCityGrid,
    setAnimatedPathSimulation,
    fitCityToViewport,
    setCameraPosition,
    setPolarAngle,
    zoomTo,
    setAzimuthAngle,
    addAgentLabels,
    removeLabels,
    addStartEndPointLabels,
    topView,
    perspectiveView,
    setHeatMapLineWidth,
    truck
})

// Toggle Visibility off elements based on play
watch(
    () => [prop.playSimulation],
    () => {
        cityRenderer?.playSimulation(prop.playSimulation)
        if (prop.playSimulation) emit('simulating')
    })
watch(
    () => [prop.walking_time_per_distance],
    () => {
        if (cityRenderer)
            cityRenderer.parm.walkingTimePerDistance = prop.walking_time_per_distance
    }
)
watch(
    () => [prop.heatMapProperty],
    () => {
        cityRenderer?.addHeatmap(prop.heatMapProperty, getHeatMapProperties())
        cityRenderer?.addAgents(getAgentProperties())
    }
)

watch(
    () => [prop.transparentBuildings, prop.transparentAgents],
    () => updateRenderProperties()
)
</script>

<template>
    <div id="cityCanvas" ref="cityCanvasContainer">
        <div v-if="prop.legend" id="legend">
            <LegendRangeComponent :range="prop.distanceGradientRange" label-from="short" label-to="long"
                v-if="prop.heatMapProperty === 'averageDist'" />
            <LegendRangeComponent :range="prop.conjunctionGradientRange" label-from="empty" label-to="crowded"
                v-if="prop.heatMapProperty === 'numberPaths'" />
        </div>
    </div>
</template>

<style scoped>
#cityCanvas {
    width: 100%;
    height: 100%;
    background-size: 3%;
    position: relative;
    filter: saturate(1.3) contrast(1.05);
}

#nameLabelContainer {
    width: 100%;
    display: flex;
    justify-content: center;
    pointer-events: none;
    position: absolute;
    top: 12px;
}

#timeLineCanvasContainer {
    position: absolute;
    width: 100%;
    height: 8px;
    z-index: 0;
}

#timeLineCanvasContainer>canvas {
    width: 100%;
    height: 8px;
    position: absolute;
}
</style>

<style>
.agentLabel {
    display: inline-block;
    text-align: center;
    background-color: var(--color-text);
    padding-left: 8px;
    padding-right: 8px;
    border-radius: 100px;
    border: 0.5px solid var(--bg-color);
    font-size: var(--font-size-note);
    color: var(--bg-color);
    position: absolute;
    opacity: 0.8;
}

.pathLabel {
    display: inline-block;
    background-color: var(--bg-color);
    padding-left: 8px;
    padding-right: 8px;
    border-radius: 100px;
    border: 0.5px solid var(--color-text);
    font-size: var(--font-size-note);
    color: var(--color-text);
    position: absolute;
    opacity: 0.8;
}

#legend {
    position: absolute;
    right: 6px;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    pointer-events: none;
    gap: 6px;
}

@media screen and (max-width: 600px) {
    #legend {
        right: 0px;
        height: calc(100% - 40px);
    }

    .agentLabel,
    .pathLabel {
        padding-left: 4px;
        padding-right: 4px;
        border-radius: 100px;
        font-size: 0.6em;
        border-width: 0.5px;
    }
}
</style>