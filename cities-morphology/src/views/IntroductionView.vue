<script lang="ts" setup>
import IntroductionContentComponent from '@/components/Introduction/IntroductionContent.vue';
import IntroductionSimulationComponent from '@/components/Introduction/IntroductionSimulation.vue';
import { IntroductionViews } from '@/scripts/introductionViews';
import { onMounted, reactive, ref } from 'vue';
import type { CityParameters } from 'city-grid';
import {
    type PathSimulationMetrics,
    type PathSimulationVariationResult
} from 'city-grid';
import CityStatsComponent from '@/components/simViews/CityStats.vue';
import FooterComponent from '@/components/Footer.vue';
import IntroductionCompareComponent from '@/components/Introduction/IntroductionCompare.vue';

const state = reactive({
    view: IntroductionViews.TITLE,
    cityParameters: null as CityParameters | null,
    pathSimulationMetrics: undefined as PathSimulationMetrics | undefined,
    metricsAlteredForParameter: { // values for the trend line in bar charts 
        'residents': [],
        'unusedAreaOfProperty': [],
        'elongation': [],
        'personsPerBuilding': [],
        'floors': [],
        'heightParameter': []
    } as {
        [cityParameter: string]:
        PathSimulationVariationResult[]
    },
    secondaryBars: { // values used for predefined bars in the bar charts
        'residents': []
    } as {
        [cityParameter: string]:
        PathSimulationVariationResult[]
    }
})

const compareContainer = ref()
const contentContainer = ref()
const contentComponent = ref()

/**
 * Sets the values for the computed trend line of bar charts
 * @param results 
 * @param valueAltered 
 */
function setAlteredParameters(results: PathSimulationVariationResult[], valueAltered: keyof CityParameters) {
    switch (valueAltered) {
        case ('residents'):
            state.metricsAlteredForParameter.residents = results
            break
        case ('sprawl'):
            state.metricsAlteredForParameter.unusedAreaOfProperty = results
            break
        case ('elongation'):
            state.metricsAlteredForParameter.elongation = results
            break
        case ('personsPerBuilding'):
            state.metricsAlteredForParameter.personPerBuilding = results
            break
        case ('floors'):
            state.metricsAlteredForParameter.floors = results
            break
        case ('heightParameter'):
            state.metricsAlteredForParameter.heightParameter = results
            break
    }
}

/**
 * Sets the predefined computed values for the bar charts.
 * @param results 
 * @param valueAltered 
 */
function setSecondaryBars(results: PathSimulationVariationResult[], valueAltered: keyof CityParameters) {
    switch (valueAltered) {
        case ('residents'):
            state.secondaryBars.residents = results
            break
    }
}

onMounted(() => {
    const observer = new IntersectionObserver(
        () => { state.view = IntroductionViews.OTHER },
        { threshold: 0.1, rootMargin: '0px' }
    )
    observer.observe(compareContainer.value)
})

</script>
<template>
    <div id="container">
        <div id="textContainer" ref="contentContainer">
            <IntroductionContentComponent @change="(view) => { state.view = view }"
                :city-parameters="state.cityParameters" :path-simulation-metrics="state.pathSimulationMetrics"
                :metrics-altered-for-parameter="state.metricsAlteredForParameter" :secondary-bars="state.secondaryBars"
                ref="contentComponent" />
        </div>
        <div id="simContainer">
            <IntroductionSimulationComponent :view="state.view"
                @change="(cityParameters: CityParameters, pathSimulationMetrics: PathSimulationMetrics) => { state.cityParameters = cityParameters; state.pathSimulationMetrics = pathSimulationMetrics }"
                @variations="(results: PathSimulationVariationResult[], valueAltered: keyof CityParameters) => { setAlteredParameters(results, valueAltered) }"
                @secondary-results="(results: PathSimulationVariationResult[], valueAltered: keyof CityParameters) => {
                    setSecondaryBars(results, valueAltered)
                }" />
        </div>
    </div>
    <div id="statsContainer"
        :class="`${(state.view === IntroductionViews.TITLE || state.view === IntroductionViews.AGENTS_EXPLAIN || state.view == IntroductionViews.INITIAL_SIM || state.view === IntroductionViews.OTHER) ? 'hide' : ''}`">
        <CityStatsComponent :parameters="state.cityParameters" :view="state.view" />
    </div>
    <div id="compareContainer" ref="compareContainer">
        <IntroductionCompareComponent />
    </div>
    <div id="footerContainer">
        <FooterComponent />
    </div>
</template>
<style scoped>
#navComp {
    display: block;
    position: fixed;
    left: 0;
    top: 0;
}

#container {
    height: 100svh;
    width: calc(100vw - var(--nav-width));
    left: 0;
    top: 0px;
    display: flex;
    justify-content: stretch;
    position: relative;
    gap: 0px;
}

#textContainer {
    width: 100%;
    overflow-y: scroll;
    background-color: var(--bg-color2);
    border-radius: 5px;
}

#simContainer {
    width: 100%;
    background-color: var(--bg-color2);
    border-radius: 5px;
}

#simContainer div {
    opacity: 0.0;
    animation-name: simIntro;
    animation-duration: 1s;
    animation-delay: 1.5s;
    animation-timing-function: ease-out;
    animation-fill-mode: forwards;
}

@keyframes simIntro {
    0% {
        opacity: 0.0;
    }

    100% {
        opacity: 1.0;
    }
}

#statsContainer {
    position: fixed;
    display: block;
    top: 2px;
    width: calc(100% - 53px);
    transform: translate(0, 0);
    opacity: 1;
    transition: all 0.25s;
}

#statsContainer.hide {
    opacity: 0;
    transform: translate(0%, -100%);
}

#compareContainer {
    width: 100%;
}

#footerContainer {
    width: 100%
}

@media screen and (max-width: 600px) {
    #container {
        flex-direction: column;
        gap: 1.5px;
    }

    #textContainer {
        height: 60svh;
    }

    #simContainer {
        height: 40svh;
    }

    #statsContainer,
    #statsContainer.hide {
        opacity: 0;
        transform: translate(0%, -100%);
    }
}
</style>