/**
 * Base parameters for simulation. Approximately the city of vienna. 
 */
import { CityInputParameters, pathSimulationFromParameters } from "city-grid";
import { MANHATTAN_DISTANCE, NUMBER_OF_SAMPLES } from "./options.js";

export function getViennaCityParameters() {
    // https://www.wien.gv.at/statistik/lebensraum/gebaeude/#:~:text=Die%20meisten%20Wohnungen%20in%20Wien,Wien%20liegt%20bei%2038%20Quadratmetern.
    const residents = 2000000 // ~ 1995786
    const areaPerResident = 38 // https://www.wien.gv.at/statistik/lebensraum/gebaeude/#:~:text=Die%20meisten%20Wohnungen%20in%20Wien,Wien%20liegt%20bei%2038%20Quadratmetern.
    const numberOfBuildings = 175760
    const floors = 3 // https://www.data.gv.at/katalog/dataset/28185052-3df4-46ae-8c97-8b47221c6487#additional-info
    const buildingFootprint = (areaPerResident * residents) / (numberOfBuildings * floors)

    const interBuildingDistance = 20 + (buildingFootprint ** 0.5) * 0.1

    const VIENNA_CITY_PARAMETERS: CityInputParameters = {
        residents: residents,
        personsPerBuilding: Math.round(100 * residents / numberOfBuildings) / 100,
        sprawl: interBuildingDistance,
        areaPerResident: areaPerResident,
        floors: floors,
        elongation: 1.5,
        heightParameter: 1.2
    }

    return VIENNA_CITY_PARAMETERS
}

console.log('VIENNA_CITY_PARAMETERS', getViennaCityParameters())
const result = pathSimulationFromParameters(getViennaCityParameters(), NUMBER_OF_SAMPLES, MANHATTAN_DISTANCE)
console.log('Average Travel distance:', Math.round(result.simulation.metrics.averageDistance))