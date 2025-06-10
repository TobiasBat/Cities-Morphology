/**
 * Variation experiment where each city parameter is altered one by one. 
 * Uses vienna as default and computes 100 variation for each individual parameter.
 */

import { CityInputParameters, computePathSimulationVariations } from 'city-grid'
import * as fs from 'fs';
import { getTimeStamp, ObjectArrayToCSVString, range } from './utilitis.js';
import { MANHATTAN_DISTANCE, NUMBER_OF_SAMPLES } from './options.js';
import { getViennaCityParameters } from './vienna.js';

const startApp = Date.now()
const NUMBER_OF_VARIATIONS = 100
const viennaParm = getViennaCityParameters()
const variationTrials = [
    {
        base: viennaParm,
        valueToBeAltered: undefined as keyof CityInputParameters | undefined,
        values: [viennaParm.elongation]
    },
    {
        base: viennaParm,
        valueToBeAltered: 'sprawl' as keyof CityInputParameters,
        values: range(0, 60, NUMBER_OF_VARIATIONS)
    },
    {
        base: viennaParm,
        valueToBeAltered: 'residents' as keyof CityInputParameters,
        values: range(20000, 10000000, NUMBER_OF_VARIATIONS)
    },
    {
        base: viennaParm,
        valueToBeAltered: 'elongation' as keyof CityInputParameters,
        values: range(1, 5, NUMBER_OF_VARIATIONS)
    },
    {
        base: viennaParm,
        valueToBeAltered: 'floors' as keyof CityInputParameters,
        values: range(1, 20, NUMBER_OF_VARIATIONS)
    },
    {
        base: viennaParm,
        valueToBeAltered: 'heightParameter' as keyof CityInputParameters,
        values: range(-20.0, 20.0, NUMBER_OF_VARIATIONS)
    },
    {
        base: viennaParm,
        valueToBeAltered: 'personsPerBuilding' as keyof CityInputParameters,
        values: range(1, 600, NUMBER_OF_VARIATIONS)
    },
    {
        base: viennaParm,
        valueToBeAltered: 'areaPerResident' as keyof CityInputParameters,
        values: range(10, 100, NUMBER_OF_VARIATIONS)
    }
]


console.log('Running experiment with base parameters:\n', JSON.stringify(variationTrials[0], undefined, 2))
const variationsResults: any[] = []
for (let i = 0; i < variationTrials.length; i++) {
    const run = variationTrials[i]

    for (let j = 0; j < run.values.length; j++) {
        const startRun = Date.now()

        const parm = structuredClone(run.base)

        if (run.valueToBeAltered)
            parm[run.valueToBeAltered] = run.values[j]

        const result = computePathSimulationVariations(
            run.base,
            run.valueToBeAltered ? run.valueToBeAltered : 'elongation',
            [run.values[j]],
            NUMBER_OF_SAMPLES,
            MANHATTAN_DISTANCE
        )

        // Parse the results
        result.forEach(r => {
            const keys = Object.keys(parm)
            const values = Object.values(parm)
            for (let i = 0; i < keys.length; i++) {
                r[keys[i]] = values[i]
            }
        })
        result.forEach(r => r.alteredValue = run.valueToBeAltered)
        result.forEach(r => r['manhattanDistance'] = MANHATTAN_DISTANCE)
        result.forEach(r => r['averageDistance'] = r.pathSimulationMetrics.averageDistance / 1000)
        result.forEach(r => r['area'] = Math.round(r.cityStats.area))
        result.forEach(r => r['ellipseArea'] = Math.round(r.cityStats.ellipseArea))
        // result.forEach(r => r['sprawl'] = -1)
        result.forEach(r => delete r.pathSimulationMetrics)
        result.forEach(r => delete r.cityStats)
        result.forEach(r => variationsResults.push(r))

        console.log(`${i}/${variationTrials.length - 1}(${j}) Done –`, run.valueToBeAltered, Math.round((Date.now() - startRun) / 600) / 100)
    }
}

const time = getTimeStamp()
fs.writeFileSync(`./out/results-variations-${viennaParm.residents}-${time}.json`, JSON.stringify(variationsResults))
fs.writeFileSync(`./out/results-variations-${viennaParm.residents}-${time}.csv`, ObjectArrayToCSVString(variationsResults))

console.log('Done', Math.round((Date.now() - startApp) / 600) / 100, ' Minutes')
