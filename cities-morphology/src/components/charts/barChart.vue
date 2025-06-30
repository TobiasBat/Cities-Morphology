<script lang="ts" setup>
import { onMounted, reactive, ref, watch } from 'vue';
import * as d3 from 'd3'
import type { PathSimulationMetrics, PathSimulationVariationResult } from 'city-grid';
import type { CityStats } from 'city-grid';

const props = defineProps<{
    xAxisLabel?: string,
    mainBarX: number,
    metric: keyof PathSimulationMetrics | Array<keyof PathSimulationMetrics | keyof CityStats> | keyof CityStats
    mainBarY?: PathSimulationMetrics,
    trend: PathSimulationVariationResult[]
    secondaryBars?: PathSimulationVariationResult[]
}>()

const state = reactive({
    width: 100,
    height: 100,
    xDomain: [0, 1],
    yDomain: [0, 0],
    currentMetric:
        Array.isArray(props.metric) ?
            props.metric[0] as keyof PathSimulationMetrics :
            props.metric as keyof PathSimulationMetrics
})

const svgRef = ref()
const mainBarRef = ref()
const lineRef = ref()
const secondaryBarsGroupRef = ref()
const mainBarLabel = ref()

const margin = { left: 30, bottom: 30, top: 20, right: 40 }

const yScale = d3.scaleLinear()
const xScale = d3.scaleLinear()

onMounted(() => {
    updateSizes()
    updateChart()
})

function updateChart() {
    updateScales()
    updateTrend()
    updateMainBar()
    updateSecondaryBars()
}

function updateScales() {
    let xDomain = [10e10, -1]
    let yDomain = [0, -1]

    if (props.trend.length === 0) {
        xDomain = [0, 10e10]
        yDomain = [0, 0]
    } else {
        props.trend.forEach(data => {
            xDomain[0] = Math.min(xDomain[0], data.value)
            xDomain[1] = Math.max(xDomain[1], data.value)
            yDomain[0] = Math.min(yDomain[0], data.pathSimulationMetrics[state.currentMetric])
            yDomain[1] = Math.max(yDomain[1], data.pathSimulationMetrics[state.currentMetric])
        })
    }
    xScale
        .domain(xDomain)
        .range([margin.left, state.width - margin.right])
    yScale
        .domain(yDomain)
        .range([state.height - margin.bottom, margin.top])

    state.xDomain = xDomain
    state.yDomain = yDomain
}

function updateSizes() {
    const svg = svgRef.value as SVGElement
    const rect = svg.getBoundingClientRect()
    state.width = rect.width
    state.height = rect.height
}

function updateMainBar() {
    if (props.mainBarX !== undefined && props.mainBarY && mainBarRef.value) {
        const barWidth = 10
        d3.select(mainBarRef.value)
            .transition()
            .delay(200)
            .duration(400)
            .attr('x', Math.max(margin.left, xScale(props.mainBarX)) - barWidth / 2)
            .attr('width', barWidth)
            .attr('y', () => {
                if (!props.mainBarY || props.trend.length < 1)
                    return state.height - margin.bottom
                return yScale(props.mainBarY[state.currentMetric])
            })
            .attr('height', () => {
                if (!props.mainBarY || props.trend.length < 1)
                    return 0
                return state.height - margin.bottom - yScale(props.mainBarY[state.currentMetric])
            })
    }
    if (props.mainBarX !== undefined && props.mainBarY && mainBarLabel.value) {
        d3.select(mainBarLabel.value)
            .transition()
            .delay(200)
            .duration(400)
            .text(props.mainBarX)
            .attr('x', Math.max(margin.left, xScale(props.mainBarX)))
    }
}

function updateTrend() {
    const curveGenerator = d3.line()
        .x((d: any) => xScale(d.value))
        .y((d: any) => yScale(d.pathSimulationMetrics[state.currentMetric]))
        .curve(d3.curveCardinal.tension(0.0))

    const curveString = props.trend.length > 0 ?
        curveGenerator(props.trend as any) :
        getDefaultSecondaryCurveString(9)

    if (!lineRef.value) return
    d3.select(lineRef.value)
        .transition()
        .delay(600)
        .duration(600)
        .attr('d', curveString)
        .attr('opacity', props.trend.length > 0 ? 1 : 0)
}

function updateSecondaryBars() {
    if (!props.secondaryBars ||
        props.secondaryBars.length < 1 ||
        !secondaryBarsGroupRef.value
    ) return

    const barWidth = 10

    d3.select(secondaryBarsGroupRef.value).text('')

    const reverenceHeight = props.secondaryBars[0].pathSimulationMetrics[state.currentMetric]

    const reverenceBarGroup = d3.select(secondaryBarsGroupRef.value)
        .append('g')
        .attr('class', 'reverenceLines')

    if (yScale(reverenceHeight) === 0 || (yScale(0) - yScale(reverenceHeight)) === 0) return

    const numReverenceLines = Math.ceil(
        (state.height - margin.top - margin.bottom) / (yScale(0) - yScale(reverenceHeight))
    )


    if (!numReverenceLines) return
    for (let i = 0; i < numReverenceLines; i++) {
        const x1 = margin.left
        const x2 = state.width - margin.right
        const y = state.height - margin.bottom - i * (yScale(0) - yScale(reverenceHeight))
        reverenceBarGroup
            .append('line')
            .attr('x1', x1)
            .attr('x2', x2)
            .attr('y1', y)
            .attr('y2', y)
    }

    props.secondaryBars.forEach(result => {
        d3.select(secondaryBarsGroupRef.value)
            .append('rect')
            .attr('x', Math.max(margin.left, xScale(result.value)) - barWidth / 2)
            .attr('width', barWidth)
            .attr('y', () => {
                return yScale(result.pathSimulationMetrics[state.currentMetric])
            })
            .attr('height', () => {
                return state.height - margin.bottom - yScale(result.pathSimulationMetrics[state.currentMetric])
            })
            .attr('class', 'secondaryBar')

        reverenceBarGroup
            .append('text')
            .text(result.value)
            .attr('x', xScale(result.value))
            .attr('y', state.height - margin.bottom + 2)
            .attr('alignment-baseline', 'hanging')
            .attr('text-anchor', 'middle')
    })
}

function formatMetric(metric: keyof PathSimulationMetrics | keyof CityStats): string {
    switch (metric) {
        case 'averageDistance':
            return 'Avg. travel distance'
        case 'totalDistance':
            return 'Travel-related energy consumption'
        case 'area':
            return 'Area'
    }
    return ''
}

function getDefaultSecondaryCurveString(subdivisions: number): string {
    const xi = margin.left
    const yi = state.height - margin.bottom
    const xj = state.width - margin.right
    const yj = state.height - margin.bottom

    let path = `M${margin.left} ${state.height - margin.bottom}`
    for (let i = 1; i <= subdivisions; i++) {
        const k_1 = i / subdivisions
        const k_0 = (i - 1) / subdivisions

        const xk1 = (1 - k_1) * xi + k_1 * xj
        const xk0 = (1 - k_0) * xi + k_0 * xj

        const yk1 = (1 - k_1) * yi + k_1 * yj
        const yk0 = (1 - k_0) * yi + k_0 * yj

        path += `,C${xk0},${yk0},${xk1},${yk1},${xk1},${yk1}`
    }
    return path
}

function formateAxisValue(value: number): string {
    if (value < 1000) {
        return `${Math.round(value)}`
    }
    if (value < 10000) {
        return `${Math.round(value)}`
        // return `${Math.round(value / 100)}e2`
    }
    if (value < 100000) {
        return `${Math.round(value / 1000)}e3`
    }
    if (value < 1000000) {
        return `${Math.round(value / 10000)}e4`
    }
    return ``
}

watch(() => [props.mainBarX, props.mainBarY], () => {
    updateChart()
})

watch(() => props.trend, () => {
    updateChart()
})

watch(() => props.secondaryBars, () => {
    updateChart()
})


</script>

<template>
    <div id="wrapper">
        <svg ref="svgRef" width="100%" height="100%">
            <text :x="state.width / 2" :y="state.height - 3" id="xAxisLabel" class="label">
                {{ props.xAxisLabel }}
            </text>
            <text :x="0" :y="0" style="writing-mode: vertical-lr; glyph-orientation-vertical: 90;" text-anchor="middle"
                :transform="`translate(${margin.left - 20}, ${(state.height - margin.bottom) / 2}) rotate(180)`"
                alignment-baseline="baseline">
                {{ formatMetric(state.currentMetric) }}
            </text>
            <text :x="margin.left" :y="state.height - 3" class="rangeLabel">
                {{ formateAxisValue(state.xDomain[0]) }}
            </text>
            <text :x="state.width - margin.right" :y="state.height - 3" class="rangeLabel" text-anchor="end">
                {{ formateAxisValue(state.xDomain[1]) }}
            </text>
            <text :x="0" :y="0" style="writing-mode: vertical-lr; glyph-orientation-vertical: 270;"
                :transform="`translate(${margin.left - 20}, ${(state.height - margin.bottom)}) rotate(180)`"
                alignment-baseline="baseline" class="rangeLabel">
                {{ formateAxisValue(state.yDomain[0]) }}
            </text>
            <text :x="0" :y="0" style="writing-mode: vertical-lr; glyph-orientation-vertical: 270;" text-anchor="end"
                :transform="`translate(${margin.left - 20}, ${(margin.top)}) rotate(180)`" alignment-baseline="baseline"
                opacity="0" class="rangeLabel">
                {{ formateAxisValue(state.yDomain[1]) }}
            </text>
            <g :transform="`translate(${margin.left - 5}, ${margin.top - 10})`">
                <polygon points="0,10 10,10, 5,0" class="arrow" />
            </g>
            <g :transform="`translate(${state.width - margin.right}, ${state.height - margin.bottom - 5})`">
                <polygon points="0, 0 0,10 10,5" class="arrow" />
            </g>
            <g class="levelLines" v-if="!props.secondaryBars">
                <line v-for="i in [1, 2, 3]" :x1="margin.left" :x2="state.width - margin.right"
                    :y1="margin.top + (state.height - margin.bottom - margin.top) * (i / 4)"
                    :y2="margin.top + (state.height - margin.bottom - margin.top) * (i / 4)" />
            </g>
            <path
                :d="`M${margin.left} ${state.height - margin.bottom} L${state.width - margin.right} ${state.height - margin.bottom}`"
                ref="lineRef" id="line" />
            <g ref="secondaryBarsGroupRef"></g>
            <g>
                <rect :x="margin.left - 5" :y="state.height - margin.bottom" :width="10" height="0" ref="mainBarRef"
                    id="mainBar" />
                <text :x="margin.left - 5" :y="state.height - margin.bottom + 14" text-anchor="middle"
                    ref="mainBarLabel"></text>
            </g>
            <line :x1="margin.left" :y1="margin.top" :x2="margin.left" :y2="state.height - margin.bottom"
                class="axisLine" />
            <line :x1="margin.left" :y1="state.height - margin.bottom" :x2="state.width - margin.right"
                :y2="state.height - margin.bottom" class="axisLine" />
        </svg>
    </div>
</template>

<style scoped>
#wrapper {
    width: 100%;
    height: 100%;
}
</style>
<style>
.axisLine {
    fill: none;
    stroke-width: 1px;
    stroke: var(--color-text);
}

.arrow {
    fill: var(--color-text);
    stroke: none;
}

text {
    font-size: var(--font-size-note);
    fill: var(--color-text);
}

.label {}

#xAxisLabel {
    text-anchor: middle;
}

#mainBar {
    fill: var(--color-text);
}

.secondaryBar {
    fill: var(--color-text-shade2);
}

#line {
    fill: transparent;
    stroke: var(--color-text-shade2);
    stroke-width: 1px;
}

.rangeLabel {
    fill: var(--color-text-shade2);
}

.reverenceLines line,
.levelLines line {
    stroke: var(--color-text);
    opacity: 0.2;
    stroke-dasharray: 5px 5px;
    fill: none;
}

.reverenceLines text {
    fill: var(--color-text);
}
</style>