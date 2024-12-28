// La classe PasswordService fournit des méthodes pour le hachage et la comparaison des mots de passe, 

export class PasswordService {

    static async hashPassword(password: string) {
        const salt = this.generateSalt();
        const hash = await this.pbkdf2(password, salt, 1000, 64, 'SHA-512');
        return `${salt}:${hash}`;
    }

    static generateSalt() {
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);
        return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    static async pbkdf2(password: string, salt: string, iterations: number, keyLength: number, hashAlgorithm: string) {
        const encoder = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            { name: 'PBKDF2' },
            false,
            ['deriveBits']
        );

        const derivedBits = await crypto.subtle.deriveBits(
            {
                name: 'PBKDF2',
                salt: encoder.encode(salt),
                iterations: iterations,
                hash: hashAlgorithm
            },
            keyMaterial,
            keyLength * 8 // Convert to bits
        );

        return Array.from(new Uint8Array(derivedBits))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    static async comparePassword(password: string, storedHash: string) {
        const [salt, hash] = storedHash.split(':');
        const newHash = await this.pbkdf2(password, salt, 1000, 64, 'SHA-512');
        return hash === newHash;
    }
}
