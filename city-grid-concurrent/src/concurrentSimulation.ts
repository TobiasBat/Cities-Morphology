/**
 * Functionality to create path simulations asynchronously in a webworker. 
 */

import { CityGrid, CityInputParameters, CityParameters, NumberPathVariationOptions, PathSimulation, PathSimulationVariationResult } from 'city-grid'
import { CityGridSimulationWorkerCommand } from './cityGridSimulationWorkerCommand'
import CityGirdSimWorker from './cityGridSimulation.worker?worker&inline'

/**
 * Concurrent version of computePathSimulationVariations
 * computes the metric for #steps simulation. Fixating all parameters except valueToBeAltered, 
 * and alters just this parameter
 * 
 * Computes each variation in an separate web worker
 * 
 * @param currentParameters base parameters, without altering anything 
 * @param valueToBeAltered the parameter that should be altered in the sequence 
 * @param values numeric values for the parameter that will be altered
 * @param numberOfPaths s number of paths for the simulation and if it is given as a absolute number or a share of the population
 * @returns 
 */
export function computePathSimulationVariationsConcurrent(currentParameters: CityInputParameters, valueToBeAltered: keyof CityInputParameters, values: number[], numberOfPaths: NumberPathVariationOptions): Promise<PathSimulationVariationResult[]> {
    return new Promise((resolve) => {
        const results = [] as PathSimulationVariationResult[]

        for (let i = 0; i < values.length; i++) {
            const value = values[i]
            const parameters = JSON.parse(JSON.stringify(currentParameters)) as CityInputParameters
            parameters[valueToBeAltered] = value

            const worker = new CityGirdSimWorker()
            const workerData: CityGridSimulationWorkerCommand = {
                function: 'pathSimulationFromParameters',
                arguments: [parameters, numberOfPaths]
            }

            worker.postMessage(workerData)
            worker.onmessage = (e: any) => {
                const simResult = e.data
                results.push({
                    alteredValue: valueToBeAltered,
                    value: value,
                    pathSimulationMetrics: simResult.simulation.metrics,
                    cityStats: simResult.grid.stats,
                    numPaths: simResult.numPaths
                })
                worker.terminate()
                complete()
            }
        }

        function complete() {
            if (results.length === values.length) {
                resolve(results)
            }

        }
    })
}

/**
 * Wrapper around computePathSimulationVariations to compute the path sim variation in an webworker
 * In the worker each simulation is computed after each other
 * 
 * computes the metric for #steps simulation. Fixating all parameters except valueToBeAltered, 
 * and alters just this parameter
 * 
 * @param currentParameters current parameters of the simulation. Only alters valueToBeAlters 
 * @param valueToBeAltered value to be altered 
 * @param values values that are used for each alteration
 * @param numberOfPaths number of paths for the simulation and if it is given as a absolute number or a share of the population
 * @param manhattanDistance in case false, shortest paths are computed and routed through network. Distance is than computed based on summing the lengths of 
 * the actual paths. In case of true, no paths are computed, just pairs of start/end points and the manhattan distance between those points is used 
 * for the path simulation metrics. Metric are equal for booth option in case of quad-mesh with quadratic surfaces. Default is False.
 * @returns the metrics of all the simulations
 */
export function computePathSimulationVariationsWorker(currentParameters: CityInputParameters, valueToBeAltered: keyof CityParameters, values: number[], numberOfPaths: NumberPathVariationOptions, manhattanDistance?: boolean): Promise<PathSimulationVariationResult[]> {
    return new Promise((resolve) => {
        const worker = new CityGirdSimWorker()
        const workerData: CityGridSimulationWorkerCommand = {
            function: 'computePathSimulationVariations',
            arguments: [currentParameters, valueToBeAltered, values, numberOfPaths, manhattanDistance]
        }

        worker.postMessage(workerData)
        worker.onmessage = (e: any) => {
            resolve(e.data)
            worker.terminate()
        }
    })
}

/**
 * Computes a path simulation from parameters. Runs in a webworker
 * @param parameters parameters for the city to be simulated
 * @param numberOfPaths number of paths for the simulation and if it is given as a absolute number or a share of the population
 * @param directDistance in case false, shortest paths are computed and routed through network. Distance is than computed based on summing the lengths of 
 * the actual paths. In case of true, no paths are computed, just pairs of start/end points and the manhattan distance between those points is used 
 * for the path simulation metrics. Metric are equal for booth option in case of quad-mesh with quadratic surfaces. Default is False.
 * @returns 
 */
export function pathSimulationFromParametersWorker(parameters: CityInputParameters, numberOfPaths: NumberPathVariationOptions, directDistance?: boolean): Promise<{
    numPaths: number;
    simulation: PathSimulation;
    grid: CityGrid
}> {
    return new Promise((resolve) => {
        const worker = new CityGirdSimWorker()
        const workerData: CityGridSimulationWorkerCommand = {
            function: 'pathSimulationFromParameters',
            arguments: [parameters, numberOfPaths, directDistance]
        }
        worker.postMessage(workerData)
        worker.onmessage = (e: any) => {
            resolve(e.data)
            worker.terminate()
        }
    })
}

