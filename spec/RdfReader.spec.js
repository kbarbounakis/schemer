import { RdfReader } from "../src";

describe('RdfReader', () => {
    it('should read rdf', async () => {
        const reader = new RdfReader();
        const collection = await reader.readFileAsync('spec/foaf.rdf');
        expect(collection).toBeTruthy();
    });
});