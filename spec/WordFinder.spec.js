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

    it('should split words #1', async () => {
        const wordFinder = new WordFinder();
        const results = await wordFinder.trySplit('calendartype');
        expect(results).toEqual([
            'calendar', 'type'
        ]);
    });

    it('should split words #2', async () => {
        const wordFinder = new WordFinder();
        const results = await wordFinder.trySplit('isAccessibleforfree');
        expect(results).toEqual([
            'is', 'accessible', 'for', 'free'
        ]);
    });
});