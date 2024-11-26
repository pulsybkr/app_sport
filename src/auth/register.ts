import { showToast } from "../toast.js";
import { userService } from '../services/user.service.js';
import { User } from '../services/function/types.js';
import { PasswordService } from '../services/function/password.js';
document.getElementById('registerForm')?.addEventListener('submit', async function (event) {
    event.preventDefault();
    const emailElement = document.getElementById('email') as HTMLInputElement;
    const passwordElement = document.getElementById('password') as HTMLInputElement;
    const firstnameElement = document.getElementById('firstname') as HTMLInputElement;
    const lastnameElement = document.getElementById('lastname') as HTMLInputElement;
    const date_of_birthElement = document.getElementById('date_of_birth') as HTMLInputElement;

    if (emailElement && passwordElement && firstnameElement && lastnameElement && date_of_birthElement) {
        const email = emailElement.value;
        const password = passwordElement.value;
        const firstname = firstnameElement.value;
        const lastname = lastnameElement.value;
        const date_of_birth = date_of_birthElement.value;
        if (email === '' || password === '' || firstname === '' || lastname === '' || date_of_birth === '') {
            showToast('Tous les champs sont requis', 'error');
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;

            if (!emailRegex.test(email)) {
                showToast('Le format de l\'email est invalide', 'error');
                return;
            }

            if (!passwordRegex.test(password)) {
                showToast('Le mot de passe doit contenir au moins 8 caractères, une lettre majuscule, une lettre minuscule et un chiffre', 'error');
                return;
            }

            const hashedPassword = await PasswordService.hashPassword(password);
            
            handleRegister({email, password: hashedPassword, firstname, lastname, date_of_birth});

        }
    } else {
        showToast('All fields are required', 'error');
    }
});


export async function handleRegister(user: User) {
    try {
        await userService.registerUser(user);
        showToast('Inscription réussie ! Vous allez être redirigé vers la page de connexion', 'success');
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 1000);
    } catch (error: any) {
        showToast(`Erreur lors de l'inscription : ${error.message}`, 'error');
    }
} 

console.log('login.ts');
