/**
 * Functionality to create the src data for animated path simulation of a city. 
 */

import { StreetGraph } from "./cityGrid"
import { getLengthOfPath, randomSeeded } from "./utilities"

export type PathSimulationAnimation = Array<simulatedPathAnimated>
export type simulatedPathAnimated = {
    startTime: number,
    pathLength: number,
    coordinates: Array<[number, number]>,
    path: string[]
}

/**
 * Converts a list of paths, to paths with coordinates and a start times 
 * Updates the graphs edge attribute `simulationState` to the new simulation
 * @param graph 
 * @param paths list of paths, where each path is a list of nodes ids.
 * @param lastPathEnd 
 * @returns 
 */
export function getPathSimulationAnimation(graph: StreetGraph, paths: Array<string[]>, lastPathEnd: number, walkingTimePerDistance: number): PathSimulationAnimation {
    // const coordinatesListAllPaths = coordinatesListFromPath(graph, paths)
    const animatedPaths: PathSimulationAnimation = []
    for (let i = 0; i < paths.length; i++) {
        const path = paths[i]
        const pathLength = getLengthOfPath(graph, path)
        animatedPaths.push({
            startTime: Math.max(randomSeeded(0.837575 + i) * lastPathEnd - pathLength * walkingTimePerDistance, 0),
            coordinates: coordinatesListFromPath(graph, path),
            pathLength: pathLength,
            path: path
        })
    }

    // Updating the simulation state of the graph 
    for (let j = 0; j < animatedPaths.length; j++) {
        const animatedPath = animatedPaths[j]
        for (let i = 1; i < animatedPath.path.length; i++) {
            const vj = animatedPath.path[i]
            const vi = animatedPath.path[i - 1]
            const edge = graph.edge(vi, vj)

            const preSimulationState = graph.getEdgeAttribute(edge, 'simulationState')
            graph.setEdgeAttribute(
                edge,
                'simulationState',
                {
                    usedByNumPaths: preSimulationState.usedByNumPaths + 1,
                    accumulatedLengthPaths: preSimulationState.accumulatedLengthPaths + animatedPath.pathLength
                }
            )
        }
    }
    return animatedPaths
}

/**
 * Converts a List of sequences of node ids to a lost of sequence of coordinates
 */
function coordinatesListFromPath(graph: StreetGraph, path: string[]): Array<[number, number]> {
    // const coordinatesList: Array<Array<[number, number]>> = []
    let coordPath: Array<[number, number]> = []
    path.forEach(nodeId => {
        coordPath.push([
            graph.getNodeAttribute(nodeId, 'x'),
            graph.getNodeAttribute(nodeId, 'y'),
        ])
    })
    return coordPath
}


/**
 * To get the current coordinates along a path at current time 
 */
export function getCoordinatesOfAgent(graph: StreetGraph, animatedPath: simulatedPathAnimated, overallAnimationStartTime: number, currentTime: number, speed: number): [number, number] {
    let walkedPathLength = 0
    let currentSegment = -1
    for (let i = 1; i < animatedPath.path.length; i++) {
        walkedPathLength += graph.getEdgeAttribute(animatedPath.path[i - 1], animatedPath.path[i], 'length')
        if (overallAnimationStartTime + animatedPath.startTime + walkedPathLength * speed >= currentTime) {
            currentSegment = i
            i = animatedPath.path.length
        }
    }
    if (currentSegment >= 0) {
        const n1: [number, number] = [
            graph.getNodeAttribute(animatedPath.path[currentSegment - 1], 'x'),
            graph.getNodeAttribute(animatedPath.path[currentSegment - 1], 'y')
        ]
        const n2: [number, number] = [
            graph.getNodeAttribute(animatedPath.path[currentSegment], 'x'),
            graph.getNodeAttribute(animatedPath.path[currentSegment], 'y')
        ]
        const timeN2 = overallAnimationStartTime + animatedPath.startTime + walkedPathLength * speed
        const timeN1 = overallAnimationStartTime + animatedPath.startTime + (walkedPathLength - graph.getEdgeAttribute(animatedPath.path[currentSegment - 1], animatedPath.path[currentSegment], 'length')) * speed
        const timePassedSinceSegmentStart = currentTime - timeN1
        const deltaTime = timeN2 - timeN1

        let k = timePassedSinceSegmentStart / deltaTime
        if (k < 0 || k > 1) {
            return [0, 0]
        }

        return [
            (1 - k) * n1[0] + k * n2[0],
            (1 - k) * n1[1] + k * n2[1],
        ]
    }
    return [0, 0]
}

/**
 * To check if the agent corresponding to an animated path, is currently traveling
 */
export function isPathCurrentlyActive(path: simulatedPathAnimated, currentTime: number, timePerDistance: number): boolean {
    return currentTime > path.startTime && path.startTime + path.pathLength * timePerDistance > currentTime
}