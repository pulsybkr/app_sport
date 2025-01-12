import { UserService } from "../services/user.service.js";

let isChecking = false;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        console.log('middleware');
        checkUserLoggedIn();
    });
} else {
    console.log('middleware - DOM déjà chargé');
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
