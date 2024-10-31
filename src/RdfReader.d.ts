import { DataModelProperties } from "@themost/common";

export declare class RdfReader {
    constructor();
    async readFileAsync(file: string): Promise<DataModelProperties[]>
    async read(xml: string): DataModelProperties[];
}