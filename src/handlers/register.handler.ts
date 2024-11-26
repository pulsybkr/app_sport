import { userService } from '../services/user.service.js';
import { User } from '../services/function/types.js';
import { PasswordService } from '../services/function/password.js';
import { showToast } from '../toast.js';

export async function handleRegister(event: Event) {
    event.preventDefault();
    
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    const user: User = {
        email: formData.get('email') as string,
        password: await PasswordService.hashPassword(formData.get('password') as string),
        firstname: formData.get('firstname') as string,
        lastname: formData.get('lastname') as string,
        date_of_birth: formData.get('date_of_birth') as string
    };

    try {
        await userService.registerUser(user);
        showToast('Inscription réussie !', 'success');
        window.location.href = '/login';
    } catch (error: any) {
        showToast(`Erreur lors de l'inscription : ${error.message}`, 'error');
    }
} 