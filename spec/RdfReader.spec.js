import { RdfReader, SchemaOrgReader } from "../src";
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);

describe('RdfReader', () => {
    it('should read foaf.rdf', async () => {
        const reader = new RdfReader();
        const collection = await reader.readFileAsync('spec/foaf.rdf');
        expect(collection).toBeTruthy();
        const outDir = path.resolve(__dirname, 'out/foaf');
        await mkdirAsync(outDir, { recursive: true });
        for (const element of collection) {
            await writeFileAsync(path.resolve(outDir, `${element.name}.json`), JSON.stringify(element, null, 2), 'utf8');    
        }        
    });

    it('should read schema.org.rdf', async () => {
        const reader = new SchemaOrgReader();
        const collection = await reader.readFileAsync('spec/schemaorg-latest.rdf');
        expect(collection).toBeTruthy();
        const model = collection.find((x) => x.name === 'Thing');
        expect(model).toBeTruthy();
        expect(model.fields.length).toBeTruthy();
        const outDir = path.resolve(__dirname, 'out/schema-org');
        await mkdirAsync(outDir, { recursive: true });
        for (const element of collection) {
            await writeFileAsync(path.resolve(outDir, `${element.name}.json`), JSON.stringify(element, null, 2), 'utf8');    
        }
    });

    it('should read purl-goodrelations-v1.rdf', async () => {
        const reader = new RdfReader();
        const collection = await reader.readFileAsync('spec/purl-goodrelations-v1.rdf');
        const outDir = path.resolve(__dirname, 'out/purl-goodrelations-v1');
        await mkdirAsync(outDir, { recursive: true });
        for (const element of collection) {
            await writeFileAsync(path.resolve(outDir, `${element.name}.json`), JSON.stringify(element, null, 2), 'utf8');    
        }
    });
});