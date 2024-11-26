import { DatabaseCore } from './function/core.js';
import { User } from './function/types.js';
import { dbConfig } from './function/config.js';
import { PasswordService } from './function/password.js';
import { generateUUID } from './function/utils.js';
import { setCookie, getCookie } from './function/cookie.js'

export class UserService extends DatabaseCore {
    constructor() {
        super(dbConfig);
    }

    async registerUser(user: User): Promise<boolean> {
        try {
            user.id = generateUUID();
            await this.executeTransaction<number>('users', 'readwrite', (store) => {
                return store.add(user);
            });
            return true;
        } catch (error) {
            if (error instanceof Error && error.name === 'ConstraintError') {
                throw new Error('Un utilisateur avec cet email existe déjà');
            }
            throw error;
        }
    }

    async loginUser(email: string, password: string): Promise<User | null> {
        if(await this.isUserLoggedIn()) {
            return null;
        }
        return this.executeTransaction<User | null>('users', 'readonly', (store) => {
            const index = store.index('email');
            return index.get(email);
        }).then(async (user: User | null) => {
            if (user && user.password && await PasswordService.comparePassword(password, user.password)) {
                setCookie('sessionId', user.id, { secure: true });
                return user;
            }
            return null;
        });
    }

    async getUserByEmail(email: string): Promise<User | null> {
        return this.executeTransaction<User | null>('users', 'readonly', (store) => {
            const index = store.index('email');
            return index.get(email);
        });
    }
    async getUserById(id: string): Promise<User | null> {
        if (!id) {
            throw new Error('L\'ID de l\'utilisateur ne peut pas être undefined');
        }
        return this.executeTransaction<User | null>('users', 'readonly', (store) => {
            return store.get(id);
        });
    }

    async updateUser(user: User): Promise<void> {
        await this.executeTransaction<IDBValidKey>('users', 'readwrite', (store) => {
            return store.put(user);
        });
    }

    async deleteUser(id: number): Promise<void> {
        await this.executeTransaction<undefined>('users', 'readwrite', (store) => {
            return store.delete(id);
        });
    }

    async isUserLoggedIn(): Promise<boolean> {
        const sessionId = getCookie('sessionId');
        if (sessionId) {
            const user = await this.getUserById(sessionId);
            return user !== null;
        }
        return false;
    }
}

// Export une instance unique du service
export const userService = new UserService(); 