import { UserService } from "../services/user.service.js";

let isChecking = false;

const checkUserLoggedIn = async () => {
    const userService = new UserService();
    const user = await userService.isUserLoggedIn();
    if (!user) {
        window.location.href = '/login';
    } else {
        isChecking = true;
        main?.classList.remove('hidden');
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        checkUserLoggedIn();
    });
} else {
    checkUserLoggedIn();
}

const main = document.getElementById('main');
if (!isChecking) {
    main?.classList.add('hidden');
}

const goTo = (path: string) => {
    window.location.href = path;
};
