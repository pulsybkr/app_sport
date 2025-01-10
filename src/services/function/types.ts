// Types communs pour la base de données
export interface User {
    id?: string;
    email: string;
    password: string;
    firstname: string;
    lastname: string;
    date_of_birth: string;
    profile_picture?: string;
    updatedAt?: number;
}

export interface DBStore {
    name: string;
    keyPath: string;
    indexes: Array<{
        name: string;
        keyPath: string;
        options?: IDBIndexParameters;
    }>;
}

export interface DBConfig {
    name: string;
    version: number;
    stores: DBStore[];
} 

export interface UpdateProfileData {
    name?: string;
    email?: string;
    profileImage?: string;
}