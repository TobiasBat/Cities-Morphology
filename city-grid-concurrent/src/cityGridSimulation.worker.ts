import { computePathSimulationVariationsWrapper, pathSimulationFromParametersWrapper } from './cityGridSimulationWrapper'

onmessage = (e: any) => {
    const data = e.data
    if (!data.arguments || !data.function) {
        return
    }

    switch (data.function) {
        case 'computePathSimulationVariations':
            const result = computePathSimulationVariationsWrapper(data.arguments[0], data.arguments[1], data.arguments[2], data.arguments[3], data.arguments[4])
            postMessage(result)
            break
        case 'pathSimulationFromParameters':
            const results_computePathSimulationVariation = pathSimulationFromParametersWrapper(data.arguments[0], data.arguments[1], data.arguments[2])
            postMessage(results_computePathSimulationVariation)
            break
        case 'test':
            console.log('Got a message from main script', 'function:', data.function, 'arguments', data.arguments)
            break
        default:
            console.error('not valid function name')
            break
    }
}