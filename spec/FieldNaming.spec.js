import { FieldNaming } from "../src";

describe('FieldNaming', () => {
    it('should format field', async () => {
       let formatter = new FieldNaming();
       let name = await formatter.format('calendartype');
       expect(name).toEqual('calendarType');
       formatter = new FieldNaming({ separator: '_', camelCase: false });
       name = await formatter.format('userid');
       expect(name).toEqual('user_id');
    });
    it('should format fields', async () => {
        let fields = [
            'id', 'name', 'shortname', 'description', 'sortorder', 'archetype'
        ]
        let formatter = new FieldNaming({ separator: '', camelCase: true });
        let newFields = [];
        for (const field of fields) {
            let name = await formatter.format(field);
            newFields.push(name);
        }
        expect(newFields).toEqual([
            'id', 'name', 'shortName', 'description', 'sortOrder', 'archetype'
        ]);
        fields = [
            'id', 'auth', 'confirmed', 'policyagreed', 'deleted', 'suspended', 'mnethostid', 'username', 'password', 'idnumber', 'firstname', 'lastname', 'email'
        ];
        newFields = [];
        for (const field of fields) {
            let name = await formatter.format(field);
            newFields.push(name);
        }
        expect(newFields).toEqual([
            'id', 'auth', 'confirmed', 'policyAgreed', 'deleted', 'suspended', 'mnethostid', 'username', 'password', 'idNumber', 'firstName', 'lastName', 'email'
        ])
    });
});