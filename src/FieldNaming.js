import { WordFinder } from './WordFinder';

class FieldNaming {

    constructor(options) {
        this.wordFinder = new WordFinder();
        this.options = Object.assign({
            separator: '',
            camelCase: true,
            exclude: []
        }, options);
    }

    async format(str) {
        if (this.options.exclude.indexOf(str) !== -1) {
            return str;
        }
        const results = await this.wordFinder.trySplit(str);
        if (results.length > 0) {
            // if (results.length > 1 && results[results.length - 1] === 'id') {
            //     results.pop();
            // }
            return results.map((item, index) => {
                if (this.options.camelCase) {
                    if (index === 0) {
                        return item;
                    }
                    return item.charAt(0).toUpperCase() + item.slice(1);
                } 
                return item;
            }).join(this.options.separator);
        }
        return str;
    }

    /**
     * The operation will format an array of fields
     */
    async formatMany(field) {
        const fields = Array.from(arguments);
        const results = [];
        for (const field of fields) {
            let name = await this.format(field);
            results.push(name);
        }
        return results;
    }

}

export {
    FieldNaming
}