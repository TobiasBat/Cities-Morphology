import { vec3 } from "gl-matrix";

/**
 * Simple hash function that takes a seed as a number 
 * @param seed 
 * @returns number between 0 and 1
 */
export function randomSeeded(seed: number): number {
    const s = Math.sin(seed) * 10000;
    return s - Math.floor(s);
}

/**
 * multi step scale linear. domain.length === range.length
 * @param domain 
 * @param range 
 * @param k interpolation value.
 * @returns value of range depending of k
 */
export function scaleLinear(domain: number[], range: Array<[number, number, number]>, k: number): [number, number, number] {
    if (range.length != domain.length) {
        console.error('domain and range must have equal length')
        return range[0]
    }
    if (k < domain[0]) return range[0]
    if (k > domain[domain.length - 1]) return range[range.length - 1]

    for (let j = 1; j < domain.length; j++) {
        if (k < domain[j]) {
            const di = domain[j - 1]
            const dj = domain[j]
            const delta = dj - di
            const k_ = k - di
            const t = k_ / delta

            const ri = vec3.fromValues(range[j - 1][0], range[j - 1][1], range[j - 1][2])
            const rj = vec3.fromValues(range[j][0], range[j][1], range[j][2])
            const out = vec3.create()
            vec3.lerp(out, ri, rj, t)
            return [out[0], out[1], out[2]]
        }
    }
    return [0, 0, 0]
}