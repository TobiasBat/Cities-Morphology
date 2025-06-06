import { CityParameters, NumberPathVariationOptions, PathSimulationVariationResult, CityGrid, PathSimulation, CityInputParameters, pathSimulationFromParameters, computePathSimulationVariations } from "city-grid";

export function computePathSimulationVariationsWrapper(
    currentParameters: CityInputParameters,
    valueToBeAltered: keyof CityInputParameters,
    values: number[],
    numberOfPaths: NumberPathVariationOptions,
    manhattanDistance?: boolean
): PathSimulationVariationResult[] {
    return computePathSimulationVariations(currentParameters, valueToBeAltered, values, numberOfPaths, manhattanDistance)
}

export function pathSimulationFromParametersWrapper(parameters: Readonly<CityParameters>, numberOfPaths: NumberPathVariationOptions, directDistance?: boolean): { numPaths: number, simulation: PathSimulation, grid: CityGrid } {
    return pathSimulationFromParameters(parameters, numberOfPaths, directDistance)
}