<script setup lang="ts">
import type { CityParameters } from 'city-grid'
import { IntroductionViews } from '@/scripts/introductionViews'
import populationIcon from '@/assets/images/variableIcons/population.png'
import sprawlIcon from '@/assets/images/variableIcons/spall.png'
import personPerBuildingIcon from '@/assets/images/variableIcons/personPerBuilding.png'
import elongationIcon from '@/assets/images/variableIcons/elongation.png'
import heightDistIcon from '@/assets/images/variableIcons/heightDist.png'
import floorsIcon from '@/assets/images/variableIcons/floors.png'

const props = defineProps<{
    parameters: CityParameters | null
    view: IntroductionViews
}>()
</script>

<template>
    <div id="wrapper" v-if="parameters">
        <div :class="`entrance ${props.view === IntroductionViews.SIZE ? 'highlighted' : ''}`">
            <div class="valueWrapper">
                <div class="label">
                    Population
                </div>
                <div class="value">
                    <img :src="populationIcon">
                    {{ parameters.residents }}
                </div>
            </div>
        </div>
        <div :class="`entrance ${props.view === IntroductionViews.SPRAWL ? 'highlighted' : ''}`">
            <div class="valueWrapper">
                <div class="label">
                    Sprawl
                </div>
                <div class="value">
                    <img :src="sprawlIcon">
                    {{ parameters.sprawl }}
                </div>
            </div>
        </div>
        <div :class="`entrance ${props.view === IntroductionViews.ELONGATION ? 'highlighted' : ''}`">
            <div class="valueWrapper">
                <div class="label">
                    Elongation
                </div>
                <div class="value">
                    <img :src="elongationIcon">
                    {{ parameters.elongation }}
                </div>
            </div>
        </div>
        <div :class="`entrance ${props.view === IntroductionViews.BUILDING_SIZE ? 'highlighted' : ''}`">
            <div class="valueWrapper">
                <div class="label">
                    Buildings
                </div>
                <div class="value">
                    <img :src="personPerBuildingIcon">
                    {{ parameters.personsPerBuilding }}
                </div>
                <div class="value">
                    <img :src="floorsIcon">
                    {{ parameters.floors }}
                </div>
            </div>
        </div>
        <div :class="`entrance ${props.view === IntroductionViews.PYRAMID ? 'highlighted' : ''}`">
            <div class="valueWrapper">
                <div class="label">
                    Profile
                </div>
                <div class="value">
                    <img :src="heightDistIcon">
                    {{ parameters.heightParameter }}
                </div>
            </div>
        </div>

    </div>
</template>
<style scoped>
#wrapper {
    display: flex;
    justify-content: center;
    align-items: stretch;
    box-sizing: border-box;
    gap: 1.5px;
    /** filter: var(--element-shadow-light); **/
}

.entrance {
    background-color: var(--bg-color);
    min-width: 100px;
    padding-top: 18px;
    padding-bottom: 4px;
    padding-left: 12px;
    padding-right: 18px;
    transition: all 0.45s 0.15s;
    box-sizing: border-box;
    margin-bottom: 0px;
    height: auto;
    display: inline-block;
}

.entrance.highlighted {
    background-color: var(--color-text);
    transition: all 0.45s 0.0s;
}

.entrance>.valueWrapper {
    max-width: 130px;
    height: 100%;
}

.entrance>.valueWrapper .label {
    font-size: var(--font-size-note) !important;
    color: var(--color-text-shade2);
    display: block;
    position: relative;
    line-height: var(--font-size-note);
    margin-bottom: 5px;
}

.entrance.highlighted>.valueWrapper>.label {
    color: var(--bg-color3);
}

.entrance>.valueWrapper>.value {
    font-size: var(--font-size) !important;
    line-height: var(--font-size);
    padding-bottom: 0px;
    padding-top: 2px;

    color: var(--color-text);
    display: inline-block;
    margin-right: 7px;
}

.entrance.highlighted>.valueWrapper>.value {
    color: var(--bg-color);
}

.entrance>.valueWrapper>.value>img {
    width: calc(var(--font-size) * 0.6);
    margin-bottom: 1px;
    margin-right: 3px;
    filter: var(--icon-filter);
    transition: all 0.45s 0.15s;
}

.entrance.highlighted>.valueWrapper>.value>img {
    filter: var(--icon-filter-inverted);
    transition: all 0.45s 0.0s;
}
</style>