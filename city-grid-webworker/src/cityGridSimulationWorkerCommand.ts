export type CityGridSimulationWorkerCommand = {
    function: 'computePathSimulationVariations' | 'pathSimulationFromParameters' | 'test'
    arguments: Array<any>
}