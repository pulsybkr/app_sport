import { DBConfig } from './types.js';

export const dbConfig: DBConfig = {
    name: 'UserDatabase',
    version: 1,
    stores: [
        {
            name: 'users',
            keyPath: 'id',
            indexes: [
                {
                    name: 'email',
                    keyPath: 'email',
                    options: { unique: true }
                }
            ]
        }
        // Ajoutez d'autres stores ici au besoin
        // Par exemple:
        // {
        //     name: 'products',
        //     keyPath: 'id',
        //     indexes: [
        //         { name: 'name', keyPath: 'name' }
        //     ]
        // }
    ]
}; 