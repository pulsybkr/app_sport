import { UserService } from "../services/user.service.js";
import { showToast } from "../toast.js";

document.getElementById('loginForm')?.addEventListener('submit', async function (event) {
    event.preventDefault();
    const emailElement = document.getElementById('email') as HTMLInputElement;
    const passwordElement = document.getElementById('password') as HTMLInputElement;

    if (emailElement && passwordElement) {
        const email = emailElement.value;
        const password = passwordElement.value;
        if (email === '' || password === '') {
            showToast('Tous les champs sont requis', 'error');
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showToast('Le format de l\'email est invalide', 'error');
                return;
            }
            await handleLogin(email, password);
        }
    }
});

const handleLogin = async (email: string, password: string) => {
    const userService = new UserService();
    // console.log('handleLogin');
    // console.log(email, password);
    const user = await userService.loginUser(email, password);
    if (!user) {
        showToast('Email ou mot de passe incorrect', 'error');
        return;
    }
    showToast('Connexion réussie', 'success');
    setTimeout(() => {
        window.location.href = '/dashboard';
    }, 1000);
}

document.addEventListener('DOMContentLoaded', async () => {
    await checkUserLoggedIn();
});

const checkUserLoggedIn = async () => {
    const userService = new UserService();
    const user = await userService.isUserLoggedIn();
    if (user) {
        window.location.href = '/dashboard';
    }
};

document.querySelector('#loginButton')?.addEventListener('click', async function (event) {
    event.preventDefault();
    console.log('login');
});

console.log('login.ts');