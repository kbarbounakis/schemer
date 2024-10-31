import fs from 'fs';
import path from 'path';
import { URL } from 'url';
import { promisify } from 'util';
import { XDocument } from '@themost/xml';
const readFileAsync = promisify(fs.readFile);

class RdfReader {
    constructor() {
        this._data = {};
    }

    /**
     * Reads the RDF file and returns the data.
     * @param {string} file
     * @returns {Promise<any>}
     */
    async readFileAsync(file) {
        const xml = await readFileAsync(path.resolve(process.cwd(), file), 'utf8');
        return this.read(xml);
    }

    /**
     * Reads RDF domain object properties and returns an array of data fields.
     * @private
     * @return {import('@themost/common').DataFieldBase[]}
     */
    readObjectProperties(document, id) {
        return document.documentElement.selectNodes(`owl:ObjectProperty/rdfs:domain[@rdf:resource='${id}']/..`).map((item) => {
            const label = item.selectSingleNode(`rdfs:label[@xml:lang='en']`);
            const identifier = item.selectSingleNode('dc:identifier');
            const comment = item.selectSingleNode(`rdfs:comment[@xml:lang='en']`);
            const range = item.selectSingleNode('rdfs:range');
            let type = 'Object';
            if (range) {
                const owlClass = document.documentElement.selectSingleNode(`owl:Class[@rdf:about='${range.getAttribute('rdf:resource')}']`);
                if (owlClass) {
                    const identifier = owlClass.selectSingleNode('dc:identifier');
                    type = identifier.nodeTypedValue.split(':').pop().trim() + 'Shape';
                }
            }
            return {
                "@id": item.getAttribute('rdf:about'),
                "name": identifier && identifier.nodeTypedValue.split(':').pop().trim(),
                "title": label && label.innerText(),
                "description": comment && comment.innerText(),
                "type": type
            };    
        });
    }

    /**
     * Reads RDF rdf:Property and returns an array of data fields.
     * @private
     * @return {import('@themost/common').DataFieldBase[]}
     */
    readProperties(document, domain) {
        return document.selectNodes(`rdf:RDF/rdf:Property/rdfs:domain[@rdf:resource='${domain}']/..`).map((item) => {
            const propertyType = item.selectSingleNode('rdf:type[@rdf:resource]');
            const about = item.getAttribute('rdf:about');
            // get identifier
            let name = null;
            const identifierNode = item.selectSingleNode('dc:identifier');
            if (identifierNode) {
                name = identifierNode && identifierNode.nodeTypedValue.split(':').pop().trim();
            } else {
                // get identifier from about
                name = new URL(about).pathname.split('/').pop().trim();
            }
            // get label
            let title = item.getAttribute('rdf:label');
            const labelNode = item.selectSingleNode(`rdfs:label[@xml:lang='en']`);
            if (labelNode != null) {
                title = labelNode.nodeTypedValue;
            }
            // get comment
            let description = item.getAttribute('rdf:comment');
            const commentNode = item.selectSingleNode(`rdfs:comment[@xml:lang='en']`);
            if (commentNode != null) {
                title = commentNode.nodeTypedValue;
            }
            let range = item.selectSingleNode('rdfs:range');
            let type = 'Object';
            if (range) {
                const rangeClass = document.selectSingleNode(`rdf:RDF/rdf:Class[@rdf:about='${range.getAttribute('rdf:resource')}']`);
                if (rangeClass) {
                    const identifier = rangeClass.selectSingleNode('dc:identifier');
                    type = identifier.nodeTypedValue;
                }
            }
            return {
                "@id": about,
                "name": name,
                "title": title,
                "description": description,
                "type": type
            };
        });
    }

    /**
     * Reads RDF domain typed properties and returns an array of data fields.
     * @private
     * @param {import('@themost/xml').XDocument} document
     * @param {string} id
     * @return {import('@themost/common').DataFieldBase[]}
     */
    readDataTypeProperties(document, id) {
        return document.documentElement.selectNodes(`owl:DatatypeProperty/rdfs:domain[@rdf:resource='${id}']/..`).map((item) => {
            const label = item.selectSingleNode('rdfs:label');
            const identifier = item.selectSingleNode('dc:identifier');
            const comment = item.selectSingleNode('rdfs:comment');
            const range = item.selectSingleNode('rdfs:range');
            let type = 'String';
            if (range) {
                const resource = range.getAttribute('rdf:resource');
                if (resource === 'http://www.w3.org/2001/XMLSchema#string') {
                    type = 'String';
                }
                else if (resource === 'http://www.w3.org/2001/XMLSchema#integer') {
                    type = 'Integer';
                }
                else if (resource === 'http://www.w3.org/2001/XMLSchema#decimal') {
                    type = 'Number';
                }
                else if (resource === 'http://www.w3.org/2001/XMLSchema#boolean') {
                    type = 'Boolean';
                }
                else if (resource === 'http://www.w3.org/2001/XMLSchema#dateTime') {
                    type = 'DateTime';
                }
                else if (resource === 'ttp://purl.org/dc/terms/date') {
                    type = 'Date';
                }
                else if (resource === 'http://www.w3.org/2001/XMLSchema#duration') {
                    type = 'Duration';
                }
                else if (resource === 'http://www.w3.org/2001/XMLSchema#positiveInteger') {
                    type = 'PositiveInteger';
                }
            }
            return {
                "@id": item.getAttribute('rdf:about'),
                "name": identifier && identifier.nodeTypedValue.split(':').pop().trim(),
                "title": label && label.innerText(),
                "description": comment && comment.innerText(),
                "type": type
            };    
        });
    }

    /**
     * Reads RDF class and returns a data model.
     * @private
     * @param {import('@themost/xml').XNode} element
     * @returns {import('@themost/common').DataModelProperties}
     */
    readRdfClass(element) {
        let label = element.getAttribute('rdfs:label');
        const about = element.getAttribute('rdf:about');
        if (label == null) {
            // get name from about
            const segments = new URL(about).pathname.split('/');
            label = segments[segments.length - 1];
        }
        const model = {
            "$schema": "https://themost-framework.github.io/themost/models/2018/2/schema.json",
            "@id": about,
            "name": label,
            "title": label,
            "hidden": false,
            "sealed": false,
            "abstract": false,
            "version": "1.0.0",
            "fields": [],
            "eventListeners": [],
            "constraints": []
        };
        // get object properties
        const fields = this.readObjectProperties(element.ownerDocument, about);
        // get data type properties
        const otherFields = this.readDataTypeProperties(element.ownerDocument, about);
        fields.push(...otherFields);
        // get properties
        const add = this.readProperties(element.ownerDocument, about);
        fields.push(...add);
        model.fields = fields.sort((a, b) => {
            if (a.name < b.name) return -1;
            if (a.name > b.name) return 1;
            return 0;
        });
        return model;
    }

    /**
     * Reads the RDF xml and returns a collection of data models.
     * @type {string} xml
     * @returns {import('@themost/common').DataModelProperties[]}
     */
    read(xml) {
        /**
         * @type {XDocument}
         */
        const document = XDocument.loadXML(xml);
        const items = document.selectNodes('rdf:RDF/rdfs:Class').map((item) => {
            return this.readRdfClass(item);
        });
        return items;
    }
}

export {
    RdfReader
}