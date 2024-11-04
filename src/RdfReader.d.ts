import { DataFieldBase, DataModelProperties } from "@themost/common";
import { SyncSeriesEventEmitter } from '@themost/events';

export declare class RdfReader {
    constructor();
    afterReadClass: SyncSeriesEventEmitter<{ target: RdfClass, object: DataModelProperties }>;
    afterReadProperty: SyncSeriesEventEmitter<{ target: RdfClass, object: DataFieldBase }>;
    async readFileAsync(file: string): Promise<DataModelProperties[]>
    async read(xml: string): DataModelProperties[];
}

export declare class SchemaOrgReader extends RdfReader {
    constructor();
}