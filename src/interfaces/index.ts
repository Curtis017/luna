export interface Payload<T> {
    [name: string]: T;
}

export interface Resource<T> {
    type: string;
    exists: boolean;
    payload: T;
}

export interface Handler<T> {
    fetch: (params: any) => Promise<Resource<T>>;
    create: (resource: Resource<T>) => Promise<Resource<T>>;
    delete: (resource: Resource<T>) => Promise<Resource<T>>;
    format: (resource: Resource<T>) => string;
}
