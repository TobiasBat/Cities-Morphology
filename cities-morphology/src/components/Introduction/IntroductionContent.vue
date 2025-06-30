<script setup lang="ts">
import { IntroductionViews } from '@/scripts/introductionViews';
import { onMounted, reactive, ref } from 'vue';
import BarChart from '@/components/charts/barChart.vue';
import type { CityParameters } from 'city-grid';
import type { PathSimulationMetrics, PathSimulationVariationResult } from 'city-grid';

import populationIcon from '@/assets/images/variableIcons/population.png'
import sprawlIcon from '@/assets/images/variableIcons/spall.png'
import personPerBuildingIcon from '@/assets/images/variableIcons/personPerBuilding.png'
import elongationIcon from '@/assets/images/variableIcons/elongation.png'
import heightDistIcon from '@/assets/images/variableIcons/heightDist.png'
import floorsIcon from '@/assets/images/variableIcons/floors.png'
import logoBar from '@/assets/images/logo-bar.png'
import legendAgent from '@/assets/images/legend-agent-line.svg'
import legendAgentDark from '@/assets/images/legend-agent-line-dark.svg'
import { initDarkModeListener } from '@/scripts/darkMode';

const props = defineProps<{
    cityParameters: CityParameters | null,
    pathSimulationMetrics: PathSimulationMetrics | undefined
    metricsAlteredForParameter: { [cityParameter: string]: PathSimulationVariationResult[] }
    secondaryBars: { [cityParameter: string]: PathSimulationVariationResult[] }
}>()

const state = reactive({
    view: IntroductionViews.TITLE as IntroductionViews,
    darkMode: false
})

const emit = defineEmits<{
    (e: 'change', value: IntroductionViews): void
}>()

const titleContent = ref()
const agentsExplainContent = ref()
const initialSimContent = ref()
const sizeSection = ref()
const sprawlSection = ref()
const elongationSection = ref()
const personInBuildingSection = ref()
const heightDistSection = ref()

/**
 * Handles state when users scrolls and new section appears on screen
 * @param entries 
 * @param observer 
 */
function handleIntersections(entries: IntersectionObserverEntry[]) {
    let maxIntersectionRatio = 0
    let bestEntry = null as (IntersectionObserverEntry | null)

    entries.forEach((entry: IntersectionObserverEntry) => {
        if (maxIntersectionRatio < entry.intersectionRatio) {
            bestEntry = entry
        }
    })

    if (bestEntry) {
        const element = bestEntry.target
        switch (element) {
            case titleContent.value:
                state.view = IntroductionViews.TITLE
                emit('change', IntroductionViews.TITLE)
                break
            case agentsExplainContent.value:
                state.view = IntroductionViews.AGENTS_EXPLAIN
                emit('change', IntroductionViews.AGENTS_EXPLAIN)
                break
            case initialSimContent.value:
                state.view = IntroductionViews.INITIAL_SIM
                emit('change', IntroductionViews.INITIAL_SIM)
                break
            case sizeSection.value:
                state.view = IntroductionViews.SIZE
                emit('change', IntroductionViews.SIZE)
                break
            case sprawlSection.value:
                state.view = IntroductionViews.SPRAWL
                emit('change', IntroductionViews.SPRAWL)
                break
            case elongationSection.value:
                state.view = IntroductionViews.ELONGATION
                emit('change', IntroductionViews.ELONGATION)
                break
            case personInBuildingSection.value:
                state.view = IntroductionViews.BUILDING_SIZE
                emit('change', IntroductionViews.BUILDING_SIZE)
                break
            case heightDistSection.value:
                state.view = IntroductionViews.PYRAMID
                emit('change', IntroductionViews.PYRAMID)
                break
        }
    }
}

onMounted(() => {
    initDarkModeListener(state)
    const observer = new IntersectionObserver(handleIntersections, { rootMargin: '100px' })
    observer.observe(titleContent.value)
    observer.observe(agentsExplainContent.value)
    observer.observe(initialSimContent.value)
    observer.observe(sizeSection.value)
    observer.observe(sprawlSection.value)
    observer.observe(elongationSection.value)
    observer.observe(personInBuildingSection.value)
    observer.observe(heightDistSection.value)
})
</script>

<template>
    <section id="titleSection">
        <div class="content" ref="titleContent" id="titleContent">
            <div>
                <img :src="logoBar" id="logobar">
                <h1 id="title">Cities Morphology</h1>
            </div>
            <p>
                The size and shape of cities matter. They affect the travel distances of its city inhabitants, the total
                energy consumption of a city, and the area a city consumes. <em>Cities Morphology</em> lets you
                construct towns and cities based on basic variables like sprawl, elongation, and population size and
                illustrates the effects on travel distance, energy consumption, and area.
            </p>
        </div>
    </section>
    <section id="agentsExplainSection">
        <div class="content" ref="agentsExplainContent">
            <h3>Simulating Different Cities</h3>
            <p>
                To visualize the effect the shape of a city has on its energy consumption, we can alter important
                properties of virtual cities and run simulations.
            </p>
            <br>
            <p>
                In the visualization, each ball represents an agent. The number of agents corresponds to the population
                of our city. Each agent travels between a starting and an endpoint. The colors of the balls show the
                travel distances. Agents with a long journey are shown in red, whereas agents with a shorter journey are
                shown in blue. Additionally, we show the average travel distance for each street by coloring it
                accordingly.
            </p>
            <div id="legend-agent">
                <img :src="state.darkMode ? legendAgentDark : legendAgent" />
            </div>
        </div>
    </section>
    <section id="initialSimSection">
        <div class="content" ref="initialSimContent">
            <p>
                When we look at all agents, we can compute our virtual city's average travel distance. Additionally, the
                accumulated travel distances of all journeys can also serve as a proxy for the city's energy
                consumption.
            </p>
            <br>
            <p>
                In the visualization, an efficient compact city with short travel distances will have many agents and
                streets colored blue. In contrast, a city with more sprawl will have more red agents and streets.
                Let's manipulate the parameters of our city one by one to see how they affect travel distance and energy
                consumption.
            </p>
        </div>
    </section>
    <section id="size">
        <div class="content" ref="sizeSection">
            <h3><img :src="populationIcon">Population</h3>
            <p>
                We start by manipulating the number of people living in a city. Every time you change the slider on the
                bottom right, a corresponding city is constructed. For example, if you increase the population, the city
                gets more buildings.
            </p>
            <br>
            <p>
                The more people live in a city, the more energy there is for transport. It can be estimated that when a
                city doubles its population, its energy demand from transport triples.
            </p>
            <div class="barChart">
                <BarChart :x-axis-label="'Population'"
                    :mainBarX="props.cityParameters ? +props.cityParameters?.residents : 0" :metric="'totalDistance'"
                    :main-bar-y="props.pathSimulationMetrics"
                    :trend="state.view === IntroductionViews.SIZE ? props.metricsAlteredForParameter['residents'] : []"
                    :secondary-bars="props.secondaryBars['residents']" />
            </div>
        </div>
    </section>
    <section id="spall">
        <div class="content" ref="sprawlSection">
            <h3><img :src="sprawlIcon">Dense or Sprawl</h3>
            <p>
                The space between buildings also affects a city's efficiency and footprint. Increasing the space between
                buildings also drastically increases the average travel distance of the agents.
            </p>
            <div class="barChart">
                <BarChart :x-axis-label="'Sprawl'" :mainBarX="props.cityParameters ? +props.cityParameters.sprawl : 0"
                    :metric="'averageDistance'" :main-bar-y="props.pathSimulationMetrics"
                    :trend="state.view === IntroductionViews.SPRAWL ? props.metricsAlteredForParameter['unusedAreaOfProperty'] : []" />
            </div>
        </div>
    </section>
    <section id="elongation">
        <div class="content" ref="elongationSection">
            <h3><img :src="elongationIcon">Circular or Elongated</h3>
            <p>
                You can also change the cities elongation. An elongation value of 1 corresponds to a circular city, and
                higher values correspond to cities shaped like ellipses. As you can see in the chart below, the more
                stretched a city gets, the longer the travel distances in that city.
            </p>
            <div class="barChart">
                <BarChart :x-axis-label="'Elongation'"
                    :mainBarX="props.cityParameters ? +props.cityParameters?.elongation : 0" :metric="'averageDistance'"
                    :main-bar-y="props.pathSimulationMetrics"
                    :trend="state.view === IntroductionViews.ELONGATION ? props.metricsAlteredForParameter.elongation : []" />
            </div>
        </div>
    </section>
    <section id="personsInBuilding">
        <div class="content" ref="personInBuildingSection">
            <h3><img :src="personPerBuildingIcon"><img :src="floorsIcon">Shape of Buildings</h3>
            <p>
                The average travel distance of inhabitants is also greatly affected by the shape of the city's
                buildings. A city with large buildings that house a larger number of people requires fewer buildings to
                house the city's population. This results in shorter travel distances compared to a city where, on
                average, two persons live in a building. The average number of floors in our city does not affect the
                number of buildings or the number of people living in each building; instead, it only changes the shape
                of the building while preserving the apartment space. So, when the average floor height is increased,
                buildings become thinner and taller.
            </p>
            <div class="barChartDouble">
                <BarChart :x-axis-label="'Persons per building'"
                    :mainBarX="props.cityParameters ? +props.cityParameters?.personsPerBuilding : 0"
                    :metric="'averageDistance'" :main-bar-y="props.pathSimulationMetrics"
                    :trend="state.view === IntroductionViews.BUILDING_SIZE ? props.metricsAlteredForParameter.personPerBuilding : []" />
                <BarChart :x-axis-label="'Avg. floors'"
                    :mainBarX="props.cityParameters ? +props.cityParameters?.floors : 0" :metric="'averageDistance'"
                    :main-bar-y="props.pathSimulationMetrics"
                    :trend="state.view === IntroductionViews.BUILDING_SIZE ? props.metricsAlteredForParameter['floors'] : []" />
            </div>
        </div>
    </section>
    <section id="heightDist">
        <div class="content" ref="heightDistSection">
            <h3><img :src="heightDistIcon">Profile of a City</h3>
            <p>
                In the simulation, you can also change whether all buildings are equal in height or whether buildings in
                the center house more people than those located further away from the center. A city with a profile
                value = 0 is shaped like a pancake, where all houses are equal in height. A value of, e.g., three
                results in a city shaped like a pyramid with higher buildings in the center. Values smaller than zero
                have the opposite effect, creating a city that looks like a bowl.
            </p>
            <div class="barChart">
                <BarChart :x-axis-label="'Profile'"
                    :mainBarX="props.cityParameters ? +props.cityParameters?.heightParameter : 0"
                    :metric="'averageDistance'" :main-bar-y="props.pathSimulationMetrics"
                    :trend="props.metricsAlteredForParameter['heightParameter']" />
            </div>
        </div>
    </section>
</template>

<style scoped>
section {
    background-color: var(--bg-color2);
    width: 100%;
    min-height: 100svh;
    display: flex;
    align-items: center;
    padding-left: 36px;
    padding-right: 36px;
    margin-bottom: 33vh;
}

#titleSection {
    display: block;
    position: relative;
}

#logobar {
    height: 20px;
    margin-block-end: 3px;
}

h1 {
    font-size: 40px;
    margin-block-end: 100px;
    line-height: 0.9;
}

#title {
    animation-name: titleIntro;
    animation-duration: 0.33s;
    opacity: 0;
    animation-delay: 1.0s;
    animation-fill-mode: forwards;
    transform: translate(0, 0);
    animation-timing-function: ease-out;
}

@keyframes titleIntro {
    from {
        opacity: 0;
        transform: translate(0, -3px);
    }

    to {
        opacity: 1;
        transform: translate(0, 0);
    }
}

h3 {
    font-size: var(--font-size-large);
    color: var(--color-text);
    margin-block-end: 12px;
}

h3>img {
    filter: var(--icon-filter);
    width: calc(var(--font-size-large) * 0.7);
    margin-right: calc(var(--font-size-large) * 0.3);
}

.content {
    width: 100%;
}

#titleContent {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: calc(100svh);
    padding-top: 72px;
    padding-bottom: 72px;
    padding-left: 36px;
    padding-right: 36px;
    align-items: flex-start;
}

p {
    font-size: var(--font-size-text);
    line-height: 1.3;
    opacity: 0;
    animation-name: pShow;
    animation-duration: 1s;
    animation-delay: 1.5s;
    animation-timing-function: ease-out;
    animation-fill-mode: forwards;
}

.content>p,
.content>h3 {
    cursor: default;
}

.content>p::selection,
.content>h3::selection {
    background-color: white;
}

@keyframes pShow {
    from {
        opacity: 0;
        transform: translate(0, -6px);
    }

    to {
        opacity: 1;
        transform: translate(0, 0px);
    }
}

p>i {
    font: var(--font-size);
    font-style: italic;
    line-height: 1.3;
}

h3,
p {
    max-width: 500px;
}

.barChart {
    width: 75%;
    margin-left: 0%;
    margin-top: 100px;
    height: 300px;
}

.barChartDouble {
    width: 100%;
    height: 300px;
    margin-top: 100px;
    display: flex;
}

#legend-agent {
    display: flex;
    margin-top: 80px;
    gap: 60px;
    max-width: 500px;
    display: flex;
    justify-content: center;
}

@media screen and (max-width: 600px) {
    section {
        min-height: 50svh;
        padding-left: 12px;
        padding-right: 12px;
        margin-bottom: 15svh;
        padding-top: 12px;
    }

    h1 {
        font-size: 25px;
        margin-block-end: 48px;
        margin-top: 0px;
    }

    .barChart {
        width: 100%;
        margin-top: 12px;
        height: auto;
    }

    .barChartDouble {
        width: 100%;
        height: auto;
        margin-top: 12px;
        flex-direction: column;
    }

    #legend-agent {
        display: flex;
        margin-top: 25px;
        max-width: 100%;
    }

    #legend-agent img {
        width: 70%;

    }

    #titleContent {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        min-height: calc(60svh);
        height: auto;
        padding-top: 30px;
        padding-bottom: 6px;
        padding-left: 0px;
        padding-right: 0px;
        align-items: flex-start;
        /* background-color: yellow; */
    }
}

@media screen and (min-width: 2000px) {

    h3,
    p {
        max-width: 800px;
    }

    .barChart {
        width: 75%;
        margin-left: 0%;
        margin-top: 200px;
        height: 500px;
    }

    .barChartDouble {
        height: 500px;
    }

    #legend-agent {
        display: flex;
        margin-top: 180px;
        gap: 60px;
        max-width: 800px;
        display: flex;
        justify-content: center;
    }

    #legend-agent img {
        width: 500px;
    }
}
</style>