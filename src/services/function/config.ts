import { DBConfig } from './types.js';

export const dbConfig: DBConfig = {
    name: 'UserDatabase',
    version: 3,
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
        },
        {
            name: 'activities',
            keyPath: 'id',
            indexes: [
                {
                    name: 'userId',
                    keyPath: 'userId',
                    options: { unique: false }
                },
                {
                    name: 'date',
                    keyPath: 'date',
                    options: { unique: false }
                },
                {
                    name: 'status',
                    keyPath: 'status',
                    options: { unique: false }
                }
            ]
        }
    ]
}; 