import * as THREE from 'three';
import { LineMaterial } from 'three/examples/jsm/Addons.js'
import { getRangeLinearColor } from './utility';

export function defaultProperties() {
    return {
        minZoom: 100,
        maxZoom: 2000,

        dolly: true,
        prettyShadows: false,
        debug: false,
        relativeTruckOffset: [0, 0],
        relativeTruckOffsetMobile: [0, 0],
        render: true,
        simulation_last_path_end: 10,
        playSimulation: true,
        loop: true,

        walkingTimePerDistance: 0.02,
        updateLabelsPosition: true,

        streetWidth: 5,

        homePerspective: {
            azimuth: Math.PI * 0.25,
            polar: Math.PI * 0.2//0.35 //0.2
        },

        cityColors: {
            properties: [1, 1, 1],
            main: [1, 1, 1],
            street: [180 / 255, 180 / 255, 180 / 255],
            groundPlane: [1, 1, 1],//[0.8, 0.8, 0.8], // TODO back to white
            groundPlaneDark: [80 / 255, 80 / 255, 80 / 255],
            roofColor: [0.75, 0.75, 0.75],
            windowColor: [0.6, 0.6, 0.6]
        } as { [key: string]: [number, number, number] },
        heatmap: {
            domain: [50, 175, 300] as [number, number, number],
            range: getRangeLinearColor(['#C3C9FF', '#FFCE84', '#F7432B'])
        },
        agent: {
            domain: [50, 175, 300] as [number, number, number],
            range: getRangeLinearColor(['#C3C9FF', '#FFCE84', '#F7432B'])
        }
    }
}

export namespace CityMaterials {
    export function heatMap() {
        return new LineMaterial({
            linewidth: 1.2,
            worldUnits: true,
            opacity: 1.0,
            transparent: false,
            vertexColors: true
        })
    }

    export function street(color?: [number, number, number]) {
        return new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(color ? toRGBString(color) : 'rgb(180, 180, 180)'),
            roughness: 0.5
        })
    }

    export function building(color?: [number, number, number]) {
        return new THREE.MeshPhysicalMaterial({
            roughness: 0.5,
            metalness: 0.2,
            transparent: true,
            opacity: 1.0,
            clearcoat: .3,
            clearcoatRoughness: 0.5,
            vertexColors: true,
            color: new THREE.Color(color ? toRGBString(color) : 'rgb(255, 255, 255)'),
        })

    }

    export function properties(color?: [number, number, number]) {
        return new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(color ? toRGBString(color) : 'rgb(255, 255, 255)'),
        })
    }

    export function ground(options?: { color?: [number, number, number], envMap?: THREE.Texture | undefined | null }) {
        return new THREE.MeshPhysicalMaterial({
            color: options?.color ? toRGBString(options.color) : toRGBString([1, 1, 1]),
            side: THREE.FrontSide,
            transparent: false,
            metalness: 0.0,
            reflectivity: 0.0,
            roughness: 1.0,

            alphaHash: true,
            envMap: options?.envMap
        });
    }

    export function agents() {
        return new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            transparent: true
        })
    }
}

export function toRGBString(color: [number, number, number]) {
    return `rgb(${Math.round(color[0] * 255)}, ${Math.round(color[1] * 255)}, ${Math.round(color[2] * 255)})`
}