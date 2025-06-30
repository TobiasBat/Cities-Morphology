/**
 * Functions to get geometry for a CityGrid
 */

import { type CityGrid, type StreetGraph, getHousePositionFromProperty } from "city-grid";
import { vec3 } from "gl-matrix";
import { randomSeeded, scaleLinear } from "./utility";

/**
 * To get vertices of the properties of a city with a certain street width
 * @param cityGrid city grid that is base of the vis.
 * @param streetWidth space between the individual properties.
 * @returns a array of number, representing the vertex coordinates of the individual properties.
 */
export function propertiesGeometry(cityGrid: CityGrid, streetWidth: number): Float32Array {
    // 3 values per node * 3 vertices per triangle, 2 triangles per property
    const numValuesPerFace = 3 * 3 * 2
    const propHeight = 0.5
    const vertices = new Float32Array(numValuesPerFace * 6 * cityGrid.properties.length)
    for (let i = 0; i < cityGrid.properties.length; i++) {
        const property = cityGrid.properties[i]
        let v0 = vec3.fromValues(
            cityGrid.streetGraph.getNodeAttribute(property[0], 'y'), 0,
            cityGrid.streetGraph.getNodeAttribute(property[0], 'x')
        )
        let v1 = vec3.fromValues(
            cityGrid.streetGraph.getNodeAttribute(property[1], 'y'), 0,
            cityGrid.streetGraph.getNodeAttribute(property[1], 'x')
        )
        let v2 = vec3.fromValues(
            cityGrid.streetGraph.getNodeAttribute(property[2], 'y'), 0,
            cityGrid.streetGraph.getNodeAttribute(property[2], 'x')
        )
        let v3 = vec3.fromValues(
            cityGrid.streetGraph.getNodeAttribute(property[3], 'y'), 0,
            cityGrid.streetGraph.getNodeAttribute(property[3], 'x')
        )

        const centroid = getCentroid([v0, v1, v2, v3])
        const offset = Math.sqrt((streetWidth / 2) ** 2 + (streetWidth / 2) ** 2) * 1.0005
        v0 = moveVertexCloser(v0, centroid, offset)
        v1 = moveVertexCloser(v1, centroid, offset)
        v2 = moveVertexCloser(v2, centroid, offset)
        v3 = moveVertexCloser(v3, centroid, offset)

        // top Vertices 
        const extrude = vec3.fromValues(0, propHeight, 0)
        const v4 = vec3.create()
        const v5 = vec3.create()
        const v6 = vec3.create()
        const v7 = vec3.create()

        vec3.add(v4, v0, extrude)
        vec3.add(v5, v1, extrude)
        vec3.add(v6, v2, extrude)
        vec3.add(v7, v3, extrude)

        addQuadrilateral(vertices, i * 6 * numValuesPerFace + numValuesPerFace * 0, v2, v3, v1, v0)
        addQuadrilateral(vertices, i * 6 * numValuesPerFace + numValuesPerFace * 1, v1, v3, v7, v5)
        addQuadrilateral(vertices, i * 6 * numValuesPerFace + numValuesPerFace * 2, v0, v1, v5, v4)
        addQuadrilateral(vertices, i * 6 * numValuesPerFace + numValuesPerFace * 3, v2, v6, v7, v3)
        addQuadrilateral(vertices, i * 6 * numValuesPerFace + numValuesPerFace * 4, v0, v4, v6, v2)
        addQuadrilateral(vertices, i * 6 * numValuesPerFace + numValuesPerFace * 5, v4, v5, v7, v6)
    }
    return vertices
}

/**
 * To get the geometry of all buildings of a city
 * @param cityGrid city grid that is base of the vis.
 * @param buildingArea footprint of the individual buildings
 * @param colors color vectors for building, roof, windows. Should be already in the right color space and probably with color values ranging from 0-1.
 * @returns array of numbers representing the coordinates of the buildings, and a corresponding array representing the vertex colors of the building.
 */
export function buildingsGeometry(cityGrid: CityGrid, buildingArea: number, colors: { building: vec3, roof: vec3, windows: vec3 }): { positions: Float32Array, vertexColors: Float32Array } {

    const vertices = {
        positions: [] as number[],
        vertexColors: [] as number[]
    }

    if (!cityGrid.cityParameters || !cityGrid.heightValue) {
        return {
            positions: new Float32Array(vertices.positions),
            vertexColors: new Float32Array(vertices.vertexColors)
        }
    }

    const scaleFactorFloors = cityGrid.cityParameters.floors * 3.5
    const applyMinFloorHeight = (n: number) => {
        return n < 3.5 ? 0 : n
    }
    for (let i = 0; i < cityGrid.properties.length; i++) {
        const property = cityGrid.properties[i]
        appendRoofWindowBuildingVertices(
            vertices,
            cityGrid.streetGraph,
            property,
            applyMinFloorHeight(cityGrid.heightValue[i] * scaleFactorFloors),
            buildingArea,
            [0.1, 2.0],
            colors
        )
    }

    return {
        positions: new Float32Array(vertices.positions),
        vertexColors: new Float32Array(vertices.vertexColors)
    }
}

/**
 * creating heatmap geometry and heatmap colors for each street segments of the cityGrid.streetGraph
 * Requires that `simulationState` is computed for each edge
 * @param cityGrid city grid that is base of the vis.
 * @param domain domain.length === range.length
 * @param range colors as array
 * @returns 
 */
export function heatmapGeometry(cityGrid: CityGrid, domain: number[], range: Array<[number, number, number]>, property: 'averageDist' | 'numberPaths'): { positions: Float32Array, vertexColors: Float32Array } | undefined {
    const positions = [] as number[]
    const vertColors = [] as number[]

    const graph = cityGrid.streetGraph

    if (!graph) return

    const z = 1
    const edges = graph.edges()

    for (let i = 0; i < edges.length; i++) {
        const edge = edges[i]
        const vi = graph.source(edge)
        const vj = graph.target(edge)
        const vi_x = graph.getNodeAttribute(vi, 'x')
        const vi_y = graph.getNodeAttribute(vi, 'y')
        const vj_x = graph.getNodeAttribute(vj, 'x')
        const vj_y = graph.getNodeAttribute(vj, 'y')

        const simState = graph.getEdgeAttribute(edge, 'simulationState')
        const value = property === 'averageDist' ?
            (simState.accumulatedLengthPaths / simState.usedByNumPaths) :
            simState.usedByNumPaths
        // let averageDist = simState.accumulatedLengthPaths / simState.usedByNumPaths
        const color = scaleLinear(domain, range, value)

        if (vi_x && vi_y && vj_x && vj_y && color && simState.usedByNumPaths > 0) {
            const ci = color
            positions.push(
                vi_y, z, vi_x,
                vj_y, z, vj_x
            )
            vertColors.push(
                ci[0], ci[1], ci[2],
                ci[0], ci[1], ci[2]
            )
        }

    }

    return {
        positions: new Float32Array(positions),
        vertexColors: new Float32Array(vertColors)
    }
}

/**
 * Vertices of all cells of the city grid. 
 * Two triangles per cell
 * @param cityGrid 
 * @returns 
 */
export function getCellVertices(cityGrid: CityGrid): Float32Array {
    const valuesPerProperty = 3 * 3 * 2
    const values = new Float32Array(valuesPerProperty * cityGrid.properties.length)
    const yCoord = 0.05
    const graph = cityGrid.streetGraph
    for (let i = 0; i < cityGrid.properties.length; i++) {
        const property = cityGrid.properties[i]
        const x0 = graph.getNodeAttribute(property[0], 'x')
        const y0 = graph.getNodeAttribute(property[0], 'y')
        const x1 = graph.getNodeAttribute(property[1], 'x')
        const y1 = graph.getNodeAttribute(property[1], 'y')
        const x2 = graph.getNodeAttribute(property[2], 'x')
        const y2 = graph.getNodeAttribute(property[2], 'y')
        const x3 = graph.getNodeAttribute(property[3], 'x')
        const y3 = graph.getNodeAttribute(property[3], 'y')

        values[i * valuesPerProperty + 0] = y0
        values[i * valuesPerProperty + 1] = yCoord
        values[i * valuesPerProperty + 2] = x0

        values[i * valuesPerProperty + 3] = y1
        values[i * valuesPerProperty + 4] = yCoord
        values[i * valuesPerProperty + 5] = x1

        values[i * valuesPerProperty + 6] = y2
        values[i * valuesPerProperty + 7] = yCoord
        values[i * valuesPerProperty + 8] = x2

        values[i * valuesPerProperty + 9] = y1
        values[i * valuesPerProperty + 10] = yCoord
        values[i * valuesPerProperty + 11] = x1

        values[i * valuesPerProperty + 12] = y3
        values[i * valuesPerProperty + 13] = yCoord
        values[i * valuesPerProperty + 14] = x3

        values[i * valuesPerProperty + 15] = y2
        values[i * valuesPerProperty + 16] = yCoord
        values[i * valuesPerProperty + 17] = x2
    }

    return values
}

export function getLineCoordinatesFromPath(streetGraph: StreetGraph, path: string[], yOffset: number): Float32Array {
    const coordinates = new Float32Array(path.length * 3)
    for (let i = 0; i < path.length; i++) {
        const xAttr = streetGraph.getNodeAttribute(path[i], 'x')
        const yAttr = streetGraph.getNodeAttribute(path[i], 'y')
        coordinates[i * 3] = yAttr
        coordinates[i * 3 + 1] = yOffset
        coordinates[i * 3 + 2] = xAttr
    }
    return coordinates
}

function appendRoofWindowBuildingVertices(
    vertices: { positions: number[], vertexColors: number[] },
    streetGraph: StreetGraph,
    property: [string, string, string, string],
    buildingHeight: number | [number, number],
    buildingArea: number,
    roofHeight: number | [number, number],
    colors: { building: vec3, roof: vec3, windows: vec3 }
) {
    const xy = getHousePositionFromProperty(streetGraph, property)
    const center = vec3.fromValues(xy[1], 0, xy[0])

    const seed = vertices.positions.length

    let extrudeY = 0
    if (typeof buildingHeight == 'number') {
        extrudeY = buildingHeight
    } else {
        const k = randomSeeded(seed)// Math.random() // seed that with the vertex ids 
        extrudeY = (1 - k) * buildingHeight[0] + k * buildingHeight[1]
    }
    const extrude = vec3.fromValues(0, extrudeY, 0)
    const extrude2 = vec3.fromValues(0, extrudeY, 0)

    // Base vertices
    const v0 = vec3.fromValues(
        streetGraph.getNodeAttribute(property[2], 'y'), 0,
        streetGraph.getNodeAttribute(property[2], 'x')
    )
    const v1 = vec3.fromValues(
        streetGraph.getNodeAttribute(property[0], 'y'), 0,
        streetGraph.getNodeAttribute(property[0], 'x')
    )
    const v2 = vec3.fromValues(
        streetGraph.getNodeAttribute(property[1], 'y'), 0,
        streetGraph.getNodeAttribute(property[1], 'x')
    )
    const v3 = vec3.fromValues(
        streetGraph.getNodeAttribute(property[3], 'y'), 0,
        streetGraph.getNodeAttribute(property[3], 'x')
    )

    const areaProperty = areaOfQuadrilateral(v0, v1, v2, v3)
    const k = (buildingArea / areaProperty) ** 0.5


    //          v7 ---------v6   
    //         /.          / |
    //        / .         /  |
    //       v4--------- v5  |
    //       |  v3 ------|--v2   
    //       |  /        |  /
    //       |/          |/
    //       v0--------- v1

    // Vectors from center to property border
    const s0 = vec3.create()
    const s1 = vec3.create()
    const s2 = vec3.create()
    const s3 = vec3.create()

    vec3.sub(s0, v0, center)
    vec3.sub(s1, v1, center)
    vec3.sub(s2, v2, center)
    vec3.sub(s3, v3, center)

    // Scale accordingly 
    vec3.scale(s0, s0, k)
    vec3.scale(s1, s1, k)
    vec3.scale(s2, s2, k)
    vec3.scale(s3, s3, k)

    // update the positions
    vec3.add(v0, s0, center)
    vec3.add(v1, s1, center)
    vec3.add(v2, s2, center)
    vec3.add(v3, s3, center)

    // top Vertices 
    const v4 = vec3.create()
    const v5 = vec3.create()
    const v6 = vec3.create()
    const v7 = vec3.create()

    const v8 = vec3.create()
    const v9 = vec3.create()
    const v10 = vec3.create()
    const v11 = vec3.create()

    vec3.add(v4, v0, extrude)
    vec3.add(v5, v1, extrude)
    vec3.add(v6, v2, extrude2)
    vec3.add(v7, v3, extrude2)

    let rotated = randomSeeded(seed) > 0.5 ? true : false

    if (rotated) {
        vec3.add(v8, v5, v4)
        vec3.add(v9, v7, v6)
    } else {
        vec3.add(v8, v6, v5)
        vec3.add(v9, v4, v7)
    }

    vec3.scale(v8, v8, 0.5)
    vec3.scale(v9, v9, 0.5)

    let roofHeight_ = 0
    if (typeof roofHeight == 'number') {
        roofHeight_ = roofHeight
    } else {
        const k = randomSeeded(seed)
        roofHeight_ = (1 - k) * roofHeight[0] + k * roofHeight[1]
    }
    vec3.add(v10, v8, vec3.fromValues(0, roofHeight_, 0))
    vec3.add(v11, v9, vec3.fromValues(0, roofHeight_, 0))

    // Building positions
    appendQuadrilateral(vertices.positions, v3, v2, v1, v0)
    appendQuadrilateral(vertices.positions, v0, v1, v5, v4)
    appendQuadrilateral(vertices.positions, v1, v2, v6, v5)
    appendQuadrilateral(vertices.positions, v2, v3, v7, v6)
    appendQuadrilateral(vertices.positions, v0, v4, v7, v3)
    // Building colors
    for (let i = 0; i < 5; i++) {
        appendQuadrilateralColors(vertices.vertexColors, colors.building)
    }

    if (rotated) {
        appendQuadrilateral(vertices.positions, v7, v4, v10, v11)
        appendQuadrilateral(vertices.positions, v5, v6, v11, v10)

        appendQuadrilateral(vertices.positions, v4, v5, v10, v10)
        appendQuadrilateral(vertices.positions, v6, v7, v11, v11)
    } else {
        appendQuadrilateral(vertices.positions, v4, v5, v10, v11)
        appendQuadrilateral(vertices.positions, v6, v7, v11, v10)

        appendQuadrilateral(vertices.positions, v5, v6, v10, v10)
        appendQuadrilateral(vertices.positions, v7, v4, v11, v11)
    }
    // Roof colors 
    appendQuadrilateralColors(vertices.vertexColors, colors.roof)
    appendQuadrilateralColors(vertices.vertexColors, colors.roof)
    appendQuadrilateralColors(vertices.vertexColors, colors.building)
    appendQuadrilateralColors(vertices.vertexColors, colors.building)

    // add windows 
    const v4_0 = vec3.create() // height of building
    const v1_0 = vec3.create() // width of building
    const v3_2 = vec3.create()
    const v7_3 = vec3.create()
    vec3.sub(v1_0, v1, v0)
    vec3.sub(v4_0, v4, v0)
    vec3.sub(v3_2, v3, v2)
    vec3.sub(v7_3, v7, v3)
    const v4_0_len = vec3.len(v4_0)

    const windowDimensions = vec3.fromValues(0.75, 1.1, 0.1)
    const windowCellDimensions = vec3.fromValues(windowDimensions[0] * 1.6, 3.2, windowDimensions[2])

    const numWindowsXFront = Math.floor(vec3.len(v1_0) / windowCellDimensions[0])
    const numWindowsYFront = Math.floor(vec3.len(v4_0) / windowCellDimensions[1])
    const xOffsetRest = (vec3.len(v1_0) / windowCellDimensions[0] - Math.floor(vec3.len(v1_0) / windowCellDimensions[0])) * 0.5
    const xOffsetRestBack = (vec3.len(v3_2) / windowCellDimensions[0] - Math.floor(vec3.len(v3_2) / windowCellDimensions[0])) * 0.5

    const numWindowsXBack = Math.floor(vec3.len(v3_2) / windowCellDimensions[0])
    const numWindowsYBack = Math.floor(vec3.len(v7_3) / windowCellDimensions[1])

    const v0_padded = vec3.clone(v0)
    const v1_padded = vec3.clone(v1)
    const v2_padded = vec3.clone(v2)
    const v3_padded = vec3.clone(v3)

    const xOffSetRestVector = vec3.create()
    const xOffSetWindowVector = vec3.create()
    const xOffSetRestVectorBack = vec3.create()
    const xOffSetWindowVectorBack = vec3.create()

    vec3.normalize(xOffSetRestVector, v1_0)
    vec3.normalize(xOffSetWindowVector, v1_0)
    vec3.normalize(xOffSetRestVectorBack, v3_2)
    vec3.normalize(xOffSetWindowVectorBack, v3_2)

    vec3.scale(xOffSetRestVector, xOffSetRestVector, xOffsetRest)
    vec3.scale(xOffSetWindowVector, xOffSetWindowVector, windowCellDimensions[0] * 0.5)
    vec3.scale(xOffSetRestVectorBack, xOffSetRestVectorBack, xOffsetRestBack)
    vec3.scale(xOffSetWindowVectorBack, xOffSetWindowVectorBack, windowCellDimensions[0] * 0.5)

    vec3.add(v0_padded, v0_padded, xOffSetRestVector)
    vec3.add(v0_padded, v0_padded, xOffSetWindowVector)
    vec3.add(v2_padded, v2_padded, xOffSetRestVectorBack)
    vec3.add(v2_padded, v2_padded, xOffSetWindowVectorBack)

    vec3.add(v1_padded, v1_padded, xOffSetRestVector)
    vec3.add(v3_padded, v3_padded, xOffSetRestVectorBack)

    // Front windows 
    for (let i = 0; i < numWindowsXFront; i++) {
        const k = i / numWindowsXFront
        for (let j = 0; j < numWindowsYFront; j++) {
            const windowCenter = vec3.create()
            vec3.lerp(windowCenter, v0_padded, v1_padded, k)
            const yOffset = vec3.fromValues(0, v4_0_len * (j / numWindowsYFront) + windowCellDimensions[1] * 0.65, 0)
            vec3.add(windowCenter, windowCenter, yOffset)
            appendWindow(vertices, windowCenter, windowDimensions, colors.windows, [v0, v1, v5, v4])
        }
    }

    // Back windows 
    for (let i = 0; i < numWindowsXBack; i++) {
        const k = i / numWindowsXBack
        for (let j = 0; j < numWindowsYBack; j++) {
            const windowCenter = vec3.create()
            vec3.lerp(windowCenter, v2_padded, v3_padded, k)
            const yOffset = vec3.fromValues(0, v4_0_len * (j / numWindowsYFront) + windowCellDimensions[1] * 0.65, 0)
            vec3.add(windowCenter, windowCenter, yOffset)
            appendWindow(vertices, windowCenter, windowDimensions, colors.windows, [v2, v3, v7, v6])
        }
    }
}

function appendWindow(vertices: { positions: number[], vertexColors: number[] }, windowCenter: vec3, windowDimensions: vec3, color: vec3, faceVertices: [vec3, vec3, vec3, vec3]) {
    const halfWindowDimensions = vec3.create()
    vec3.scale(halfWindowDimensions, windowDimensions, 0.5)

    const f_1 = vec3.create() // face direction in x direction 
    vec3.sub(f_1, faceVertices[1], faceVertices[0])

    let xAngle = f_1[2] <= 0 ?
        vec3.angle(f_1, vec3.fromValues(1, 0, 0)) :
        vec3.angle(f_1, vec3.fromValues(1, 0, 0)) * -1

    let windowTransformedCenter = vec3.clone(windowCenter)

    const vert = [
        vec3.fromValues(-halfWindowDimensions[0], -halfWindowDimensions[1], halfWindowDimensions[2]),
        vec3.fromValues(halfWindowDimensions[0], -halfWindowDimensions[1], halfWindowDimensions[2]),
        vec3.fromValues(halfWindowDimensions[0], -halfWindowDimensions[1], -halfWindowDimensions[2]),
        vec3.fromValues(-halfWindowDimensions[0], -halfWindowDimensions[1], -halfWindowDimensions[2]),

        vec3.fromValues(-halfWindowDimensions[0], halfWindowDimensions[1], halfWindowDimensions[2]),
        vec3.fromValues(halfWindowDimensions[0], halfWindowDimensions[1], halfWindowDimensions[2]),
        vec3.fromValues(halfWindowDimensions[0], halfWindowDimensions[1], -halfWindowDimensions[2]),
        vec3.fromValues(-halfWindowDimensions[0], halfWindowDimensions[1], -halfWindowDimensions[2])
    ]

    for (let i = 0; i < vert.length; i++) {
        vec3.rotateY(vert[i], vert[i], vec3.create(), xAngle)
        vec3.add(vert[i], vert[i], windowTransformedCenter)
    }

    // Positions
    appendQuadrilateral(vertices.positions, vert[3], vert[2], vert[1], vert[0]) // base
    appendQuadrilateral(vertices.positions, vert[0], vert[1], vert[5], vert[4]) // front
    appendQuadrilateral(vertices.positions, vert[1], vert[2], vert[6], vert[5]) // right
    appendQuadrilateral(vertices.positions, vert[2], vert[3], vert[7], vert[6]) // back
    appendQuadrilateral(vertices.positions, vert[0], vert[4], vert[7], vert[3]) // left
    appendQuadrilateral(vertices.positions, vert[4], vert[5], vert[6], vert[7]) // top
    // Colors
    for (let i = 0; i < 6; i++) {
        appendQuadrilateralColors(vertices.vertexColors, color)
    }
}

function appendQuadrilateral(positions: number[], v0: vec3, v1: vec3, v2: vec3, v3: vec3) {
    positions.push(v0[0], v0[1], v0[2])
    positions.push(v1[0], v1[1], v1[2])
    positions.push(v2[0], v2[1], v2[2])

    // Second Triangle
    positions.push(v0[0], v0[1], v0[2])
    positions.push(v2[0], v2[1], v2[2])
    positions.push(v3[0], v3[1], v3[2])
}

function appendQuadrilateralColors(vertexColors: number[], color: vec3) {
    for (let i = 0; i < 6; i++) {
        vertexColors.push(color[0])
        vertexColors.push(color[1])
        vertexColors.push(color[2])
    }
}

function addQuadrilateral(vertices: Float32Array, firstIndex: number, v0: vec3, v1: vec3, v2: vec3, v3: vec3) {
    // First Triangle top surface
    vertices[firstIndex + 0] = v0[0]
    vertices[firstIndex + 1] = v0[1]
    vertices[firstIndex + 2] = v0[2]

    vertices[firstIndex + 3] = v1[0]
    vertices[firstIndex + 4] = v1[1]
    vertices[firstIndex + 5] = v1[2]

    vertices[firstIndex + 6] = v2[0]
    vertices[firstIndex + 7] = v2[1]
    vertices[firstIndex + 8] = v2[2]

    // Second Triangle
    vertices[firstIndex + 9] = v0[0]
    vertices[firstIndex + 10] = v0[1]
    vertices[firstIndex + 11] = v0[2]

    vertices[firstIndex + 12] = v2[0]
    vertices[firstIndex + 13] = v2[1]
    vertices[firstIndex + 14] = v2[2]

    vertices[firstIndex + 15] = v3[0]
    vertices[firstIndex + 16] = v3[1]
    vertices[firstIndex + 17] = v3[2]
}

function getCentroid(vertices: vec3[]): vec3 {
    const centroid = vec3.create()
    vertices.forEach(point => {
        vec3.add(centroid, centroid, point)
    })
    vec3.scale(centroid, centroid, 1 / vertices.length)
    return centroid
}

function areaOfQuadrilateral(_v0: vec3, _v1: vec3, _v2: vec3, _v3: vec3): number {
    const d0 = vec3.create()
    const d1 = vec3.create()
    const crossProd = vec3.create()

    vec3.sub(d0, _v0, _v2)
    vec3.sub(d1, _v1, _v3)

    vec3.cross(crossProd, d0, d1)

    return 0.5 * vec3.len(crossProd)
}

function moveVertexCloser(v: vec3, centroid: vec3, distance: number): vec3 {
    const delta = vec3.create()
    vec3.sub(delta, v, centroid)
    vec3.scale(delta, delta, 1 - distance / vec3.dist(v, centroid))
    const v_ = vec3.create()
    vec3.add(v_, centroid, delta)
    return v_
}