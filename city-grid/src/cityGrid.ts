/**
 * Functionality to create a city grid. 
 */
import Graph from 'graphology';
import { randomSeeded } from './utilities';

export type StreetGraphNodeAttributes = { x: number, y: number }
export type CityParameters = {
    residents: number,
    personsPerBuilding: number,
    buildingFootprint: number,
    sprawl: number,
    areaPerResident: number,
    floors: number,
    elongation: number,
    heightParameter: number
}
export type StreetGraphEdgeSimulationAttributes = { usedByNumPaths: number, accumulatedLengthPaths: number }
export type StreetGraphEdgeAttributes = { length: number, simulationState: StreetGraphEdgeSimulationAttributes }
export type StreetGraph = Graph<StreetGraphNodeAttributes, StreetGraphEdgeAttributes, any>
export type CityProperty = Array<[string, string, string, string]>
export type CityStats = {
    area: number, // the actual area of all properties and streets
    ellipseArea: number // the area of the smallest ellipse around the city 
}

export type CityGrid = {
    shape: {
        minorAxis: number,
        majorAxis: number,
        numColumns: number,
        numRows: number,
    },
    streetGraph: StreetGraph,
    properties: CityProperty // nodeId of the four corners. First one is the entrance node
    heightValue?: Array<number>,
    sourceVariables: {
        numBuildings: number,
        buildingFootprint: number,
        elongation: number,
        cellBuildingRatio: number
    },
    cityParameters: CityParameters | null,
    stats: CityStats
}

/**
 * Creates a city grid based on high level parameters. 
 * @param residents total number of people living in the city
 * @param personsPerBuilding number of persons living in each house
 * @param floors avg. number of floors
 * @param sprawl distance between two individual buildings
 * @param areaPerResident apartment space of each resident
 * @param elongation ratio between longest extension and shortest extension
 * @param heightDistribution how height of buildings is distributed; > 0 pyramid, < 0 bowl, ~ 0 pancake
 * @returns a resulting city grid
 */
export function ellipticalGridFromCityParameters(residents: number, personsPerBuilding: number, floors: number, sprawl: number, areaPerResident: number, elongation: number, heightDistribution: number): CityGrid {
    const numBuildings = residents / personsPerBuilding
    const avgBuildingFootprint = (personsPerBuilding * areaPerResident) / floors
    const cellBuildingRatio = (avgBuildingFootprint ** 0.5 + sprawl) / (avgBuildingFootprint ** 0.5)

    const cityGrid = ellipticalGrid(numBuildings, avgBuildingFootprint, elongation, cellBuildingRatio)

    cityGrid.heightValue = []

    const offset = 1
    const p0Volume = approximationOfVolumeOfRevolution((x: number) => { return 1 / ((x + offset) ** 0) }, 0, 1, 100)
    const p1Volume = approximationOfVolumeOfRevolution((x: number) => { return 1 / ((x + offset) ** heightDistribution) }, 0, 1, 100)
    const scaleFactorShape = p0Volume / p1Volume

    for (let i = 0; i < cityGrid.properties.length; i++) {
        const property = cityGrid.properties[i]
        const xy = getHousePositionFromProperty(cityGrid.streetGraph, property)
        const center = [xy[1], 0, xy[0]]
        const parDistance = Math.sqrt(((center[0] ** 2) / (cityGrid.shape.minorAxis ** 2) + (center[2] ** 2) / (cityGrid.shape.majorAxis ** 2))) * 2
        const parameterBuildingHeight = scaleFactorShape * 1 / ((parDistance + offset) ** heightDistribution)
        cityGrid.heightValue.push(parameterBuildingHeight)
    }

    cityGrid.cityParameters = {
        residents: residents,
        personsPerBuilding: personsPerBuilding,
        buildingFootprint: avgBuildingFootprint,
        sprawl: sprawl,
        areaPerResident: areaPerResident,
        floors: floors,
        elongation: elongation,
        heightParameter: heightDistribution
    }
    return cityGrid
}

/**
 * to get the weights for nodes, based on the assigned property height parameters
 * @param cityGrid with assigned heightValues 
 * @returns a dictionary, with all nodes as keys and the corresponding avg. height value of the adjacent properties
 */
export function getNodeWeights(cityGrid: CityGrid): { [id: string]: number } {
    const weights = {} as { [id: string]: number }
    const allWeights = {} as { [nodeId: string]: number[] }

    if (!cityGrid.heightValue) {
        console.error('No heights to cityGrid assigned')
        return weights
    }

    for (let propertyIndex = 0; propertyIndex < cityGrid.properties.length; propertyIndex++) {
        for (let nodeIndex = 0; nodeIndex < cityGrid.properties[propertyIndex].length; nodeIndex++) {
            const cornerNodeId = cityGrid.properties[propertyIndex][nodeIndex]
            if (cornerNodeId in allWeights) {
                allWeights[cornerNodeId].push(cityGrid.heightValue[propertyIndex])
            } else {
                allWeights[cornerNodeId] = [cityGrid.heightValue[propertyIndex]]
            }
        }
    }

    Object.keys(allWeights).forEach(nodeId => {
        const weightsOfNode = allWeights[nodeId]
        let avgWeight = 0
        weightsOfNode.forEach(w => {
            avgWeight += w
        })
        avgWeight /= weightsOfNode.length
        weights[nodeId] = avgWeight
    })

    return weights
}

/**
 * to approximate the volume of Solid of revolution (uses shell method)
 * @param fn function to be revolted
 * @param a lower boundary
 * @param b upper boundary
 * @param numDivisions steps of approximation, higher number equals better approximation
 * @returns the volume of the revolted function for boundaries 
 */
function approximationOfVolumeOfRevolution(fn: (x: number) => number, a: number, b: number, numDivisions: number): number {
    const step = (b - a) / numDivisions
    const stepSequence = []
    for (let i = 0; i < numDivisions; i++) {
        stepSequence.push(i * step)
    }
    let volume = 0
    stepSequence.forEach(x => {
        volume += x * fn(x) * step
    })
    volume *= 2 * Math.PI
    return volume
}

/**
 * Creates an elliptical city grid. Does not consider height / floor information
 * @param numBuildings number of buildings
 * @param buildingFootprint average footprint of buildings
 * @param elongation elongation of a city; e = 1 in case of a circle. > 1 in case of a ellipse
 * @param cellBuildingRat ration of length of a grid cell to the length of the building; s must be >= 1.0
 * @returns 
 */
export function ellipticalGrid(numBuildings: number, buildingFootprint: number, elongation: number, cellBuildingRat: number): CityGrid {
    const minorAxis = 2 * Math.sqrt(numBuildings * buildingFootprint / Math.PI) * 1 / elongation * cellBuildingRat
    const majorAxis = elongation * elongation * minorAxis

    const gridSize = Math.sqrt(buildingFootprint) * cellBuildingRat

    const numColumns = Math.floor(majorAxis / gridSize) + 2
    const numRows = Math.floor(minorAxis / gridSize) + 2
    let numBuildingsCreated = 0

    for (let i = 0; i < numRows / 2; i++) {
        let angle = Math.asin(i / Math.floor(1 + numRows / 2))
        let widthOfRow = majorAxis * Math.cos(angle)
        numBuildingsCreated += Math.floor(widthOfRow / gridSize)
    }
    numBuildingsCreated *= 2

    const streetGraph: Graph<StreetGraphNodeAttributes, any, any> = new Graph({ type: 'undirected' })

    let index = 0
    let sortedNodes = []
    for (let i = 0; i < numColumns; i++) {
        for (let j = 0; j < numRows; j++) {
            streetGraph.addNode(index.toString(), {
                x: i * gridSize - majorAxis / 2 + gridSize * 0.5,
                y: j * gridSize - minorAxis / 2 + gridSize * 0.5
            })
            sortedNodes.push(index.toString())
            index++
        }
    }

    for (let c = 0; c < numColumns; c++) {
        for (let r = 0; r < numRows; r++) {
            const n = sortedNodes[numRows * c + r]
            if (c > 0) {
                const n1 = sortedNodes[numRows * (c - 1) + r]
                streetGraph.addEdge(
                    n, n1, { length: 10000 }
                )
            }
            if (r > 0) {
                const n2 = sortedNodes[numRows * c + (r - 1)]
                streetGraph.addEdge(
                    n, n2, { length: 1000 }
                )
            }
        }
    }

    // Adding properties
    let properties: Array<[string, string, string, string]> = []
    for (let c = 0; c < numColumns; c++) {
        for (let r = 0; r < numRows; r++) {
            const n = sortedNodes[numRows * c + r]
            if (c > 0 && r > 0) {
                const n1 = sortedNodes[numRows * (c - 1) + r]
                const n2 = sortedNodes[numRows * c + (r - 1)]
                const n3 = sortedNodes[numRows * (c - 1) + (r - 1)]
                properties.push([n, n1, n2, n3])
            }
        }
    }

    let nodeDistances: Array<[string, number]> = []
    streetGraph.nodes().forEach(nodeId => {
        const x = streetGraph.getNodeAttribute(nodeId, 'x')
        const y = streetGraph.getNodeAttribute(nodeId, 'y')
        const parameterDistance = x ** 2 / (majorAxis / 2) ** 2 + y ** 2 / (minorAxis / 2) ** 2
        nodeDistances.push([nodeId, parameterDistance])
    })

    const allPropertiesDistances: Array<{ property: [string, string, string, string], paramDist: number }> = []
    for (let i = 0; i < properties.length; i++) {
        const property = properties[i]

        const v0: [number, number] = [
            streetGraph.getNodeAttribute(property[0], 'x'),
            streetGraph.getNodeAttribute(property[0], 'y')
        ]
        const v1: [number, number] = [
            streetGraph.getNodeAttribute(property[1], 'x'),
            streetGraph.getNodeAttribute(property[1], 'y')
        ]
        const v2: [number, number] = [
            streetGraph.getNodeAttribute(property[2], 'x'),
            streetGraph.getNodeAttribute(property[2], 'y')
        ]
        const v3: [number, number] = [
            streetGraph.getNodeAttribute(property[3], 'x'),
            streetGraph.getNodeAttribute(property[3], 'y')
        ]

        const parameterDistance = Math.min(
            v0[0] ** 2 / (majorAxis / 2) ** 2 + v0[1] ** 2 / (minorAxis / 2) ** 2,
            v1[0] ** 2 / (majorAxis / 2) ** 2 + v1[1] ** 2 / (minorAxis / 2) ** 2,
            v2[0] ** 2 / (majorAxis / 2) ** 2 + v2[1] ** 2 / (minorAxis / 2) ** 2,
            v3[0] ** 2 / (majorAxis / 2) ** 2 + v3[1] ** 2 / (minorAxis / 2) ** 2,
        )

        allPropertiesDistances.push({
            property: property,
            paramDist: parameterDistance
        })
    }
    allPropertiesDistances.sort((propA, propB) => {
        return propA.paramDist > propB.paramDist ? 1 : -1
    })

    const usedProperties = allPropertiesDistances.slice(0, numBuildings)

    const usedNodesDict: { [id: string]: boolean } = {}
    usedProperties.forEach(property => {
        const nodeIds = property.property
        nodeIds.forEach(id => {
            usedNodesDict[id] = true
        })
    })

    const nodesToDelete: string[] = []
    streetGraph.nodes().forEach(nodeId => {
        if (!usedNodesDict[nodeId]) {
            nodesToDelete.push(nodeId)
        }
    })

    nodesToDelete.forEach(nodeId => {
        streetGraph.dropNode(nodeId)
    })

    properties = []
    usedProperties.forEach(property => {
        properties.push(property.property)
    })

    // Update edge Attributes
    streetGraph.edges().forEach(edgeId => {
        streetGraph.setEdgeAttribute(edgeId, 'length', getLengthOfEdge(streetGraph, edgeId))
        const simulationAttributes = { usedByNumPaths: 0, accumulatedLengthPaths: 0 }
        streetGraph.setEdgeAttribute(edgeId, 'simulationState', simulationAttributes)
    })

    // compute city area 
    const ellipseArea = Math.PI * (majorAxis / 2) * (minorAxis / 2)
    const area = getAreaOfCity(streetGraph, properties)

    return {
        'shape': {
            minorAxis: minorAxis,
            majorAxis: majorAxis,
            numColumns: numColumns,
            numRows: numRows,
        },
        'streetGraph': streetGraph,
        'properties': properties,
        'sourceVariables': {
            buildingFootprint: buildingFootprint,
            numBuildings: numBuildings,
            elongation: elongation,
            cellBuildingRatio: cellBuildingRat
        },
        cityParameters: null,
        stats: {
            area: area,
            ellipseArea: ellipseArea
        }
    }
}

/**
 * To get the geographic length of an edge
 * @param streetGraph 
 * @param edgeId 
 * @returns length of edge
 */
function getLengthOfEdge(streetGraph: StreetGraph, edgeId: string): number {
    const v1 = streetGraph.source(edgeId)
    const v2 = streetGraph.target(edgeId)
    const x1 = streetGraph.getNodeAttribute(v1, 'x')
    const y1 = streetGraph.getNodeAttribute(v1, 'y')
    const x2 = streetGraph.getNodeAttribute(v2, 'x')
    const y2 = streetGraph.getNodeAttribute(v2, 'y')
    return Math.sqrt(
        (x2 - x1) ** 2 + (y2 - y1) ** 2
    )
}

/**
 * @returns the actual area of the city — sum of area of properties and streets. 
 * More precise the sum of the area of all cells of the street-graph
 */
function getAreaOfCity(graph: StreetGraph, properties: CityProperty): number {
    let area = 0
    properties.forEach(property => {
        const nodeCoordinates = [] as Array<[number, number]>
        property.forEach(nodeId => {
            nodeCoordinates.push([
                graph.getNodeAttribute(nodeId, 'x'),
                graph.getNodeAttribute(nodeId, 'y')
            ])
        })
        // v3 - v2
        // |  / |
        // v0 - v1
        // upwards triangle 
        const b1 = Math.abs(
            nodeCoordinates[1][0] - nodeCoordinates[0][0]
        )
        const h1 = Math.abs(
            nodeCoordinates[2][1] - nodeCoordinates[1][1]
        )

        // downwards triangle 
        const b2 = Math.abs(
            nodeCoordinates[3][0] - nodeCoordinates[2][0]
        )
        const h2 = Math.abs(
            nodeCoordinates[0][1] - nodeCoordinates[3][1]
        )

        area += b1 * h1 / 2 // up-triangle 
        area += b2 * h2 / 2 // down-triangle
    })
    return area
}

/**
 * Randomizes the node positions of the streetGraph of the cityGrid. 
 * Primarily for illustrative purposes, to create a more natural city. 
 * @param cityGrid cityGrid to be updated
 * @param offset range 0 to 1. 1 corresponds to a max offset of ||longest Edge|| / 2, 0 to no offset at all 
 */
export function randomizeNodePosition(cityGrid: CityGrid, offset: number) {
    if (offset == 0) return
    let maxLength = 0.0
    cityGrid.streetGraph.edges().forEach(edgeId => {
        maxLength = Math.max(cityGrid.streetGraph.getEdgeAttribute(edgeId, 'length'), maxLength)
    })

    const maxDelta = maxLength * offset * 0.5
    const nodes = cityGrid.streetGraph.nodes()

    for (let i = 0; i < nodes.length; i++) {
        const nodeId = nodes[i]
        const x = cityGrid.streetGraph.getNodeAttribute(nodeId, 'x')
        const y = cityGrid.streetGraph.getNodeAttribute(nodeId, 'y')
        const hashValue = randomSeeded(+nodeId !== undefined ? +nodeId : 0)
        const r = hashValue * maxDelta
        const angle = hashValue * Math.PI * 2
        const x_ = x + r * Math.cos(angle)
        const y_ = y + r * Math.sin(angle)
        cityGrid.streetGraph.setNodeAttribute(nodeId, 'x', x_)
        cityGrid.streetGraph.setNodeAttribute(nodeId, 'y', y_)
    }

    // Update edge Length
    cityGrid.streetGraph.edges().forEach(edgeId => {
        cityGrid.streetGraph.setEdgeAttribute(edgeId, 'length', getLengthOfEdge(cityGrid.streetGraph, edgeId))
    })
}

/**
 * @returns coordinates of centroid of property
 */
export function getHousePositionFromProperty(streetGraph: StreetGraph, property: [string, string, string, string]): [number, number] {
    const c1 = [
        streetGraph.getNodeAttribute(property[0], 'x'),
        streetGraph.getNodeAttribute(property[0], 'y')
    ] as [number, number]
    const c2: [number, number] = [
        streetGraph.getNodeAttribute(property[1], 'x'),
        streetGraph.getNodeAttribute(property[1], 'y'),
    ]
    const c3: [number, number] = [
        streetGraph.getNodeAttribute(property[2], 'x'),
        streetGraph.getNodeAttribute(property[2], 'y'),
    ]
    const c4: [number, number] = [
        streetGraph.getNodeAttribute(property[3], 'x'),
        streetGraph.getNodeAttribute(property[3], 'y'),
    ]
    return [
        (c1[0] + c2[0] + c3[0] + c4[0]) / 4,
        (c1[1] + c2[1] + c3[1] + c4[1]) / 4,
    ]
}