export function setCookie(name: string, value: string | undefined, options: { secure?: boolean; expires?: number } = {}): void {
    if (!value) {
        throw new Error('La valeur du cookie ne peut pas être undefined');
    }
    console.log(value);
    let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
    if (options.expires) {
        const date = new Date();
        date.setTime(date.getTime() + options.expires * 1000);
        cookieString += `; expires=${date.toUTCString()}`;
    }
    if (options.secure) {
        cookieString += '; secure';
    }
    document.cookie = cookieString;
}

export function getCookie(name: string): string | undefined {
    const cookieArr = document.cookie.split(';');
    for (let i = 0; i < cookieArr.length; i++) {
        const cookiePair = cookieArr[i].trim();
        if (cookiePair.startsWith(`${encodeURIComponent(name)}=`)) {
            return decodeURIComponent(cookiePair.split('=')[1]);
        }
    }
    return undefined;
}