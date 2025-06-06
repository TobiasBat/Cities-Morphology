/**
 * Functions to create a simulation for a provided CityGrid
 */

import { dijkstra } from 'graphology-shortest-path'
import {
    ellipticalGridFromCityParameters,
    getNodeWeights, type CityGrid,
    type CityParameters, type CityStats,
    type StreetGraph
} from './cityGrid'
import { getLengthOfPath, randomSeeded } from './utilities'

export type CityInputParameters = {
    residents: number,
    personsPerBuilding: number,
    sprawl: number,
    areaPerResident: number,
    floors: number,
    elongation: number,
    heightParameter: number
}
export type PathSimulation = { metrics: PathSimulationMetrics, paths: Array<string[]> }
export type PathSimulationMetrics = {
    averageDistance: number,
    totalDistance: number
}
export type PathSimulationVariationResult = {
    alteredValue: keyof CityParameters,
    value: number,
    pathSimulationMetrics: PathSimulationMetrics,
    cityStats: CityStats,
    numPaths: number
}
export type NumberPathVariationOptions = {
    value: number,
    type: 'absolute' | 'share'
}

/**
 * Creates a set of shortest paths between random pairs of nodes of a Street Graph. 
 * Computes the avg. and total distance of the computed paths. 
 * @param graph 
 * @param numberOfPaths total number of paths in city
 * @param nodeWeights a weight for each nodeId for how likely it is to be picked as a start and endpoint. 
 * must be > 0 and can be larger than 1; if not provided, each node is picked equal likely
 * @param directDistance in case false, shortest paths are computed and routed through network. Distance is than computed based on summing the lengths of 
 * the actual paths. In case of true, no paths are computed, just pairs of start/end points and the manhattan distance between those points is used 
 * for the path simulation metrics. Metric are equal for booth option in case of quad-mesh with quadratic surfaces. Default is False.
 * @returns List of sequences of node ids. Each sequence represents a shortest path
 */
export function randomPathSimulation(graph: StreetGraph, numberOfPaths: number, nodeWeights: { [id: string]: number }, directDistance?: boolean): PathSimulation {
    let allNodes = graph.nodes()

    if (nodeWeights) {
        const nodes = graph.nodes()
        let precision = 100
        if (nodes.length * precision >= 2 ** 27) {
            precision = Math.floor((2 ** 26) / nodes.length)
            console.log('reduced the precision of random pick to', precision, 'instead of 100')
        }

        // Getting the max number of required elements 
        let elements = 0
        for (let i = 0; i < nodes.length; i++) {
            const nodeId = nodes[i]
            const numElement = Math.floor(nodeWeights[nodeId] * precision)
            elements += numElement
        }

        allNodes = new Array(elements)

        let index = 0
        for (let i = 0; i < nodes.length; i++) {
            const nodeId = nodes[i]
            const numElement = Math.floor(nodeWeights[nodeId] * precision)
            for (let j = 0; j < numElement; j++) {
                allNodes[index] = nodeId
                index++
            }
        }
    }

    if (allNodes.length < 0) console.error('Graph has no nodes')

    const startEndNodes: Array<[string, string]> = []

    for (let i = 0; i < numberOfPaths; i++) {
        // hardcoded seed to result in the same very time it is running
        const r1 = Math.floor(randomSeeded(0.30409594 + i) * allNodes.length)
        const r2 = Math.floor(randomSeeded(320.320454 + i) * allNodes.length)
        startEndNodes.push(
            [allNodes[r1], allNodes[r2]]
        )
    }
    if (directDistance)
        return pathSimulationDirectDistance(graph, startEndNodes)
    return pathSimulation(graph, startEndNodes)
}

/**
 * Computes paths between user defined start and endpoints
 * @param graph 
 * @param startEndPoints array of start and end points [[start1, start2], […] …]
 * @returns metric.averageDistance and metric.total distance computed by the sum of the lengths of the 
 *          edges of the shortest paths; List of sequences of node ids. Each sequence represents a shortest path
 */
export function pathSimulation(graph: StreetGraph, startEndPoints: Array<[string, string]>): PathSimulation {
    const paths: Array<string[]> = new Array<string[]>(startEndPoints.length)

    let allNodes = graph.nodes()
    if (allNodes.length < 0) console.error('Graph has no nodes')

    for (let i = 0; i < startEndPoints.length; i++) {
        const points = startEndPoints[i]
        if (graph.hasNode(points[0]) && graph.hasNode(points[1])) {
            const path = dijkstra.bidirectional(graph, points[0], points[1], 'length')
            if (path) {
                paths[i] = path
            } else {
                console.log('could not fine a path', path, points[0], points[1])
            }
        } else {
            console.log('Node is not defined', points[0], points[1])
        }
    }

    let totalDistance = 0
    for (let i = 0; i < paths.length; i++) {
        totalDistance += getLengthOfPath(graph, paths[i])
    }
    const averageDistance = paths.length > 0 ? totalDistance / paths.length : 0

    return {
        metrics: {
            averageDistance: averageDistance,
            totalDistance: totalDistance
        },
        paths: paths
    }
}

/**
 * Computes the direct distance between the start and endpoints. Creates no paths. 
 * @param graph 
 * @param startEndPoints array of start and end points [[start1, start2], […] …]
 * @returns metric.averageDistance and metric.total distance computed based on the Manhattan distance between  
 *          the start and end points. paths = [] — no paths are created
 */
export function pathSimulationDirectDistance(graph: StreetGraph, startEndPoints: Array<[string, string]>): PathSimulation {
    let totalDirectDistance = 0
    let allNodes = graph.nodes()
    if (allNodes.length < 0) console.error('Graph has no nodes')

    for (let i = 0; i < startEndPoints.length; i++) {
        const points = startEndPoints[i]
        if (graph.hasNode(points[0]) && graph.hasNode(points[1])) {
            const attrI = graph.getNodeAttributes(points[0])
            const attrJ = graph.getNodeAttributes(points[1])

            const delta = [
                attrI.x - attrJ.x,
                attrI.y - attrJ.y
            ]

            const distance = Math.abs(delta[0]) + Math.abs(delta[1]) //Math.sqrt(delta[0] ** 2 + delta[1] ** 2)
            totalDirectDistance += distance
        }
    }

    return {
        metrics: {
            averageDistance: totalDirectDistance / startEndPoints.length,
            totalDistance: totalDirectDistance
        },
        paths: []
    }
}

/**
 * Computes and appends simulations states to each edge 
 * updates 'simulationState' for each edge of @param graph
 * @param graph streetGraph of the simulation
 * @param paths paths of the simulation. Each path given as a array of vertex ids
 */
export function computeEdgeSimulationState(graph: StreetGraph, paths: Array<string[]>) {
    // resetting stats 
    const edges = graph.edges()
    for (let i = 0; i < edges.length; i++) {
        graph.setEdgeAttribute(edges[i],
            'simulationState',
            {
                usedByNumPaths: 0,
                accumulatedLengthPaths: 0
            }
        )
    }

    for (let j = 0; j < paths.length; j++) {
        const path = paths[j]
        const pathLength = getLengthOfPath(graph, path)
        for (let i = 1; i < path.length; i++) {
            const vj = path[i]
            const vi = path[i - 1]
            const edge = graph.edge(vi, vj)

            const preSimulationState = graph.getEdgeAttribute(edge, 'simulationState')
            graph.setEdgeAttribute(
                edge,
                'simulationState',
                {
                    usedByNumPaths: preSimulationState.usedByNumPaths + 1,
                    accumulatedLengthPaths: preSimulationState.accumulatedLengthPaths + pathLength
                }
            )
        }
    }
}

/**
 * Creates a path simulation form parameters. First creates a city, than a corresponding path sim. 
 * @param parameters parameters for the city, the is used for the simulation 
 * @param numberOfPaths number of paths for the simulation and if it is given as a absolute number or a share of the population
 * @param directDistance in case false, shortest paths are computed and routed through network. Distance is than computed based on summing the lengths of 
 * the actual paths. In case of true, no paths are computed, just pairs of start/end points and the manhattan distance between those points is used 
 * for the path simulation metrics. Metric are equal for booth option in case of quad-mesh with quadratic surfaces. Default is False.
 * @returns 
 */
export function pathSimulationFromParameters(parameters: Readonly<CityInputParameters>, numberOfPaths: NumberPathVariationOptions, directDistance?: boolean): { numPaths: number, simulation: PathSimulation, grid: CityGrid } {
    const gird = ellipticalGridFromCityParameters(
        parameters.residents,
        parameters.personsPerBuilding,
        parameters.floors,
        parameters.sprawl,
        parameters.areaPerResident,
        parameters.elongation,
        parameters.heightParameter
    )

    const weights = getNodeWeights(gird)
    const absoluteNumberOfPaths = numberOfPaths.type === 'share' ?
        Math.ceil(parameters.residents * numberOfPaths.value) : numberOfPaths.value
    const sim = randomPathSimulation(gird.streetGraph, absoluteNumberOfPaths, weights, directDistance)

    return {
        grid: gird,
        numPaths: absoluteNumberOfPaths,
        simulation: sim
    }
}

/**
 * To create a sequence of simulation, where one parameter is altered from a base parameter set 
 * @param currentParameters base parameters, without altering anything 
 * @param valueToBeAltered the parameter that should be altered in the sequence 
 * @param values numeric values for the parameter that will be altered
 * @param numberOfPaths number of paths for the simulation and if it is given as a absolute number or a share of the population.
 * @param directDistance in case false, shortest paths are computed and routed through network. Distance is than computed based on summing the lengths of 
 * the actual paths. In case of true, no paths are computed, just pairs of start/end points and the manhattan distance between those points is used 
 * for the path simulation metrics. Metric are equal for booth option in case of quad-mesh with quadratic surfaces. Default is False.
 * @returns 
 */
export function computePathSimulationVariations(currentParameters: CityInputParameters, valueToBeAltered: keyof CityInputParameters, values: number[], numberOfPaths: NumberPathVariationOptions, directDistance?: boolean): PathSimulationVariationResult[] {
    const results = [] as PathSimulationVariationResult[]

    for (let i = 0; i < values.length; i++) {
        const value = values[i]
        const parameters = structuredClone(currentParameters)

        parameters[valueToBeAltered] = value
        const simResult = pathSimulationFromParameters(parameters, numberOfPaths, directDistance)
        const stats = simResult.grid.stats
        const simMetrics = simResult.simulation.metrics
        results.push({
            alteredValue: valueToBeAltered,
            value: value,
            pathSimulationMetrics: simMetrics,
            cityStats: stats,
            numPaths: simResult.numPaths
        })
    }
    return results
}