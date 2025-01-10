import { DatabaseCore } from './function/core.js';
import { User } from './function/types.js';
import { dbConfig } from './function/config.js';
import { PasswordService } from './function/password.js';
import { generateUUID } from './function/utils.js';
import { setCookie, getCookie, deleteCookie } from './function/cookie.js'
import { UpdateProfileData } from './function/types.js';


export class UserService extends DatabaseCore {
    private readonly CURRENT_USER_KEY = 'current_user';
    private readonly SESSION_COOKIE_NAME = 'sessionId';

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

    async logout(): Promise<void> {
        try {
            deleteCookie(this.SESSION_COOKIE_NAME);
            
            window.location.href = '/login';
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
            throw new Error('Erreur lors de la déconnexion');
        }
    }

    async getUserByEmail(email: string): Promise<User | null> {
        const users = await this.getAll<User>('users');
        return users.find(user => user.email === email) || null;
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
        const sessionId = getCookie(this.SESSION_COOKIE_NAME);
        if (!sessionId) {
            return false;
        }
        
        try {
            const user = await this.getUserById(sessionId);
            return user !== null;
        } catch (error) {
            return false;
        }
    }

    async getCurrentUser(): Promise<User | null> {
        const sessionId = getCookie(this.SESSION_COOKIE_NAME);
        if (!sessionId) {
            return null;
        }

        try {
            return await this.getUserById(sessionId);
        } catch (error) {
            console.error('Erreur lors de la récupération de l\'utilisateur:', error);
            return null;
        }
    }

    async setCurrentUser(): Promise<User | null> {
        try {
            const sessionId = getCookie('sessionId');
            if (sessionId) {
                const user = await this.getUserById(sessionId);
                return user;
            }
            return null;
        } catch (error) {
            console.error('Erreur lors de la récupération de l\'utilisateur actuel', error);
            return null;
        }
    }

    async updatePassword(oldPassword: string, newPassword: string): Promise<void> {
        const currentUser: User | null = await this.getCurrentUser();
        if (!currentUser) {
            throw new Error('Utilisateur non connecté');
        }

        if (!await PasswordService.comparePassword(oldPassword, currentUser.password)) {
            throw new Error('Mot de passe incorrect');
        }

        const hashedPassword = await PasswordService.hashPassword(newPassword);
        await this.updateUser({ ...currentUser, password: hashedPassword });
    }

    async updateProfile(data: UpdateProfileData): Promise<User> {
        const currentUser: User | null = await this.getCurrentUser();
        if (!currentUser) {
            throw new Error('Utilisateur non connecté');
        }

        // Vérifier si le nouvel email est déjà utilisé
        if (data.email && data.email !== currentUser.email) {
            const existingUser = await this.getUserByEmail(data.email);
            if (existingUser && existingUser.id !== currentUser.id) {
                throw new Error('Cet email est déjà utilisé');
            }
        }

        const updatedUser: User = {
            ...currentUser,
            firstname: data.name || currentUser.firstname,
            email: data.email || currentUser.email,
            profile_picture: data.profileImage || currentUser.profile_picture,
            updatedAt: Date.now()
        };

        await this.update('users', updatedUser);
        this.setCurrentUser();

        return updatedUser;
    }
}

// Export une instance unique du service
export const userService = new UserService(); 