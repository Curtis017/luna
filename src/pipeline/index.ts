export type Middleware<P, T> = (payload: P, next: (res?: T) => void) => any;

export const compose = (...funcs: any[]) =>
  funcs.reduce((a, b) => (...args: any) => a(b(...args)), (arg: any) => arg)

const pipeline = (payload: Object, ...steps: Middleware<any, any>[]): any => {
    const [ step, ...next ] = steps;
    return (step) ? step(payload, (res) => pipeline(Object.assign(payload, res), ...next)) : payload;
}

export default pipeline;
