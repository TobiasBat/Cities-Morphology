import { vec3 } from 'gl-matrix';
import * as THREE from 'three';

/**
 * Formats three colors as color value matrix. 
 * Colors are converted from SRGB to Linear color space 
 * @param colors 
 */
export function getRangeLinearColor(colors: [string, string, string]): Array<[number, number, number]> {
    const color1 = new THREE.Color().setStyle(colors[0], THREE.SRGBColorSpace).convertSRGBToLinear()
    const color2 = new THREE.Color().setStyle(colors[1], THREE.SRGBColorSpace).convertSRGBToLinear()
    const color3 = new THREE.Color().setStyle(colors[2], THREE.SRGBColorSpace).convertSRGBToLinear()

    return [
        [color1.r, color1.g, color1.b],
        [color2.r, color2.g, color2.b],
        [color3.r, color3.g, color3.b]
    ]
}

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
    if (k <= domain[0]) return range[0]
    if (k >= domain[domain.length - 1]) return range[range.length - 1]

    for (let j = 1; j < domain.length; j++) {
        if (k <= domain[j]) {
            const di = domain[j - 1]
            const dj = domain[j]
            const delta = dj - di
            const k_ = k - di
            let t = Math.max(Math.min(k_ / delta, 1), 0)

            const ri = vec3.fromValues(range[j - 1][0], range[j - 1][1], range[j - 1][2])
            const rj = vec3.fromValues(range[j][0], range[j][1], range[j][2])
            const out = vec3.create()
            vec3.lerp(out, ri, rj, t)
            return [out[0], out[1], out[2]]
        }
    }
    return [0, 0, 0]
}