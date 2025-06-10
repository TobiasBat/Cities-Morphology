/**
 * Script to compute the average travel distance and total distance for user defined parameter. 
 * Enter parameters via command line one by one 
 * Default resembles vienna 
 */
import { pathSimulationFromParameters } from 'city-grid';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { NUMBER_OF_SAMPLES } from './options.js';

console.log('Computing avg. travel distance for a City: ')

const PARM = {
    residents: 2000000,
    personsPerBuilding: 11.38,
    sprawl: 21.2,
    areaPerResident: 38,
    floors: 3,
    elongation: 1.5,
    heightParameter: 1.2
}
const rl = readline.createInterface({ input, output });

function isNumberInput(value: string) {
    return !isNaN(+value) && value !== ''
}

const _res = await rl.question(`Population [${PARM.residents}] `)
if (isNumberInput(_res))
    PARM.residents = +_res

const _sprawl = await rl.question(`Sprawl [${PARM.sprawl}] `);
if (isNumberInput(_sprawl))
    PARM.sprawl = +_sprawl

const _persPerB = await rl.question(`Persons per Building [${PARM.personsPerBuilding}] `)
if (isNumberInput(_persPerB))
    PARM.personsPerBuilding = +_persPerB

const _area = await rl.question(`Area per Resident [${PARM.areaPerResident}] `)
if (isNumberInput(_area))
    PARM.areaPerResident = +_area

const _floors = await rl.question(`Average number of Floors [${PARM.floors}] `)
if (isNumberInput(_floors))
    PARM.floors = +_floors

const _el = await rl.question(`Elongation [${PARM.elongation}] `)
if (isNumberInput(_el))
    PARM.elongation = +_el

const _profile = await rl.question(`Profile [${PARM.heightParameter}] `)
if (isNumberInput(_profile))
    PARM.heightParameter = +_profile


let agents = NUMBER_OF_SAMPLES
const _agents = await rl.question(`Number of Agents [${agents.value}] `)
if (isNumberInput(_agents))
    agents.value = Math.round(+_agents)
rl.close();


console.log('\nComputing for: ')
console.log(PARM)
console.log('Agents: ', agents)

const result = pathSimulationFromParameters(PARM, NUMBER_OF_SAMPLES, true);

console.log('Results: ')
console.log(`\nAvg. distance: ${Math.round(result.simulation.metrics.averageDistance)} m`)
console.log(`Total. distance: ${Math.round(result.simulation.metrics.totalDistance)} m`)
console.log(`Number of Houses: ${Math.round(result.grid.properties.length)}`)
console.log('Citys major, minor axis:')
console.log(`   ${Math.round(result.grid.shape.majorAxis)} m`)
console.log(`   ${Math.round(result.grid.shape.minorAxis)} m\n`)

