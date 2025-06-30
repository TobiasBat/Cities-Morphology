<script setup lang="ts">
import * as d3 from 'd3'
import type { CityParameters, CityStats } from 'city-grid';
import type { PathSimulation, PathSimulationMetrics } from 'city-grid';
import { onMounted, reactive, ref, watch } from 'vue';
import StatsPopUpComponent from '@/components/charts/StatsPopUp.vue';
import distanceIcon from '@/assets/images/distanceIcon.png'
import boltIcon from '@/assets/images/boltIcon.png'
import areaIcon from '@/assets/images/areaIcon.png'
import IconSlideThroughComponent from '../uiElements/IconSlideThrough.vue';

const props = defineProps<{
    pathSimulations: [PathSimulation | null, PathSimulation | null],
    cityParameters?: [CityParameters | null, CityParameters | null],
    cityStats: [CityStats, CityStats],
    prevPathSimulations: [PathSimulation[], PathSimulation[]],
    prevCityGridParameters: [Array<CityParameters>, Array<CityParameters>],
    prevCityStats: [Array<CityStats>, Array<CityStats>]
    colors: [string, string],
    showTwo: boolean
}>()

const state = reactive({
    popUpPosX: 0,
    popUpPosY: 0,
    currentlyHoveredCityParameters: {
        area: 0,
        travelDist: 0,
        elongation: 0,
        residents: 0,
        personsPerBuilding: 0,
        livingArea: 0,
        floors: 0,
        streetWidth: 0,
        sprawl: 0,
        heightDistribution: 0,
        title: 'Previous layout'
    },
    selectedMetric: 'averageDistance' as keyof PathSimulationMetrics | keyof CityStats
})

const emit = defineEmits<{
    clickedParameters: [number, CityParameters]
}>()

const svgRef = ref()
const bgSVGRef = ref()

const container = ref()
const bgContainer = ref()
const popUpContainer = ref()

const style = {
    centerPadding: 2.5,
    mainBarWidth: 10,
    prevBarWidth: 6,
    prevBarPadding: 1.5,
    prevBarColor: '#CCCCCC',
    prevBarColorHover: '#000000',
    padding: {
        top: 12,
        left: 60,
        right: 60,
        bottom: 3
    },
}

const maxNumberPrevBars = 15

const statsMetricsOptions: Array<{ value: keyof PathSimulationMetrics | keyof CityStats, label: string, icon?: string }> = [
    { value: 'averageDistance', label: 'Avg. travel distance', icon: distanceIcon },
    { value: 'totalDistance', label: 'Energy consumption (travel)', icon: boltIcon },
    { value: 'area', label: 'Area', icon: areaIcon }
]

type prevRectData = {
    pathSimulation: PathSimulation,
    cityParameters: CityParameters,
    cityStats: CityStats
}

const yScale = d3.scaleLinear()

function updateScale() {
    if (!svgRef.value || !container.value) return
    if (
        !props.pathSimulations ||
        !props.pathSimulations[0] ||
        !props.pathSimulations[1] ||
        !props.cityStats ||
        !props.cityStats[0] ||
        !props.cityStats[1]
    ) return

    const rect = svgRef.value.getBoundingClientRect()

    const selectedValue0 = getSelectedValue(state.selectedMetric, props.pathSimulations[0].metrics, props.cityStats[0])
    const selectedValue1 = getSelectedValue(state.selectedMetric, props.pathSimulations[1].metrics, props.cityStats[1])

    let maxY = selectedValue0
    if (props.showTwo) maxY = Math.max(maxY, selectedValue1)
    if (state.selectedMetric in props.pathSimulations[0].metrics) {
        const key = state.selectedMetric as keyof PathSimulationMetrics
        if (!props.showTwo)
            props.prevPathSimulations[0].slice(0, maxNumberPrevBars * 2).forEach(sim => { maxY = Math.max(maxY, sim.metrics[key]) })
        if (props.showTwo)
            props.prevPathSimulations[1].slice(0, maxNumberPrevBars).forEach(sim => { maxY = Math.max(maxY, sim.metrics[key]) })
    } else {
        const key = state.selectedMetric as keyof CityStats
        if (!props.showTwo)
            props.prevCityStats[0].slice(0, maxNumberPrevBars * 2).forEach(stats => { maxY = Math.max(maxY, stats[key]) })
        if (props.showTwo)
            props.prevCityStats[1].slice(0, maxNumberPrevBars).forEach(stats => { maxY = Math.max(maxY, stats[key]) })
    }

    yScale.domain([0, maxY])
    yScale.range([rect.height - style.padding.bottom, style.padding.top])
}

function getSelectedValue(metric: keyof PathSimulationMetrics | keyof CityStats, pathSimulationMetric: PathSimulationMetrics | null, cityStats: CityStats | null): number {

    if (!cityStats || !pathSimulationMetric) return 0

    return metric in pathSimulationMetric ?
        pathSimulationMetric[metric as keyof PathSimulationMetrics] :
        cityStats[metric as keyof CityStats]
}

function getMetricLabel(metricKey: keyof PathSimulationMetrics | keyof CityStats): string {
    let out = ''
    statsMetricsOptions.forEach(option => {
        if (option.value === metricKey) {
            out = option.label
            if (out.split('(').length > 0) {
                out = out.split('(')[0]
            }
        }
    })
    return out
}

function resizeCanvases() {
    if (!svgRef.value || !container.value) return
    const svgElement = svgRef.value as SVGElement
    svgElement.innerHTML = ''

    const containerRect = container.value.getBoundingClientRect()
    svgElement.setAttribute('width', containerRect.width)
    svgElement.setAttribute('height', containerRect.height)

    const bgSvgElement = bgSVGRef.value as SVGElement
    if (!bgSvgElement) return

    bgSvgElement.setAttribute('width', containerRect.width)
    bgSvgElement.setAttribute('height', containerRect.height)
}

function drawChart() {
    if (!svgRef.value) return
    const svgElement = svgRef.value as SVGElement
    const rect = svgElement.getBoundingClientRect()

    // Add main bars 
    d3.select(svgElement)
        .append('g')
        .attr('class', 'mainBars')
        .call(node => {
            if (!props.pathSimulations ||
                !props.pathSimulations[0] ||
                !props.pathSimulations[1] ||
                !props.cityStats ||
                !props.cityStats[0] ||
                !props.cityStats[1]

            ) {
                return
            }
            const selectedValue0 = state.selectedMetric in props.pathSimulations[0].metrics ?
                props.pathSimulations[0].metrics[state.selectedMetric as keyof PathSimulationMetrics] :
                props.cityStats[0][state.selectedMetric as keyof CityStats]

            const selectedValue1 = state.selectedMetric in props.pathSimulations[1].metrics ?
                props.pathSimulations[1].metrics[state.selectedMetric as keyof PathSimulationMetrics] :
                props.cityStats[1][state.selectedMetric as keyof CityStats]

            const offsetLeftSide = props.showTwo ? (rect.width / 2 - style.centerPadding / 2) : (rect.width - style.padding.right)
            node.append('rect')
                .attr('class', 'mainBar')
                .attr('x', offsetLeftSide - style.mainBarWidth)
                .attr('y', yScale(selectedValue0))
                .attr('height', yScale(0) - yScale(selectedValue0))
                .attr('width', style.mainBarWidth)
                .attr('fill', props.colors[0])
                .data(() => {
                    if (!props.pathSimulations || !props.pathSimulations[0] || !props.cityParameters || !props.cityParameters[0]) return []
                    return [{ pathSimulation: props.pathSimulations[0], cityParameters: props.cityParameters[0], cityStats: props.cityStats[0] }]
                })
            if (props.showTwo) {
                node.append('rect')
                    .attr('class', 'mainBar')
                    .attr('x', rect.width / 2 + style.centerPadding / 2)
                    .attr('y', yScale(selectedValue1))
                    .attr('height', yScale(0) - yScale(selectedValue1))
                    .attr('width', style.mainBarWidth)
                    .attr('fill', props.colors[1])
                    .data(() => {
                        if (!props.pathSimulations || !props.pathSimulations[1] || !props.cityParameters || !props.cityParameters[1]) return []
                        return [{ pathSimulation: props.pathSimulations[1], cityParameters: props.cityParameters[1], cityStats: props.cityStats[1] }]
                    })
            }
        })

    // Add prev selected bars 
    d3.select(svgElement)
        .append('g')
        .attr('class', 'prevBars')
        .call(node => {
            // Left side 
            const leftSideLeftPoint = props.showTwo ?
                rect.width / 2 - style.mainBarWidth - style.centerPadding / 2 - style.prevBarPadding :
                rect.width - style.padding.right - style.mainBarWidth - style.prevBarPadding
            const _maxNumberPrevBars = props.showTwo ?
                maxNumberPrevBars :
                ((rect.width - style.padding.left - style.padding.right) / (style.prevBarWidth + style.prevBarPadding / 2 + 1) - 1)

            for (let i = 0;
                (
                    i < props.prevCityGridParameters[0].length ||
                    i < props.prevPathSimulations[0].length
                ) &&
                i < _maxNumberPrevBars; i++
            ) {

                const prevCityParameters = props.prevCityGridParameters[0][i]
                const prevPathSimulation = props.prevPathSimulations[0][i]
                const selectedValue = getSelectedValue(state.selectedMetric, prevPathSimulation.metrics, props.prevCityStats[0][i])

                const data: prevRectData = { pathSimulation: prevPathSimulation, cityParameters: prevCityParameters, cityStats: props.prevCityStats[0][i] }

                node.append('rect')
                    .attr('class', 'prevBar bar left')
                    .attr('x', leftSideLeftPoint - (i * (style.prevBarWidth + style.prevBarPadding)) - style.prevBarPadding - style.prevBarWidth)
                    .attr('y', yScale(selectedValue))
                    .attr('height', yScale(0) - yScale(selectedValue))
                    .attr('width', style.prevBarWidth)
                    .data([data])
            }

            // right side 
            if (props.showTwo) {
                const rightSideLeftPoint = rect.width / 2 + style.mainBarWidth + style.centerPadding / 2 + style.prevBarPadding
                for (let i = 0; (i < props.prevCityGridParameters[1].length || i < props.prevPathSimulations[1].length) && i < maxNumberPrevBars; i++) {
                    const prevCityParameters = props.prevCityGridParameters[1][i]
                    const prevPathSimulation = props.prevPathSimulations[1][i]
                    const selectedValue = getSelectedValue(state.selectedMetric, prevPathSimulation.metrics, props.prevCityStats[1][i])

                    const data: prevRectData = { pathSimulation: prevPathSimulation, cityParameters: prevCityParameters, cityStats: props.prevCityStats[1][i] }

                    node.append('rect')
                        .attr('class', 'prevBar bar right')
                        .attr('x', rightSideLeftPoint + (i * (style.prevBarWidth + style.prevBarPadding)) + style.prevBarPadding)
                        .attr('y', yScale(selectedValue))
                        .attr('height', yScale(0) - yScale(selectedValue))
                        .attr('width', style.prevBarWidth)
                        .data([data])
                }
            }
        })
    d3.selectAll('.mainBar')
        .style('pointer-events', 'auto')
        .on('mouseover', (d, _data) => {
            const data = _data as unknown as prevRectData
            const rect = d.toElement.getBoundingClientRect()
            state.popUpPosX = rect.left
            state.popUpPosY = Math.max(0, rect.bottom + 8)
            state.currentlyHoveredCityParameters.travelDist = data.pathSimulation.metrics.averageDistance
            state.currentlyHoveredCityParameters.area = data.cityStats.area
            state.currentlyHoveredCityParameters.elongation = data.cityParameters.elongation
            state.currentlyHoveredCityParameters.residents = data.cityParameters.residents
            state.currentlyHoveredCityParameters.livingArea = data.cityParameters.areaPerResident
            state.currentlyHoveredCityParameters.personsPerBuilding = data.cityParameters.personsPerBuilding
            state.currentlyHoveredCityParameters.floors = data.cityParameters.floors
            // state.currentlyHoveredCityParameters.streetWidth = data.cityParameters.streetWidth
            state.currentlyHoveredCityParameters.sprawl = data.cityParameters.sprawl
            state.currentlyHoveredCityParameters.heightDistribution = data.cityParameters.heightParameter
            state.currentlyHoveredCityParameters.title = 'Current layout'
        })
        .on('mouseout', () => {
            state.popUpPosX = 0
            state.popUpPosY = 0
        })
    d3.selectAll('.prevBar.left')
        .on('click', (d, _data) => {
            const data = _data as unknown as prevRectData
            emit('clickedParameters', 0, data.cityParameters)
        })
    d3.selectAll('.prevBar.right')
        .on('click', (d, _data) => {
            const data = _data as unknown as prevRectData
            emit('clickedParameters', 1, data.cityParameters)
        })
    d3.selectAll('.bar')
        .style('pointer-events', 'auto')
        .style('cursor', 'pointer')
        .attr('fill', style.prevBarColor)
        .on('mouseover', (d, _data) => {
            d3.select(d.toElement)
                .transition()
                .duration(100)
                .attr('fill', style.prevBarColorHover)
            const rect = d.toElement.getBoundingClientRect()
            state.popUpPosX = rect.left
            state.popUpPosY = Math.max(0, rect.bottom + 8)

            // Update the data
            const data = _data as unknown as prevRectData
            state.currentlyHoveredCityParameters.travelDist = data.pathSimulation.metrics.averageDistance
            state.currentlyHoveredCityParameters.area = data.cityStats.area
            state.currentlyHoveredCityParameters.elongation = data.cityParameters.elongation
            state.currentlyHoveredCityParameters.residents = data.cityParameters.residents
            state.currentlyHoveredCityParameters.livingArea = data.cityParameters.areaPerResident
            state.currentlyHoveredCityParameters.personsPerBuilding = data.cityParameters.personsPerBuilding
            state.currentlyHoveredCityParameters.floors = data.cityParameters.floors
            // state.currentlyHoveredCityParameters.streetWidth = data.cityParameters.streetWidth
            state.currentlyHoveredCityParameters.sprawl = data.cityParameters.sprawl
            state.currentlyHoveredCityParameters.heightDistribution = data.cityParameters.heightParameter
            state.currentlyHoveredCityParameters.title = 'Previous layout'

        })
        .on('mouseout', (d: any) => {
            d3.select(d.fromElement)
                .transition()
                .duration(100)
                .attr('fill', style.prevBarColor)

            state.popUpPosX = 0
            state.popUpPosY = 0
        })
}

function drawBackground() {
    if (!bgSVGRef.value) return
    if (!svgRef.value) return
    const bgSVG = d3.select(bgSVGRef.value)
    const rect = svgRef.value.getBoundingClientRect()

    bgSVG.text('')
    const yAxis = bgSVG.append('g')
        .attr('id', 'yAxisGroup')
        .attr('transform', `translate(${style.padding.left}, 0)`)
        .call(
            d3.axisLeft(yScale).ticks(4)
        )
    yAxis.selectAll('.tick')
        .append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', rect.width - style.padding.left - style.padding.right)
        .attr('y2', 0)
        .attr('stroke', 'black')
        .attr('class', 'levelLine')
    yAxis.selectAll('.tick')
        .append('text')
        .text((d: any) => d)
        .attr('x', rect.width - style.padding.left - 10)
        .attr('dy', '0.35em')
        .attr('fill', 'currentColor')
        .attr('text-anchor', 'left')
        .attr('text-align', 'left')

    if (yScale.range()[0] > 100) {
        bgSVG
            .append('g')
            .attr('transform', `rotate(-90) translate(${-rect.height / 2}, ${style.padding.left - 10})`)
            .append('text')
            .text(getMetricLabel(state.selectedMetric))
            .attr('text-anchor', 'middle')
    }


}

onMounted(() => {
    resizeCanvases()
    updateScale()
    drawBackground()
    drawChart()
    window.addEventListener('resize', () => {
        resizeCanvases()
        updateScale()
        drawChart()
        drawBackground()
    })
})

watch(() => [props.cityParameters, props.pathSimulations, props.prevCityGridParameters[0].length, props.prevCityGridParameters[1].length], () => {
    resizeCanvases()
    updateScale()
    drawBackground()
    drawChart()
})

watch(() => [state.selectedMetric, props.showTwo], () => {
    resizeCanvases()
    updateScale()
    drawBackground()
    drawChart()
})
</script>

<template>
    <div id="dropDownContainer">
        <IconSlideThroughComponent :options="statsMetricsOptions" v-model:option-selected="state.selectedMetric" />
    </div>
    <div id="wrapper">
        <div id="container" ref="container">
            <svg ref="svgRef">
            </svg>
        </div>
        <div class="backgroundContainer" ref="bgContainer">
            <svg ref="bgSVGRef">

            </svg>
        </div>
    </div>
    <div id="popUpContainer" ref="popUpContainer"
        :style="`left: ${state.popUpPosX}px; top: ${state.popUpPosY}px; display: ${state.popUpPosX === 0 && state.popUpPosY === 0 ? 'none' : 'inherit'}`">
        <StatsPopUpComponent :elongation="state.currentlyHoveredCityParameters.elongation"
            :persons-per-building="state.currentlyHoveredCityParameters.personsPerBuilding"
            :living-area="state.currentlyHoveredCityParameters.livingArea"
            :floors="state.currentlyHoveredCityParameters.floors"
            :residents="state.currentlyHoveredCityParameters.residents"
            :street-width="state.currentlyHoveredCityParameters.streetWidth"
            :title="state.currentlyHoveredCityParameters.title"
            :height-distribution="state.currentlyHoveredCityParameters.heightDistribution"
            :sprawl="state.currentlyHoveredCityParameters.sprawl" :area="state.currentlyHoveredCityParameters.area"
            :travel-dist="state.currentlyHoveredCityParameters.travelDist" />
    </div>
</template>

<style scoped>
#wrapper {
    width: 100%;
    height: calc(100% - 24px - 1.5px);
    display: flex;
    flex-direction: column;
    position: absolute;
    gap: 12px;
}

#container {
    width: 100%;
    height: 100%;
    background-color: transparent;
    display: flex;
    justify-content: center;
    pointer-events: none;
    z-index: 1;
}

#dropDownContainer {
    display: flex;
    justify-content: center;
    position: relative;
    z-index: 2;
    margin-bottom: 0px;
}

svg {
    width: 100%;
    height: 100%;
    pointer-events: none;
}

.backgroundContainer {
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: 0;
    /* background-color: var(--bg-color2); */
    /* filter: drop-shadow(0 0 0.75rem crimson); */
}
</style>

<style>
/** Styling of axis */
#yAxisGroup>path.domain {
    stroke: transparent;
    stroke-width: 0.1px;
}

#yAxisGroup>.tick>text {
    font-size: 10px !important;
    /* fill: var(--color-text-shade2) !important; */
    fill: transparent;
}

#yAxisGroup>.tick>line {
    stroke: var(--color-text-shade2);
    opacity: 0;
    stroke-width: 1px;
}

#yAxisGroup>.tick>.levelLine {
    stroke: var(--color-text);
    opacity: 0.2;
    stroke-width: 1px;
    stroke-dasharray: 2 5;
    mix-blend-mode: multiply;
}

.prevBars {
    pointer-events: none;
}

.mainBars {
    pointer-events: none;
}

#popUpContainer {
    position: fixed;
    /* display: block !important; */
    /* transform: translate(100px, 100px); */
}

@media screen and (max-width: 600px) {}
</style>