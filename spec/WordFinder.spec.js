import { WordFinder } from "../src/WordFinder";

describe('WordFinder', () => {
    it('should create instance', () => {
        expect(true).toBeTruthy();
    })
    it('should find word', async () => {
        const wordFinder = new WordFinder();
        let found = await wordFinder.find('hello');
        expect(found).toBeTruthy();
        found = await wordFinder.find('hello1');
        expect(found).toBeFalsy();
    });

    fit('should split words', async () => {
        let word = 'calendartype';
        const wordFinder = new WordFinder();
        let results = await wordFinder.trySplit(word);
        expect(results).toEqual([
            'calendar', 'type'
        ]);
        results = await wordFinder.trySplit('isaccessibleforfree');
        expect(results).toEqual([
            'is', 'accessible', 'for', 'free'
        ]);
    });
});