import { UserService } from "../services/user.service.js";

let isChecking = false;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        console.log('middleware');
        checkUserLoggedIn();
    });
} else {
    // Le DOM est déjà chargé
    console.log('middleware - DOM déjà chargé');
    checkUserLoggedIn();
}

const main = document.getElementById('main');
if (!isChecking) {
    main?.classList.add('hidden');
}
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
if (isChecking) {
    main?.classList.remove('hidden');
}
