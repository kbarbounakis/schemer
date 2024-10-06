# @themost/schemer

A collection of utilities for working with database schemas across environments with different naming conventions.

## Installation

```bash
npm install @themost/schemer
```

## Usage

Use FieldNaming class to format field names according to a specific naming convention.

```javascript

const { FieldNaming } = require('@themost/schemer');
const naming = new FieldNaming();
const fieldName = naming.format('first_name');
console.log(fieldName); // Output: 'firstName'

```

We can customize the naming convention by passing a configuration object to the FieldNaming constructor.

```javascript
const { FieldNaming } = require('@themost/schemer');
const naming = new FieldNaming({
    camelCase: false,
    separator: '_',
});
const fieldName = naming.format('firstname');
console.log(fieldName); // Output: 'first_name'
```

`camelCase` property is used to specify whether the naming convention is camel case or not. Default value is `true`.

`separator` property is used to specify the separator character. Default value is `''`.