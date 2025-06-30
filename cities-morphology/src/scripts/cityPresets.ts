import type { CityInputParameters } from "city-grid";

export const CITY_PRESETS: { [option: string]: { label: string, parameters: CityInputParameters } } = {
    SMALL_DENSE: {
        label: 'Compact Town',
        parameters: {
            residents: 600,
            personsPerBuilding: 10,
            sprawl: 7,
            areaPerResident: 10,
            floors: 3,
            elongation: 1,
            heightParameter: 0.2
        }
    },
    SMALL_SPRAWL: {
        label: 'Suburb Town',
        parameters: {
            residents: 600,
            personsPerBuilding: 3,
            sprawl: 18,
            areaPerResident: 10,
            floors: 2,
            elongation: 1,
            heightParameter: 0.2
        }
    },
    LARGE_SPRAWL: {
        label: 'Suburb',
        parameters: {
            residents: 1500,
            personsPerBuilding: 3,
            sprawl: 40,
            areaPerResident: 10,
            floors: 2,
            elongation: 1,
            heightParameter: 0
        }
    },
    LARGE_DENSE: {
        label: 'Dense City Center',
        parameters: {
            residents: 1500,
            personsPerBuilding: 25,
            sprawl: 6,
            areaPerResident: 10,
            floors: 9,
            elongation: 1,
            heightParameter: 0
        }
    },
    CIRCULAR: {
        label: 'Circular',
        parameters: {
            residents: 1200,
            personsPerBuilding: 12,
            sprawl: 10,
            areaPerResident: 10,
            floors: 6,
            elongation: 1,
            heightParameter: 0.5
        }
    },
    ELONGATED: {
        label: 'Elongated',
        parameters: {
            residents: 1200,
            personsPerBuilding: 12,
            sprawl: 10,
            areaPerResident: 10,
            floors: 6,
            elongation: 2.5,
            heightParameter: 0.5
        }
    },
    PANCAKE: {
        label: 'Pancake',
        parameters: {
            residents: 2000,
            personsPerBuilding: 20,
            sprawl: 8,
            areaPerResident: 10,
            floors: 7,
            elongation: 1,
            heightParameter: 0.0
        }
    },
    PYRAMID: {
        label: 'Pyramid',
        parameters: {
            residents: 2000,
            personsPerBuilding: 20,
            sprawl: 8,
            areaPerResident: 10,
            floors: 7,
            elongation: 1,
            heightParameter: 3
        }
    },
    NEEDLE: {
        label: 'Needle',
        parameters: {
            residents: 2000,
            personsPerBuilding: 20,
            sprawl: 8,
            areaPerResident: 10,
            floors: 7,
            elongation: 1,
            heightParameter: 6
        }
    },
    BOWL: {
        label: 'Bowl',
        parameters: {
            residents: 2000,
            personsPerBuilding: 20,
            sprawl: 8,
            areaPerResident: 10,
            floors: 7,
            elongation: 1,
            heightParameter: -3
        }
    },
    RING: {
        label: 'Ring',
        parameters: {
            residents: 2000,
            personsPerBuilding: 20,
            sprawl: 8,
            areaPerResident: 10,
            floors: 7,
            elongation: 1,
            heightParameter: -7
        }
    },
}


export function getCityPresets() {
    const layoutPresets: Array<{ value: string, label: string }> = []
    Object.keys(CITY_PRESETS).forEach(key => {
        layoutPresets.push({
            value: key,
            label: CITY_PRESETS[key].label
        })
    })
    return layoutPresets
}