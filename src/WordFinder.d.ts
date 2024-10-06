export declare class WordFinder {
    constructor();
    /**
     * The operation will try to find the given string in the dictionary
     * @param {string} str 
     * @returns Returns a promise that will be resolved with the given string if it is found in the dictionary
     */
    async find(str: string): Promise<string>;
    /**
     * The operation will try to find words that starts with the given array of strings
     * @param {...string} str An array of strings to search for
     * @returns {Promise<string[]>} Returns a promise that will be resolved with an array of strings that are found in the dictionary
     */
    async startsWith(...str: string[]): Promise<string[]>;
    /**
     * The operation will try to split the given string into words that are found in the dictionary
     * e.g. 'calendartype' will be split into 'calendar' and 'type'.
     * @param {*} str 
     * @returns {Promise<string[]>} The operation will return an array of strings that are found in the dictionary
     */
    async trySplit(str: string): Promise<string[]>;
}