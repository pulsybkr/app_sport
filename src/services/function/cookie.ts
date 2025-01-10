interface CookieOptions {
    path?: string;
    expires?: Date | number;
    maxAge?: number;
    domain?: string;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
}

export function setCookie(name: string, value: string, options: CookieOptions = {}): void {
    if (!name) throw new Error('Le nom du cookie est requis');
    
    let cookieString = `${encodeURIComponent(name)}=`;
    
    if (value !== '') {
        cookieString += encodeURIComponent(value);
    }

    if (options.expires) {
        if (typeof options.expires === 'number') {
            options.expires = new Date(Date.now() + options.expires * 1000);
        }
        cookieString += `; expires=${options.expires.toUTCString()}`;
    }

    if (options.maxAge) {
        cookieString += `; max-age=${options.maxAge}`;
    }

    if (options.domain) {
        cookieString += `; domain=${options.domain}`;
    }

    if (options.path) {
        cookieString += `; path=${options.path}`;
    }

    if (options.secure) {
        cookieString += '; secure';
    }

    if (options.sameSite) {
        cookieString += `; samesite=${options.sameSite}`;
    }

    document.cookie = cookieString;
}

export function getCookie(name: string): string | null {
    if (!name) return null;
    const matches = document.cookie.match(new RegExp(
        "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
    ));
    return matches ? decodeURIComponent(matches[1]) : null;
}

export function deleteCookie(name: string): void {
    setCookie(name, '', {
        path: '/',
        expires: new Date(0)
    });
}