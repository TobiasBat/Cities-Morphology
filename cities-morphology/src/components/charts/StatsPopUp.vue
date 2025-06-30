<script setup lang="ts">
import populationIcon from '@/assets/images/variableIcons/population.png'
import sprawlIcon from '@/assets/images/variableIcons/spall.png'
import personPerBuildingIcon from '@/assets/images/variableIcons/personPerBuilding.png'
import elongationIcon from '@/assets/images/variableIcons/elongation.png'
import heightDistIcon from '@/assets/images/variableIcons/heightDist.png'
import floorsIcon from '@/assets/images/variableIcons/floors.png'
import areaIcon from '@/assets/images/areaIcon.png'
import distanceIcon from '@/assets/images/distanceIcon.png'
import energyIcon from '@/assets/images/boltIcon.png'


const props = defineProps({
    elongation: {
        type: Number,
        default: 0
    },
    residents: {
        type: Number,
        default: 0
    },
    personsPerBuilding: {
        type: Number,
        default: 0
    },
    livingArea: {
        type: Number,
        default: 0
    },
    floors: {
        type: Number,
        default: 0
    },
    streetWidth: {
        type: Number,
        default: 0
    },
    sprawl: {
        type: Number,
        default: 0
    },
    heightDistribution: {
        type: Number,
        default: 0
    },
    title: {
        type: String,
        default: ''
    },
    advanced: {
        type: Boolean,
        default: false
    },
    travelDist: {
        type: Number,
        default: 0
    },
    area: {
        type: Number,
        default: 0
    }
})
</script>

<template>
    <div id="wrapper">
        <div id="popUpContainer">
            <div class="title">{{ props.title }}</div>
            <div class="valueGroup">
                <span class="label">
                    <img :src="distanceIcon">
                    Avg. travel distance
                </span>
                <span class="value">{{ Math.round(props.travelDist * 10) / 10 }}</span>
            </div>
            <div class="valueGroup">
                <span class="label">
                    <img :src="areaIcon">
                    Area
                </span>
                <span class="value">{{ Math.round(props.area) }}</span>
            </div>
            <div class="valueGroup" id="energyGroup">
                <span class="label">
                    <img :src="energyIcon">
                    Weekly travel distance (millions)
                </span>
                <span class="value">{{ Math.round(props.travelDist * props.residents * 20 / 10000) / 100 }}</span>
            </div>
            <div class="valueGroup">
                <span class="label">
                    <img :src="elongationIcon">
                    Elongation
                </span>
                <span class="value">{{ props.elongation }}</span>
            </div>
            <div class="valueGroup">
                <span class="label">
                    <img :src="populationIcon">
                    Residents
                </span>
                <span class="value">{{ props.residents }}</span>
            </div>
            <div class="valueGroup">
                <span class="label">
                    <img :src="personPerBuildingIcon">
                    Persons per building
                </span>
                <span class="value">{{ props.personsPerBuilding }}</span>
            </div>
            <div v-if="props.advanced" class="valueGroup">
                <span class="label">Living area</span>
                <span class="value">{{ props.livingArea }}</span>
            </div>
            <div class="valueGroup">
                <span class="label">
                    <img :src="floorsIcon">
                    Floors
                </span>
                <span class="value">{{ props.floors }}</span>
            </div>
            <div v-if="props.advanced" class="valueGroup">
                <span class="label">Street width</span>
                <span class="value">{{ props.streetWidth }}</span>
            </div>
            <div class="valueGroup">
                <span class="label">
                    <img :src="sprawlIcon">
                    Sprawl
                </span>
                <span class="value">{{ props.sprawl }}</span>
            </div>
            <div class="valueGroup">
                <span class="label">
                    <img :src="heightDistIcon">
                    Height distribution
                </span>
                <span class="value">{{ props.heightDistribution }}</span>
            </div>
        </div>
        <div class="route"></div>
    </div>
</template>

<style scoped>
#wrapper {
    filter: var(--element-shadow-light);
}

#popUpContainer {
    min-width: 200px;
    transform: translate(-50%, 0%);
    background-color: var(--bg-color);
    border-radius: 3px;
    padding-left: 6px;
    padding-right: 6px;
    padding-top: 8px;
    padding-bottom: 8px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    z-index: 1;
}

.title {
    font-size: var(--font-size-note);
    color: var(--color-text-shade2);
}

.valueGroup {
    display: flex;
    align-items: last baseline;
    justify-content: space-between;
}

.label img {
    width: calc(var(--font-size-note) * 0.8);
}

.label {
    color: var(--color-text);
    font-size: var(--font-size-note);
    line-height: 0.9;
    z-index: 1;
}

.value {
    color: var(--color-text);
    font-size: var(--font-size-note);
    z-index: 1;
}

.route {
    width: 10px;
    height: 10px;
    transform-origin: 50% 50%;
    border-radius: 3px;
    transform: rotate(0.125turn) translate(-50%, -25%);
    background-color: var(--bg-color);
    position: absolute;
    z-index: 0;
}

#energyGroup {
    margin-bottom: 6px;
    padding-bottom: 6px;
    border-bottom: solid var(--color-text-shade3) 1px;
}

@media (prefers-color-scheme: dark) {
    .label img {
        filter: invert(1);
    }
}

@media screen and (max-width: 600px) {
    #popUpContainer {
        min-width: 180px;
        transform: translate(calc(-50% - 25px), 0%);
    }
}
</style>