
export declare interface FieldNamingFormatOptions {
    separator?: string;
    camelCase?: boolean;
    exclude?: string[];
}

export declare class FieldNaming {
    constructor(options?: FieldNamingFormatOptions);
    async format(str: string): Promise<string>;
    async formatMany(...str: string[]): Promise<string[]>;
}