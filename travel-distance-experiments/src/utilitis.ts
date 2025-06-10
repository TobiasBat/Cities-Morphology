export function range(min: number, max: number, numValues: number): number[] {
    if (numValues < 2) {
        console.error(' numValues must be <= 2')
        return [min, max]
    }

    const results = [min]

    if (numValues > 2) {
        const delta = max - min
        const stepSize = delta / (numValues - 1)
        for (let i = 0; i < (numValues - 2); i++) {
            results.push(
                results[results.length - 1] + stepSize
            )
        }
        results.push(max)
    } else {
        results.push(max)
    }

    return results
}


export function getTimeStamp(): string {
    const now = Date.now()
    const date = new Date(now)
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate() + 1}-${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}`
}

export function ObjectArrayToCSVString(input: Array<Object>): string {
    let out = ''
    const SEP = ','

    if (input.length === 0)
        return out

    const keys = Object.keys(input[0])
    for (let i = 0; i < keys.length; i++) {
        out += keys[i].toString()
        if (i === keys.length - 1)
            out += '\n'
        else
            out += SEP
    }

    input.forEach(element => {
        for (let i = 0; i < keys.length; i++) {
            out += element[keys[i]].toString()
            if (i === keys.length - 1)
                out += '\n'
            else
                out += SEP
        }
    })

    return out
}