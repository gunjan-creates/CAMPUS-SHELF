(() => {
    'use strict';

    document.documentElement.classList.add('animations-ready');

    const STORAGE_KEY = 'campusShelfUsers';
    const SESSION_KEY = 'campusShelfSession';
    const PENDING_KEY = 'campusShelfPendingVerification';
    const RESET_KEY = 'campusShelfPasswordReset';
    const ADMIN_EMAIL = 'admin@campus-shelf.com';
    const ADMIN_PASSWORD = 'CampusShelf@Admin2025';
    const PASSWORD_SALT = '|campus-shelf|2025';
    const VERIFICATION_WINDOW = 10 * 60 * 1000; // 10 minutes

    const state = {
        pendingVerification: null,
        resetContext: null
    };

    const loginForm = document.querySelector('.login-form');
    const registerForm = document.getElementById('registerForm');
    const verificationForm = document.getElementById('verificationForm');
    const forgotForm = document.getElementById('forgotForm');
    const modalBackdrop = document.querySelector('[data-modal-backdrop]');
    const modals = Array.from(document.querySelectorAll('.modal'));
    const animateNodes = document.querySelectorAll('[data-animate]');
    const providerPreview = document.querySelector('[data-provider-preview]');
    const providerImage = document.querySelector('[data-provider-image]');
    const providerHeading = document.querySelector('[data-provider-heading]');
    const providerCopy = document.querySelector('[data-provider-copy]');

    ensureAdminAccount();
    hydratePendingVerification();
    enableAnimations();
    wireModalControls();
    wireTogglePassword();
    wireLogin();
    wireRegister();
    wireVerification();
    wireForgotPassword();
    hydrateResetContext();
    wireSocialProviders();
    wireProviderPreview();

    function enableAnimations() {
        requestAnimationFrame(() => {
            animateNodes.forEach(node => node.classList.add('animated'));
        });
    }

    function wireModalControls() {
        document.querySelectorAll('[data-modal-open]').forEach(btn => {
            btn.addEventListener('click', () => openModal(btn.getAttribute('data-modal-open')));
        });

        document.querySelectorAll('[data-modal-close]').forEach(btn => {
            btn.addEventListener('click', () => closeModal(btn.closest('.modal')));
        });

        modals.forEach(modal => {
            modal.addEventListener('click', event => {
                if (event.target === modal) {
                    closeModal(modal);
                }
            });
        });

        if (modalBackdrop) {
            modalBackdrop.addEventListener('click', closeAllModals);
        }

        document.addEventListener('keydown', event => {
            if (event.key === 'Escape') {
                closeAllModals();
            }
        });
    }

    function wireTogglePassword() {
        const toggle = document.querySelector('[data-toggle-password]');
        if (!toggle || !loginForm) {
            return;
        }
        const icon = toggle.querySelector('i');
        const passwordInput = loginForm.querySelector('#password');
        toggle.addEventListener('click', () => {
            if (!passwordInput) {
                return;
            }
            const show = passwordInput.type === 'password';
            passwordInput.type = show ? 'text' : 'password';
            if (icon) {
                icon.classList.toggle('fa-eye', !show);
                icon.classList.toggle('fa-eye-slash', show);
            }
        });
    }

    function wireLogin() {
        if (!loginForm) {
            return;
        }
        loginForm.addEventListener('submit', event => {
            event.preventDefault();
            const alertBox = loginForm.querySelector('[data-login-alert]');
            clearAlert(alertBox);

            const identifier = (loginForm.username?.value || '').trim().toLowerCase();
            const password = loginForm.password?.value || '';

            if (!identifier || !password) {
                showAlert(alertBox, 'Enter your email or username and password to continue.', 'error');
                return;
            }

            const users = loadUsers();
            const user = users.find(entry => entry.email.toLowerCase() === identifier || entry.username.toLowerCase() === identifier);

            if (!user) {
                showAlert(alertBox, 'No account found with those details. Please register first.', 'error');
                return;
            }

            if (!verifyPassword(password, user.password)) {
                showAlert(alertBox, 'Incorrect password. Try again or reset it.', 'error');
                return;
            }

            if (!user.verified) {
                const code = refreshVerificationCode(user, users);
                showAlert(alertBox, 'Your account needs verification. We generated a new code for you.', 'info');
                openModal('verificationModal');
                updateVerificationHelper(code, user.email);
                return;
            }

            establishSession(user);
            showAlert(alertBox, `Welcome back, ${user.name.split(' ')[0]}! Redirecting to your library...`, 'success');
            setTimeout(() => {
                window.location.href = 'Campus Shelf.html';
            }, 700);
        });
    }

    function wireRegister() {
        if (!registerForm) {
            return;
        }
        registerForm.addEventListener('submit', event => {
            event.preventDefault();
            const alertBox = registerForm.querySelector('[data-register-alert]');
            clearAlert(alertBox);

            const name = (registerForm.name?.value || '').trim();
            const email = (registerForm.email?.value || '').trim().toLowerCase();
            const password = registerForm.password?.value || '';
            const confirm = registerForm.confirm?.value || '';
            const provider = registerForm.querySelector('input[name="provider"]:checked')?.value || 'email';
            const termsAccepted = registerForm.querySelector('#registerTerms')?.checked;

            if (!name || !email || !password || !confirm) {
                showAlert(alertBox, 'Fill out every field to create your account.', 'error');
                return;
            }

            if (!termsAccepted) {
                showAlert(alertBox, 'Please accept the honor code and privacy policy to continue.', 'error');
                return;
            }

            if (password !== confirm) {
                showAlert(alertBox, 'Passwords do not match. Make sure both fields align.', 'error');
                return;
            }

            if (!isStrongPassword(password)) {
                showAlert(alertBox, 'Use at least 8 characters with a number and symbol for a strong password.', 'error');
                return;
            }

            const users = loadUsers();
            if (users.some(entry => entry.email.toLowerCase() === email)) {
                showAlert(alertBox, 'An account already exists with that email. Try logging in instead.', 'error');
                return;
            }

            const username = createUniqueUsername(name, email, users);
            const now = Date.now();

            const newUser = {
                id: createId(),
                name,
                email,
                username,
                password: hashPassword(password),
                provider,
                role: 'member',
                verified: provider !== 'email',
                createdAt: now
            };

            if (provider === 'email') {
                const code = generateCode();
                newUser.verificationCode = code;
                newUser.verificationExpires = now + VERIFICATION_WINDOW;
                keepPendingVerification({ email: newUser.email, code, expiresAt: newUser.verificationExpires });
                updateVerificationHelper(code, newUser.email);
            }

            users.push(newUser);
            saveUsers(users);

            registerForm.reset();
            const defaultOption = registerForm.querySelector('input[value="email"]');
            if (defaultOption) {
                defaultOption.checked = true;
            }
            updateProviderPreview('email');

            if (provider === 'email') {
                showAlert(alertBox, 'Account created! Enter the verification code we generated to activate access.', 'success');
                setTimeout(() => {
                    closeModal(document.getElementById('registerModal'));
                    openModal('verificationModal');
                }, 600);
            } else {
                showAlert(alertBox, `All set! We connected your ${capitalize(provider)} account. You can sign in now.`, 'success');
                setTimeout(() => {
                    closeModal(document.getElementById('registerModal'));
                    loginForm.username.value = email;
                    loginForm.password.focus();
                }, 700);
            }
        });
    }

    function wireVerification() {
        if (!verificationForm) {

    function wireProviderPreview() {
        if (!registerForm || !providerPreview) {
            return;
        }
        const radios = registerForm.querySelectorAll('input[name="provider"]');
        radios.forEach(radio => {
            radio.addEventListener('change', () => updateProviderPreview(radio.value));
        });
        const checked = registerForm.querySelector('input[name="provider"]:checked');
        updateProviderPreview(checked ? checked.value : 'email');
    }

    const providerAssets = {
        email: {
            heading: 'Campus email access',
            copy: 'Use your campus inbox for our classic verification with a 6-digit code.',
            image: 'https://images.unsplash.com/photo-1587613864521-79fef05ae49b?auto=format&fit=crop&w=300&q=60'
        },
        google: {
            heading: 'Google single sign-on',
            copy: 'Link your Google account for instant access and synced bookmarks.',
            image: 'https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=300&q=60'
        },
        github: {
            heading: 'GitHub developer setup',
            copy: 'Perfect for coding clubs—sync repositories and tech reading lists.',
            image: 'https://images.unsplash.com/photo-1517433456452-f9633a875f6f?auto=format&fit=crop&w=300&q=60'
        },
        facebook: {
            heading: 'Facebook community login',
            copy: 'Join with your social identity and discover peer-led study circles.',
            image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=300&q=60'
        }
    };

    function updateProviderPreview(provider) {
        if (!providerPreview) {
            return;
        }
        const asset = providerAssets[provider] || providerAssets.email;
        if (providerImage) {
            providerImage.src = asset.image;
        }
        if (providerHeading) {
            providerHeading.textContent = asset.heading;
        }
        if (providerCopy) {
            providerCopy.textContent = asset.copy;
        }
    }
            return;
        }
        verificationForm.addEventListener('submit', event => {
            event.preventDefault();
            const alertBox = verificationForm.querySelector('[data-verification-alert]');
            clearAlert(alertBox);

            const code = (verificationForm.code?.value || '').trim();
            const pending = state.pendingVerification;

            if (!pending) {
                showAlert(alertBox, 'No pending verification found. Register or request a new code.', 'error');
                return;
            }

            if (!code || code.length !== 6) {
                showAlert(alertBox, 'Enter the 6-digit verification code to continue.', 'error');
                return;
            }

            if (pending.expiresAt && Date.now() > pending.expiresAt) {
                showAlert(alertBox, 'This code has expired. Request a new one from the login page.', 'error');
                return;
            }

            const users = loadUsers();
            const user = users.find(entry => entry.email === pending.email);

            if (!user || user.verificationCode !== code) {
                showAlert(alertBox, 'Invalid code. Double-check and try again.', 'error');
                return;
            }

            user.verified = true;
            delete user.verificationCode;
            delete user.verificationExpires;
            saveUsers(users);
            clearPendingVerification();

            showAlert(alertBox, 'Great! Your account is verified. You can log in now.', 'success');
            setTimeout(() => {
                closeModal(document.getElementById('verificationModal'));
                if (loginForm) {
                    loginForm.username.value = user.email;
                    loginForm.password.focus();
                }
                verificationForm.reset();
            }, 600);
        });
    }

    function wireForgotPassword() {
        if (!forgotForm) {
            return;
        }
        const submitBtn = forgotForm.querySelector('[data-forgot-action]');
        forgotForm.addEventListener('submit', event => {
            event.preventDefault();
            const alertBox = forgotForm.querySelector('[data-forgot-alert]');
            clearAlert(alertBox);

            if (!submitBtn) {
                return;
            }

            const action = submitBtn.getAttribute('data-forgot-action');
            if (action === 'request') {
                handleResetRequest(alertBox, submitBtn);
            } else {
                handlePasswordUpdate(alertBox, submitBtn);
            }
        });
    }

    function handleResetRequest(alertBox, submitBtn) {
        const email = (forgotForm.email?.value || '').trim().toLowerCase();
        if (!email) {
            showAlert(alertBox, 'Enter your registered email address first.', 'error');
            return;
        }

        const users = loadUsers();
        const user = users.find(entry => entry.email === email);
        if (!user) {
            showAlert(alertBox, 'No account uses that email. Verify the address or register a new account.', 'error');
            return;
        }

        const code = generateCode();
        const context = {
            email,
            code,
            expiresAt: Date.now() + VERIFICATION_WINDOW
        };

        user.resetCode = code;
        user.resetExpires = context.expiresAt;
        saveUsers(users);
        keepResetContext(context);
        revealResetFields(true);

        submitBtn.textContent = 'Update Password';
        submitBtn.setAttribute('data-forgot-action', 'reset');
        showAlert(alertBox, `Reset code generated: ${code}. Enter it below within 10 minutes.`, 'info');
    }

    function handlePasswordUpdate(alertBox, submitBtn) {
        const codeInput = forgotForm.code?.value || '';
        const newPassword = forgotForm.newPassword?.value || '';
        const confirmPassword = forgotForm.confirmPassword?.value || '';
        const context = state.resetContext;

        if (!context) {
            showAlert(alertBox, 'No reset request is pending. Start over to receive a code.', 'error');
            return;
        }

        if (!codeInput || codeInput.length !== 6) {
            showAlert(alertBox, 'Enter the 6-digit reset code we issued.', 'error');
            return;
        }

        if (Date.now() > context.expiresAt) {
            showAlert(alertBox, 'This reset code has expired. Request a fresh code.', 'error');
            return;
        }

        if (!newPassword || newPassword !== confirmPassword) {
            showAlert(alertBox, 'Passwords do not match. Re-enter them carefully.', 'error');
            return;
        }

        if (!isStrongPassword(newPassword)) {
            showAlert(alertBox, 'Use at least 8 characters with a number and symbol for security.', 'error');
            return;
        }

        const users = loadUsers();
        const user = users.find(entry => entry.email === context.email);
        if (!user || user.resetCode !== codeInput) {
            showAlert(alertBox, 'The reset code is invalid. Confirm and try again.', 'error');
            return;
        }

        user.password = hashPassword(newPassword);
        delete user.resetCode;
        delete user.resetExpires;
        saveUsers(users);
        clearResetContext();

        showAlert(alertBox, 'Password updated. You can log in with your new credentials now.', 'success');
        setTimeout(() => {
            forgotForm.reset();
            revealResetFields(false);
            submitBtn.textContent = 'Send Reset Code';
            submitBtn.setAttribute('data-forgot-action', 'request');
            closeModal(document.getElementById('forgotModal'));
        }, 700);
    }

    function revealResetFields(visible) {
        forgotForm.querySelectorAll('[data-reset-fields]').forEach(field => {
            field.classList.toggle('hidden', !visible);
        });
    }

    function wireSocialProviders() {
        const buttons = document.querySelectorAll('[data-auth-provider]');
        if (!buttons.length) {
            return;
        }

        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const provider = btn.getAttribute('data-auth-provider');
                if (!provider) {
                    return;
                }
                handleSocialAuth(provider);
            });
        });
    }

    function handleSocialAuth(provider) {
        const alertBox = loginForm?.querySelector('[data-login-alert]');
        clearAlert(alertBox);

        const users = loadUsers();
        const existing = users.find(entry => entry.provider === provider && entry.verified);
        let user = existing;

        if (!user) {
            const generatedEmail = `${provider}@campus-shelf.social`;
            const username = createUniqueUsername(`${capitalize(provider)} User`, generatedEmail, users);
            user = {
                id: createId(),
                name: `${capitalize(provider)} User`,
                email: generatedEmail,
                username,
                password: hashPassword(createId()),
                provider,
                role: 'member',
                verified: true,
                createdAt: Date.now()
            };
            users.push(user);
            saveUsers(users);
        }

        establishSession(user);
        showAlert(alertBox, `Signed in with ${capitalize(provider)}. Taking you to your shelf...`, 'success');
        setTimeout(() => {
            window.location.href = 'Campus Shelf.html';
        }, 500);
    }

    function establishSession(user) {
        const session = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            provider: user.provider,
            verified: user.verified,
            loginAt: Date.now(),
            expiresAt: Date.now() + 2 * 60 * 60 * 1000
        };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
        localStorage.setItem('campusShelfLastLogin', new Date().toISOString());
    }

    function openModal(id) {
        const modal = typeof id === 'string' ? document.getElementById(id) : id;
        if (!modal) {
            return;
        }
        modals.forEach(node => {
            if (node !== modal) {
                node.classList.add('hidden');
            }
        });
        modal.classList.remove('hidden');
        modalBackdrop?.classList.add('active');
        const animated = modal.querySelector('[data-animate]');
        if (animated) {
            animated.classList.remove('animated');
            requestAnimationFrame(() => animated.classList.add('animated'));
        }
    }

    function closeModal(modal) {
        if (!modal) {
            return;
        }
        modal.classList.add('hidden');
        if (!modals.some(node => !node.classList.contains('hidden'))) {
            modalBackdrop?.classList.remove('active');
        }
    }

    function closeAllModals() {
        modals.forEach(node => node.classList.add('hidden'));
        modalBackdrop?.classList.remove('active');
    }

    function showAlert(container, message, type = 'info') {
        if (!container) {
            return;
        }
        container.textContent = message;
        container.classList.remove('hidden', 'info', 'error', 'success');
        container.classList.add(type);
    }

    function clearAlert(container) {
        if (!container) {
            return;
        }
        container.classList.add('hidden');
        container.textContent = '';
        container.classList.remove('info', 'error', 'success');
    }

    function generateCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    function hashPassword(password) {
        return btoa(unescape(encodeURIComponent(password + PASSWORD_SALT)));
    }

    function verifyPassword(password, hash) {
        try {
            return hashPassword(password) === hash;
        } catch (error) {
            console.error('Password verification failed', error);
            return false;
        }
    }

    function isStrongPassword(password) {
        return password.length >= 8 && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password);
    }

    function loadUsers() {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return [];
        }
        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.error('Failed to parse stored users', error);
            return [];
        }
    }

    function saveUsers(users) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    }

    function keepPendingVerification(payload) {
        state.pendingVerification = payload;
        localStorage.setItem(PENDING_KEY, JSON.stringify(payload));
    }

    function clearPendingVerification() {
        state.pendingVerification = null;
        localStorage.removeItem(PENDING_KEY);
        updateVerificationHelper('', '');
        verificationForm?.reset();
    }

    function hydratePendingVerification() {
        const raw = localStorage.getItem(PENDING_KEY);
        if (!raw) {
            return;
        }
        try {
            const parsed = JSON.parse(raw);
            state.pendingVerification = parsed;
            if (parsed?.code && parsed?.email) {
                updateVerificationHelper(parsed.code, parsed.email, parsed.expiresAt);
            }
        } catch (error) {
            console.error('Failed to hydrate verification payload', error);
        }
    }

    function keepResetContext(context) {
        state.resetContext = context;
        localStorage.setItem(RESET_KEY, JSON.stringify(context));
    }

    function hydrateResetContext() {
        if (!forgotForm) {
            return;
        }
        const raw = localStorage.getItem(RESET_KEY);
        if (!raw) {
            return;
        }
        try {
            const parsed = JSON.parse(raw);
            if (!parsed?.email || !parsed?.code) {
                clearResetContext();
                return;
            }
            if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
                clearResetContext();
                return;
            }
            state.resetContext = parsed;
            forgotForm.email.value = parsed.email;
            revealResetFields(true);
            const submitBtn = forgotForm.querySelector('[data-forgot-action]');
            if (submitBtn) {
                submitBtn.textContent = 'Update Password';
                submitBtn.setAttribute('data-forgot-action', 'reset');
            }
            const alertBox = forgotForm.querySelector('[data-forgot-alert]');
            showAlert(alertBox, `Reset code ${parsed.code} is active. Enter it to set a new password.`, 'info');
        } catch (error) {
            console.error('Failed to hydrate reset context', error);
            clearResetContext();
        }
    }

    function clearResetContext() {
        state.resetContext = null;
        localStorage.removeItem(RESET_KEY);
        if (!forgotForm) {
            return;
        }
        revealResetFields(false);
        const submitBtn = forgotForm.querySelector('[data-forgot-action]');
        if (submitBtn) {
            submitBtn.textContent = 'Send Reset Code';
            submitBtn.setAttribute('data-forgot-action', 'request');
        }
    }

    function refreshVerificationCode(user, users) {
        const code = generateCode();
        user.verificationCode = code;
        user.verificationExpires = Date.now() + VERIFICATION_WINDOW;
        keepPendingVerification({ email: user.email, code, expiresAt: user.verificationExpires });
        saveUsers(users);
        updateVerificationHelper(code, user.email, user.verificationExpires);
        return code;
    }

    function updateVerificationHelper(code, email, expiresAt) {
        const helper = verificationForm?.querySelector('[data-verification-helper]');
        if (!helper) {
            return;
        }
        if (!code) {
            helper.textContent = '';
            return;
        }
        const timeRemaining = expiresAt ? Math.max(0, expiresAt - Date.now()) : VERIFICATION_WINDOW;
        const minutes = Math.ceil(timeRemaining / 60000);
        helper.textContent = `Code ${code} for ${email}. Expires in about ${minutes} minute${minutes === 1 ? '' : 's'}.`;
    }

    function createUniqueUsername(name, email, users) {
        const cleaned = name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12);
        const base = cleaned || (email.split('@')[0].replace(/[^a-z0-9]/g, '') || 'member');
        let candidate = base;
        let suffix = 1;
        while (users.some(entry => entry.username === candidate)) {
            candidate = `${base}${suffix}`;
            suffix += 1;
        }
        return candidate;
    }

    function createId() {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID();
        }
        return `id-${Math.random().toString(16).slice(2)}-${Date.now().toString(16)}`;
    }

    function capitalize(value) {
        return value ? value.charAt(0).toUpperCase() + value.slice(1) : '';
    }

    function ensureAdminAccount() {
        const users = loadUsers();
        let admin = users.find(entry => entry.email === ADMIN_EMAIL || entry.role === 'admin');
        if (!admin) {
            admin = {
                id: createId(),
                name: 'Campus Shelf Admin',
                email: ADMIN_EMAIL,
                username: 'admin',
                password: hashPassword(ADMIN_PASSWORD),
                provider: 'email',
                role: 'admin',
                verified: true,
                createdAt: Date.now()
            };
            users.push(admin);
            saveUsers(users);
            return;
        }

        if (!verifyPassword(ADMIN_PASSWORD, admin.password)) {
            admin.password = hashPassword(ADMIN_PASSWORD);
            admin.verified = true;
            saveUsers(users);
        }
    }

})();
