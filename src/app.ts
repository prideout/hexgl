import { createWorker, ITypedWorker } from 'typed-web-workers'

interface Values {
    x: number
    y: number
}

function workFn(input: Values, callback: (_: number) => void): void {
    callback(input.x + input.y)
}

function logFn(result: number) {
    console.log(`We received this response from the worker: ${result}`)
}

const typedWorker: ITypedWorker<Values, number> = createWorker(workFn, logFn)

typedWorker.postMessage({ x: 5, y: 5 })
