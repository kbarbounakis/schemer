
import { SqliteAdapter } from "@themost/sqlite";
import { QueryExpression, QueryField } from "@themost/query";
import path from 'path';
import { TraceUtils } from "@themost/common";

class WordFinder {
    constructor() {
        this.db = new SqliteAdapter({
            database: path.resolve(__dirname, '../db/words.db')
        });
        this.options = {
            maxWords: 100
        }
    }
    /**
     * The operation will try to find the given string in the dictionary
     * @param {string} str 
     * @returns Returns a promise that will be resolved with the given string if it is found in the dictionary
     */
    async find(str) {
        return this.db.executeAsync(
            new QueryExpression().select(new QueryField('word')).from('WordBase').where('word').equal(str)
        ).then(([result]) => {
            return result && result.word;;
        });
    }

    /**
     * The operation will try to split the given string into words that are found in the dictionary
     * e.g. 'calendartype' will be split into 'calendar' and 'type'.
     * @param {*} str 
     * @returns {Promise<string[]>} The operation will return an array of strings that are found in the dictionary
     */
    async trySplit(str) {
        let word = str;
        let results = [];
        let continueProcessing = true;
        while(continueProcessing) {
            let args = [];
            let index = 0;
            while (index < word.length) {
                args.push(word.substring(0, index + 1));
                index++;
            }
            let argIndex = 0;
            for (const arg of args.reverse()) {
                let findWord = await this.find(arg);
                if (findWord) {
                    const re = new RegExp(`^${arg}`, 'i');
                    word = word.replace(re, '');
                    results.push(arg);
                    break;
                }
                argIndex++;
            }
            continueProcessing =  word.length > 0 && argIndex < args.length;
        }
        return results;
    }

    /**
     * The operation will try to find words that starts with the given array of strings
     * @param {...string} str An array of strings to search for
     * @returns {Promise<string[]>} Returns a promise that will be resolved with an array of strings that are found in the dictionary
     */
    async startsWith(str) {
        const args = Array.from(arguments);
        const q = new QueryExpression().select(new QueryField('word')).from('WordBase').take(this.options.maxWords);
        if (args.length > 0) {
            for (let i = 0; i < args.length; i++) {
                if (i === 0) {
                    q.where('word').startsWith(args[i]);
                } else {
                    q.or('word').startsWith(args[i]);
                }
            }
        } else {
            q.where('word').equal(null);
        }
        q.orderByDescending(new QueryField('word'))
        return this.db.executeAsync(q).then((results) => {
            return results.map((result) => result.word);
        });
    }
}

export {
    WordFinder
}