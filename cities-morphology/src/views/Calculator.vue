<script lang="ts" setup>
import type { CityInputParameters } from 'city-grid';
import { pathSimulationFromParametersWorker } from 'city-grid-webworker';
import { reactive, watch } from 'vue';

import popIcon from '@/assets/images/variableIcons/population-color.png'
import persPerBuilding from '@/assets/images/variableIcons/personPerBuilding-color.png'
import heightDist from '@/assets/images/variableIcons/heightDist-color.png'
import sprawl from '@/assets/images/variableIcons/spall-color.png'
import floors from '@/assets/images/variableIcons/floors-color.png'
import elongation from '@/assets/images/variableIcons/elongation-color.png'
import IconButton from '@/components/uiElements/IconButton.vue';

import areaIcon from '@/assets/images/areaIcon.png'
import distanceIcon from '@/assets/images/distanceIcon.png'
import Footer from '@/components/Footer.vue';

const vienna: CityInputParameters = {
    residents: 2000000,
    personsPerBuilding: 11.38,
    sprawl: 21.2,
    areaPerResident: 38,
    floors: 3,
    elongation: 1.5,
    heightParameter: 1.2
}
const baseJourneys = 100000

const state = reactive({
    parm: structuredClone(vienna),
    numJourneys: baseJourneys,
    avgDistance: undefined as string | undefined,
    dimension: undefined as [string, string] | undefined,
    numBuildings: undefined as string | undefined,
    isBase: true,
    area: undefined as string | undefined,
    weeklyTravel: undefined as string | undefined,
    computing: false
})

function reset() {
    state.parm = structuredClone(vienna)
    state.numJourneys = baseJourneys
}

function formatDistance(value: number) {
    return `${Math.round(value) / 1000} km`
}

function formatNumber(value: number) {
    return new Intl.NumberFormat("en-EN").format(
        Math.round(value * 10) / 10
    )
}

function formatArea(value: number) {
    return `${Math.round(value / (1000000))} km²`
}

function isBase() {
    return state.parm.residents === vienna.residents &&
        state.parm.personsPerBuilding === vienna.personsPerBuilding &&
        state.parm.sprawl === vienna.sprawl &&
        state.parm.floors === vienna.floors &&
        state.parm.elongation === vienna.elongation &&
        state.parm.areaPerResident === vienna.areaPerResident &&
        state.numJourneys === baseJourneys
}

function compute() {
    state.computing = true
    pathSimulationFromParametersWorker({
        residents: state.parm.residents,
        personsPerBuilding: state.parm.personsPerBuilding,
        sprawl: state.parm.sprawl,
        areaPerResident: state.parm.areaPerResident,
        floors: state.parm.floors,
        elongation: state.parm.elongation,
        heightParameter: state.parm.heightParameter
    }, {
        value: state.numJourneys,
        type: 'absolute'
    }, true)
        .then((result) => {
            const residents = result.grid.cityParameters ? result.grid.cityParameters.residents : state.parm.residents
            state.avgDistance = formatDistance(result.simulation.metrics.averageDistance)
            state.dimension = [
                `${formatDistance(Math.round(result.grid.shape.majorAxis / 100) * 100)}`,
                `${formatDistance(Math.round(result.grid.shape.minorAxis / 100) * 100)}`]
            state.numBuildings = formatNumber(result.grid.properties.length)
            state.area = formatArea(result.grid.stats.area)
            state.weeklyTravel = `${formatNumber(Math.round(result.simulation.metrics.averageDistance / 1000 * 20 * residents / 1000000))} million km`
            state.computing = false
        })
}

watch(() => [
    state.parm.residents,
    state.parm.personsPerBuilding,
    state.parm.sprawl,
    state.parm.areaPerResident,
    state.parm.floors,
    state.parm.elongation,
    state.parm.heightParameter,
    state.numJourneys
], () => {
    state.avgDistance = undefined
    state.numBuildings = undefined
    state.dimension = undefined
    state.weeklyTravel = undefined
    state.area = undefined
    state.isBase = isBase()
})

// compute()
</script>
<template>
    <div id="calculatorPage">
        <div id="wrapper">
            <div id="description">
                <h2>Cities Morphology Calculator</h2>
                <p>
                    This calculator can compute the average travel distance for cities with a population of multiple
                    million. This calculator uses the same model and code as the visualizations on this page. However,
                    the visualizations utilize parameters optimized to explain our model visually and resemble model
                    cities. This calculator, on the other hand, aims to calculate the expected average travel distance
                    for parameters that resemble those of real-world, city-sized populations. For example, the default
                    parameters approximate the city of Vienna.
                </p>
            </div>
            <div id="inputParmeters">
                <div class="numberInput">
                    <label for="residents"><img :src="popIcon">Population</label>
                    <input type="number" id="residents" step="1000" :value="state.parm.residents"
                        @change="(event: any) => state.parm.residents = +event.target.value" />
                </div>
                <div class="numberInput">
                    <label for="personsPerBuilding"><img :src="persPerBuilding">Persons per building</label>
                    <input type="number" id="personsPerBuilding" step="0.01" :value="state.parm.personsPerBuilding"
                        @change="(event: any) => state.parm.personsPerBuilding = +event.target.value" />
                </div>
                <div class="numberInput">
                    <label for="sprawl"><img :src="sprawl">Sprawl</label>
                    <input type="number" id="sprawl" step="0.1" :value="state.parm.sprawl"
                        @change="(event: any) => state.parm.sprawl = +event.target.value" />
                </div>

                <div class="numberInput">
                    <label for="floors"><img :src="floors">Avg. floors</label>
                    <input type="number" id="floors" step="1" :value="state.parm.floors"
                        @change="(event: any) => state.parm.floors = +event.target.value" />
                </div>
                <div class="numberInput">
                    <label for="elongation"><img :src="elongation">Elongation</label>
                    <input type="number" id="elongation" step="0.1" :value="state.parm.elongation"
                        @change="(event: any) => state.parm.elongation = +event.target.value" />
                </div>
                <div class="numberInput" id="profileInput">
                    <label for="profile"><img :src="heightDist">Profile</label>
                    <input type="number" step="0.1" :value="state.parm.heightParameter"
                        @change="(event: any) => state.parm.heightParameter = +event.target.value" />
                </div>

                <div class="numberInput">
                    <label for="sprawl">Area per resident (m²)</label>
                    <input type="number" step="0.1" :value="state.parm.areaPerResident"
                        @change="(event: any) => state.parm.areaPerResident = +event.target.value" />
                </div>
                <div class="numberInput">
                    <label for="journeys">Simulated journeys</label>
                    <input type="number" id="journeys" step="1" :value="state.numJourneys"
                        @change="(event: any) => state.numJourneys = Math.round(+event.target.value)" />
                </div>

                <div id="inputButtons">
                    <IconButton @click="compute()" title="Compute"
                        v-if="state.avgDistance === undefined && !state.computing" :negative="true" />
                    <IconButton @click="reset()" title="Reset Parameters" :negative="false"
                        v-if="!state.isBase && !state.computing" />
                </div>
            </div>

            <div id="resultLoading" v-if="state.computing">Computing Simulation …</div>
            <div id="resultHeadline" v-if="state.avgDistance">Results</div>

            <div v-if="state.avgDistance" class="result">
                <span class="label"><img :src="distanceIcon"> Average Travel Distance</span>
                <span class="value">{{ state.avgDistance }}</span>
            </div>
            <div v-if="state.area" class="result">
                <span class="label"><img :src="areaIcon">Area</span>
                <span class="value">{{ state.area }}</span>
            </div>
            <div v-if="state.weeklyTravel" class="result">
                <span class="label">Weekly travel kilometers</span>
                <span class="value">{{ state.weeklyTravel }}</span>
            </div>
            <div v-if="state.numBuildings" class="result">
                <span class="label">Buildings</span>
                <span class="value">{{ state.numBuildings }}</span>
            </div>
            <div v-if="state.dimension" class="result">
                <span class="lable">
                    City's major, minor axis
                </span>
                <span class="value">
                    {{ state.dimension[0] }}, {{ state.dimension[1] }}
                </span>
            </div>
        </div>
    </div>
    <Footer />
</template>


<style scoped>
#calculatorPage {
    background-color: var(--bg-color2);
    border-radius: 6px;
    width: 100%;
    height: 100%;
    min-height: calc(100svh - 250px);
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: center;

    font-size: var(--font-size-text);
    line-height: calc(var(--font-size-text) * 1.3);
}

#wrapper {
    margin-top: 12svh;
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 12svh;
    padding-left: 12px;
    padding-right: 12px;
    box-sizing: border-box;
}

#description {
    max-width: 700px;
}

#inputParmeters {
    display: block;
    background-color: var(--bg-color);
    padding: 32px 24px 12px;
    box-sizing: border-box;
    border-radius: 2;
    filter: var(--element-shadow);
    margin-bottom: 48px;
    margin-top: 48px;
    width: 100%;
    max-width: 550px;
}

#inputButtons {
    display: flex;
    justify-content: center;
    pointer-events: none;
    transform: translate(0, calc(12px + 50%));
    gap: 6px;
    min-height: 32px;
}

#inputButtons button {
    pointer-events: auto;
}

.numberInput {
    display: flex;
    width: 100%;
    justify-content: space-between;
    padding-bottom: 6px;
    gap: 4px;
    padding-top: 0px;
}

.numberInput img {
    height: var(--font-size);
    transform: translate(0, 20%);
    margin-right: var(--font-size);
}

.numberInput label {
    width: 75%;
}

.numberInput input {
    text-align: right;
    font-size: var(--font-size);
    font-family: var(--font-family);
    color: var(--color-text);
    padding: 0;
    margin: 0;
    border: none;
    border-bottom: solid var(--color-text-shade3) 1px;
    background-color: transparent;
    appearance: none;
    line-height: 1;
    height: auto;
    width: 50%;
    transition: border-bottom 0.25s;
    border-radius: 0;
}

.numberInput input:focus {
    outline: none;
    border-bottom: solid var(--color-text-shade1) 1px;
}

#profileInput {
    padding-bottom: 24px;
}

#resultLoading,
#resultHeadline {
    /* background-color: yellow; */
    width: 100%;
    font-size: var(--font-size);
    color: var(--color-text-shade2);
    padding-bottom: 12px;
}

.result {
    font-size: var(--font-size);
    display: flex;
    justify-content: space-between;
    border-bottom: solid var(--color-text-shade2) 1px;
    padding-top: 4px;
    padding-bottom: 4px;
    width: 100%;
    gap: 3px;
}

.result .label img {
    height: var(--font-size);
    transform: translate(0, 20%);
    margin-right: var(--font-size);
}


@media screen and (max-width: 600px) {
    #inputParmeters {
        margin-bottom: 24px;
        margin-top: 12px;
    }

    .numberInput input {
        font-size: 16px;
    }
}
</style>