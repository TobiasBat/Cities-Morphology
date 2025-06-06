import { StreetGraph } from "./cityGrid";

/**
 * Simple hash function that takes a seed as a number 
 * @param seed 
 * @returns number between 0 and 1
 */
export function randomSeeded(seed: number): number {
    const s = Math.sin(seed) * 10000;
    return s - Math.floor(s);
}

export function getLengthOfPath(graph: StreetGraph, path: string[]): number {
    let l = 0
    for (let i = 1; i < path.length; i++) {
        l += graph.getEdgeAttribute(path[i - 1], path[i], 'length')
    }
    return l
}