import fs from 'fs';
import path from 'path';
import { URL } from 'url';
import { promisify } from 'util';
import { XDocument, XNode } from '@themost/xml';
import { SyncSeriesEventEmitter } from '@themost/events';
const readFileAsync = promisify(fs.readFile);

class RdfReader {
    constructor() {
        this.afterReadClass = new SyncSeriesEventEmitter();
        this.afterReadProperty = new SyncSeriesEventEmitter();
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
    readAnyObjectProperty(document, id) {
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
     * Returns the identifier by parsing the give URI.
     * @private
     * @param {string} about 
     * @returns {string}
     */
    fromAbout(about) {
        const aboutUri = new URL(about);
        if (aboutUri.hash.length > 0) {
            return aboutUri.hash.substring(1);
        }
        return new URL(about).pathname.split('/').pop().trim();
    }

    /**
     * Selects RDF class properties
     * @protected
     * @param {import('@themost/xml').XNode} element 
     * @returns {XNode[]}
     */
    selectAnyProperty(element) {
        const domain = element.getAttribute('rdf:about');
        return element.ownerDocument.selectNodes(`rdf:RDF/rdf:Property/rdfs:domain[@rdf:resource='${domain}']/..`);
    }

    /**
     * Selects RDF range property
     * @protected
     * @returns {import('@themost/xml').XNode}
     */
    selectRange(element) {
        return element.selectSingleNode('rdfs:range');
    }

    /**
     * Selects RDF comment property
     * @protected
     * @param {import('@themost/xml').XNode} element
     * @returns {import('@themost/xml').XNode}
     */
    selectComment(element) {
       let commentNode = element.selectSingleNode(`rdfs:comment[@xml:lang='en']`);
       if (commentNode != null) {
           return commentNode;
       }
       return element.selectSingleNode(`@rdfs:comment`);
    }

    selectSubClassOf(element) {
        return element.selectSingleNode('rdfs:subClassOf/owl:Class/@rdf:about');
    }

    /**
     * Reads RDF rdf:Property and returns an array of data fields.
     * @protected
     * @param {import('@themost/xml').XNode} element
     * @return {import('@themost/common').DataFieldBase[]}
     */
    readAnyProperty(element) {
        const nodes = this.selectAnyProperty(element);
        return nodes.map((item) => {
            const propertyType = item.selectSingleNode('rdf:type[@rdf:resource]');
            const about = item.getAttribute('rdf:about');
            // get identifier
            let name = null;
            const identifierNode = item.selectSingleNode('dc:identifier');
            if (identifierNode) {
                name = identifierNode && identifierNode.nodeTypedValue.split(':').pop().trim();
            } else {
                // get identifier from about
                name = this.fromAbout(about);
            }
            // get label
            let title = item.getAttribute('rdfs:label');
            const labelNode = item.selectSingleNode(`rdfs:label[@xml:lang='en']`);
            if (labelNode != null) {
                title = labelNode.nodeTypedValue;
            }
            // get description
            let description = null;
            const commentNode = this.selectComment(item);
            if (commentNode != null) {
                description = commentNode.nodeTypedValue;
            }
            // get property range (the type of the property)
            let range = this.selectRange(item);
            let type = 'Object';
            if (range) {
                const resource = range.getAttribute('rdf:resource');
                const rangeClass = element.ownerDocument.selectSingleNode(`rdf:RDF/rdf:Class[@rdf:about='${resource}']`);
                if (rangeClass) {
                    const identifier = rangeClass.selectSingleNode('dc:identifier');
                    if (identifier) {
                        type = identifier.nodeTypedValue;
                    } else {
                        type = rangeClass.getAttribute('rdf:about').split('/').pop().trim();
                    }
                } else {
                    // try to identify type from resource
                    const uri = new URL(resource);
                    if (uri.hash.length === 0) {
                        type = uri.pathname.split('/').pop().trim();
                    } else {
                        type = uri.hash.substring(1);
                    }
                }
            }
            const result = {
                "@id": about,
                "name": name,
                "title": name,
                "description": description,
                "type": type
            };
            return Object.keys(result).reduce((acc, key) => {
                if (Object.prototype.hasOwnProperty.call(result, key) && result[key] != null) {
                    acc[key] = result[key];
                }
                return acc;
            }, {});
        });
    }

    /**
     * Reads RDF domain typed properties and returns an array of data fields.
     * @private
     * @param {import('@themost/xml').XDocument} document
     * @param {string} id
     * @return {import('@themost/common').DataFieldBase[]}
     */
    readAnyDataTypeProperty(document, id) {
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
        let title = element.getAttribute('rdfs:label');
        const about = element.getAttribute('rdf:about');
        if (title == null) {
            title = this.fromAbout(about);
        }
        const name = this.fromAbout(about);
        const model = {
            "$schema": "https://themost-framework.github.io/themost/models/2018/2/schema.json",
            "@id": about,
            "name": name,
            "title": title,
            "hidden": false,
            "sealed": false,
            "abstract": false,
            "inherits": null,
            "implements": null,
            "version": "1.0.0",
            "fields": [],
            "eventListeners": [],
            "constraints": [],
            "privileges": []
        };
        const subClass = this.selectSubClassOf(element);
        if (subClass) {
            model.inherits = this.fromAbout(subClass.nodeTypedValue);
        }
        // get object properties
        const fields = [];
        // get properties
        const add = this.readAnyProperty(element);
        fields.push(...add);
        model.fields = fields.sort((a, b) => {
            if (a.name < b.name) return -1;
            if (a.name > b.name) return 1;
            return 0;
        });
        const result = Object.keys(model).reduce((acc, key) => {
            if (Object.prototype.hasOwnProperty.call(model, key) && model[key] != null) {
                acc[key] = model[key];
            }
            return acc;
        }, {});
        const event = {
            target: this,
            object: result
        }
        this.afterReadClass.emit(event);
        return event.object;
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
        // get rdfs:Class
        let nodes = document.selectNodes('rdf:RDF/rdfs:Class');
        const items = nodes.map((item) => {
            return this.readRdfClass(item);
        });
        // get owl:Class
        nodes = document.selectNodes('rdf:RDF/owl:Class');
        items.push(...nodes.map((item) => {
            return this.readRdfClass(item);
        }));
        return items;
    }
}

class SchemaOrgReader extends RdfReader {
    constructor() {
        super();
        this.afterReadClass.subscribe(function addPrimaryKey(event) {
            /**
             * @type {import('@themost/common').DataModelProperties}
             */
            const model = event.object;
            if (model.name === 'Thing') {
                const primaryKey = model.fields.find((x) => x.primary === true);
                if (primaryKey == null) {
                    model.fields.unshift({
                        '@id': 'https://themost.io/id',
                        'name': 'id',
                        'description': 'A unique identifier for this item',
                        'title': 'id',
                        'type': 'Counter',
                        'primary': true,
                        'editable': false
                    })
                }
                let dateCreated = model.fields.find((x) => x.name === 'dateCreated');
                if (dateCreated == null) {
                    dateCreated = {
                        '@id': 'https://themost.io/dateCreated',
                        'name': 'dateCreated',
                        'description': 'The date and time the item was created',
                        'title': 'dateCreated',
                        'type': 'DateTime',
                        'readonly': true,
                        'value': 'javascript:return new Date();'
                    };
                    model.fields.push(dateCreated);
                }
                let dateModified = model.fields.find((x) => x.name === 'dateModified');
                if (dateModified == null) {
                    dateModified = {
                        '@id': 'https://themost.io/dateModified',
                        'name': 'dateModified',
                        'description': 'The date and time the item was last modified',
                        'title': 'dateModified',
                        'type': 'DateTime',
                        'readonly': true,
                        'value': 'javascript:return new Date();',
                        'calculation': 'javascript:return new Date();'
                    };
                    model.fields.push(dateCreated);
                }
            }
        });
        this.afterReadClass.subscribe(function setAdditionalType(event) {
            /**
             * @type {import('@themost/common').DataModelProperties}
             */
            const model = event.object;
            if (model.name === 'Thing') {
                const additionalType = model.fields.find((x) => x.name === 'additionalType');
                if (additionalType) {
                    additionalType.type = 'Text';
                    additionalType.readonly = true;
                    additionalType.value = 'javascript:return this.model.name;'
                }
            }
        });
    }
    selectRange(element) {
        return element.selectSingleNode('schema:rangeIncludes');
    }
    selectAnyProperty(element) {
        return element.ownerDocument.selectNodes(`rdf:RDF/rdf:Property/schema:domainIncludes[@rdf:resource='${element.getAttribute('rdf:about')}']/..`);
    }
    selectComment(element) {
        return element.selectSingleNode(`rdfs:comment`);
    }
    selectSubClassOf(element) {
        return element.selectSingleNode('rdfs:subClassOf/@rdf:resource');
    }
}

export {
    SchemaOrgReader,
    RdfReader
}