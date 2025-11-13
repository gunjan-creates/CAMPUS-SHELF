(() => {
    'use strict';

    const SESSION_KEY = 'campusShelfSession';
    const USERS_KEY = 'campusShelfUsers';
    const PASSWORD_SALT = '|campus-shelf|2025';
    const ADMIN_PASSWORD = 'CampusShelf@Admin2025';

    let session = getValidSession();
    if (!session) {
        return;
    }

    const bookCards = Array.from(document.querySelectorAll('.book-card'));
    const filterChips = Array.from(document.querySelectorAll('.chip'));
    const searchInput = document.getElementById('searchInput');
    const searchStatus = document.querySelector('[data-search-status]');
    const navLinks = document.querySelectorAll('[data-nav-link]');
    const userNameNode = document.querySelector('[data-user-name]');
    const userRoleNode = document.querySelector('[data-user-role]');
    const userEmailNode = document.querySelector('[data-user-email]');
    const userToggle = document.querySelector('[data-user-toggle]');
    const userDropdown = document.querySelector('[data-user-dropdown]');
    const notificationIcon = document.querySelector('[data-notification]');
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navLinksContainer = document.querySelector('.nav-links');
    const newsletterForm = document.querySelector('.newsletter');
    const contactForm = document.getElementById('contactForm');
    const contactStatus = document.querySelector('[data-contact-status]');
    const adminGuard = document.querySelector('[data-admin-guard]');
    const adminPanel = document.querySelector('[data-admin-content]');
    const adminModal = document.getElementById('adminAccessModal');
    const adminBackdrop = document.querySelector('[data-admin-backdrop]');
    const adminOpeners = document.querySelectorAll('[data-open-admin-modal]');
    const adminCloser = document.querySelector('[data-admin-close]');
    const adminAlert = document.querySelector('[data-admin-alert]');
    const adminForm = document.getElementById('adminAccessForm');

    const adminMetrics = {
        readers: document.querySelector('[data-metric="readers"]'),
        books: document.querySelector('[data-metric="books"]'),
        requests: document.querySelector('[data-metric="requests"]')
    };
    const adminTableBody = document.querySelector('[data-admin-table]');

    const searchState = {
        term: '',
        category: 'all'
    };

    boot();

    function boot() {
        decorateCards();
        setupSearch();
        setupFilters();
        setupSmoothScroll();
        setupMobileMenu();
        setupSectionObserver();
        setupUserMenu();
        setupFollowButtons();
        setupNotifications();
        setupNewsletter();
        setupContactForm();
        setupAdminPanel();
        setupAnimations();
        injectUtilityStyles();
        fadeInOnLoad();
        console.log('🎉 Campus Shelf loaded successfully!');
    }

    function getValidSession() {
        const raw = sessionStorage.getItem(SESSION_KEY);
        if (!raw) {
            redirectToLogin();
            return null;
        }
        try {
            const data = JSON.parse(raw);
            if (!data || (data.expiresAt && Date.now() > data.expiresAt)) {
                sessionStorage.removeItem(SESSION_KEY);
                redirectToLogin();
                return null;
            }
            return data;
        } catch (error) {
            console.error('Failed to parse session', error);
            sessionStorage.removeItem(SESSION_KEY);
            redirectToLogin();
            return null;
        }
    }

    function redirectToLogin() {
        window.location.replace('index.html');
    }

    function persistSession() {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }

    function decorateCards() {
        document.querySelectorAll('.book-card, .author-card, .metric-card, .contact-card, .about-card').forEach(node => {
            if (!node.hasAttribute('data-animate')) {
                node.setAttribute('data-animate', 'rise');
            }
        });
    }

    function setupSearch() {
        if (!searchInput) {
            return;
        }
        updateSearchResults();
        searchInput.addEventListener('input', event => {
            searchState.term = event.target.value.trim().toLowerCase();
            updateSearchResults();
        });
    }

    function setupFilters() {
        if (!filterChips.length) {
            return;
        }
        filterChips.forEach(chip => {
            chip.addEventListener('click', () => {
                filterChips.forEach(node => node.classList.remove('active'));
                chip.classList.add('active');
                searchState.category = chip.dataset.category || 'all';
                updateSearchResults();
            });
        });
    }

    function updateSearchResults() {
        let matches = 0;
        bookCards.forEach(card => {
            const category = card.dataset.category;
            const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
            const author = card.querySelector('.author')?.textContent.toLowerCase() || '';
            const tags = Array.from(card.querySelectorAll('.tag')).map(tag => tag.textContent.toLowerCase()).join(' ');

            const matchesCategory = searchState.category === 'all' || category === searchState.category;
            const matchesTerm = !searchState.term || title.includes(searchState.term) || author.includes(searchState.term) || tags.includes(searchState.term);
            const visible = matchesCategory && matchesTerm;

            card.classList.toggle('hidden', !visible);
            if (visible) {
                card.style.animation = 'fadeIn 0.45s ease';
                matches += 1;
            }
        });

        if (searchStatus) {
            if (matches === bookCards.length && searchState.term === '' && searchState.category === 'all') {
                searchStatus.textContent = 'Showing all featured books.';
            } else if (matches > 0) {
                searchStatus.textContent = `Showing ${matches} of ${bookCards.length} featured books.`;
            } else {
                searchStatus.textContent = 'No results yet. Adjust your search or category.';
            }
            searchStatus.classList.remove('hidden');
        }
    }

    function setupSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', event => {
                const href = anchor.getAttribute('href');
                if (!href || href === '#') {
                    return;
                }
                const target = document.querySelector(href);
                if (target) {
                    event.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
                if (navLinksContainer?.classList.contains('active')) {
                    navLinksContainer.classList.remove('active');
                }
            });
        });
    }

    function setupMobileMenu() {
        if (!mobileMenuToggle || !navLinksContainer) {
            return;
        }
        mobileMenuToggle.addEventListener('click', () => {
            navLinksContainer.classList.toggle('active');
        });
    }

    function setupSectionObserver() {
        const sections = Array.from(document.querySelectorAll('section[id]'));
        if (!sections.length) {
            return;
        }
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');
                    navLinks.forEach(link => {
                        const href = link.getAttribute('href');
                        if (href === `#${id}`) {
                            link.classList.add('active');
                        } else {
                            link.classList.remove('active');
                        }
                    });
                }
            });
        }, { threshold: 0.4 });

        sections.forEach(section => observer.observe(section));
    }

    function setupUserMenu() {
        if (userNameNode) {
            userNameNode.textContent = session.name || 'Guest';
        }
        if (userRoleNode) {
            userRoleNode.textContent = capitalize(session.role || 'Member');
        }
        if (userEmailNode) {
            userEmailNode.textContent = session.email;
        }

        if (!userToggle || !userDropdown) {
            return;
        }

        userToggle.addEventListener('click', event => {
            event.stopPropagation();
            const expanded = userToggle.getAttribute('aria-expanded') === 'true';
            userToggle.setAttribute('aria-expanded', String(!expanded));
            userDropdown.classList.toggle('hidden');
        });

        document.addEventListener('click', event => {
            if (!userDropdown.classList.contains('hidden') && !userDropdown.contains(event.target) && event.target !== userToggle) {
                userDropdown.classList.add('hidden');
                userToggle.setAttribute('aria-expanded', 'false');
            }
        });

        userDropdown.querySelectorAll('[data-action]').forEach(button => {
            button.addEventListener('click', () => {
                const action = button.getAttribute('data-action');
                if (action === 'logout') {
                    sessionStorage.removeItem(SESSION_KEY);
                    window.location.replace('index.html');
                }
                if (action === 'refresh') {
                    session.expiresAt = Date.now() + 2 * 60 * 60 * 1000;
                    persistSession();
                    showToast('Session refreshed. Enjoy your reading!');
                }
            });
        });
    }

    function setupFollowButtons() {
        document.querySelectorAll('.follow-btn').forEach(btn => {
            btn.addEventListener('click', event => {
                event.stopPropagation();
                const following = btn.dataset.state === 'following';
                if (following) {
                    btn.innerHTML = '<i class="fas fa-plus"></i> Follow';
                    btn.dataset.state = 'idle';
                    btn.style.background = 'transparent';
                    btn.style.color = 'var(--primary-color)';
                    btn.style.borderColor = 'var(--primary-color)';
                } else {
                    btn.innerHTML = '<i class="fas fa-check"></i> Following';
                    btn.dataset.state = 'following';
                    btn.style.background = 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))';
                    btn.style.color = 'white';
                    btn.style.borderColor = 'transparent';
                }
            });
        });
    }

    function setupNotifications() {
        if (!notificationIcon) {
            return;
        }
        setInterval(() => {
            notificationIcon.style.animation = 'shake 0.5s ease';
            setTimeout(() => {
                notificationIcon.style.animation = '';
            }, 500);
        }, 6000);
    }

    function setupNewsletter() {
        if (!newsletterForm) {
            return;
        }
        const input = newsletterForm.querySelector('input');
        const button = newsletterForm.querySelector('button');
        if (!input || !button) {
            return;
        }
        button.addEventListener('click', event => {
            event.preventDefault();
            if (!input.value.trim()) {
                showToast('Enter an email to subscribe.');
                return;
            }
            showToast('Thanks for subscribing! We will keep you updated.');
            input.value = '';
        });
    }

    function setupContactForm() {
        if (!contactForm || !contactStatus) {
            return;
        }
        contactForm.addEventListener('submit', event => {
            event.preventDefault();
            const formData = new FormData(contactForm);
            const name = formData.get('name');
            contactStatus.textContent = `Thanks ${name}! Our team will reach out shortly.`;
            contactForm.reset();
            setTimeout(() => {
                contactStatus.textContent = '';
            }, 5000);
        });
    }

    function setupAdminPanel() {
        if (!adminGuard || !adminPanel || !adminForm) {
            return;
        }

        const unlockIfAdmin = () => {
            if (session.role === 'admin' || session.isAdminUnlocked) {
                showAdminPanel();
            }
        };

        unlockIfAdmin();

        adminOpeners.forEach(btn => {
            btn.addEventListener('click', () => openAdminModal());
        });

        adminBackdrop?.addEventListener('click', closeAdminModal);
        adminCloser?.addEventListener('click', closeAdminModal);

        adminForm.addEventListener('submit', event => {
            event.preventDefault();
            clearAlert(adminAlert);
            const input = adminForm.password.value.trim();
            if (!input) {
                showAlert(adminAlert, 'Enter the admin password to continue.', 'error');
                return;
            }

            if (validateAdminPassword(input)) {
                session.isAdminUnlocked = true;
                session.role = 'admin';
                persistSession();
                showAdminPanel();
                showAlert(adminAlert, 'Admin dashboard unlocked!', 'success');
                setTimeout(() => {
                    closeAdminModal();
                    adminForm.reset();
                    clearAlert(adminAlert);
                }, 600);
            } else {
                showAlert(adminAlert, 'Incorrect password. Please try again.', 'error');
            }
        });
    }

    function validateAdminPassword(input) {
        const users = loadUsers();
        const adminUser = users.find(user => user.role === 'admin');
        if (!adminUser) {
            return input === ADMIN_PASSWORD;
        }
        return hashPassword(input) === adminUser.password;
    }

    function showAdminPanel() {
        adminGuard.classList.add('hidden');
        adminPanel.classList.remove('hidden');
        populateAdminMetrics();
        populateAdminTable();
        if (userRoleNode) {
            userRoleNode.textContent = 'Admin';
        }
    }

    function populateAdminMetrics() {
        const users = loadUsers();
        const verifiedMembers = users.filter(user => user.role !== 'admin' && user.verified).length;
        const unverifiedMembers = users.filter(user => user.role !== 'admin' && !user.verified).length;

        if (adminMetrics.readers) {
            adminMetrics.readers.textContent = verifiedMembers;
        }
        if (adminMetrics.books) {
            adminMetrics.books.textContent = bookCards.length;
        }
        if (adminMetrics.requests) {
            adminMetrics.requests.textContent = unverifiedMembers;
        }
    }

    function populateAdminTable() {
        if (!adminTableBody) {
            return;
        }
        const users = loadUsers().filter(user => !user.verified && user.role !== 'admin');
        if (!users.length) {
            adminTableBody.innerHTML = '<tr><td colspan="4">No pending verifications. Great job!</td></tr>';
            return;
        }
        adminTableBody.innerHTML = users.map(user => {
            const joined = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—';
            return `<tr><td>${escapeHtml(user.name)}</td><td>${escapeHtml(user.email)}</td><td>Unverified</td><td>${joined}</td></tr>`;
        }).join('');
    }

    function openAdminModal() {
+        adminBackdrop?.classList.add('active');
        adminModal?.classList.remove('hidden');
    }

    function closeAdminModal() {
        adminBackdrop?.classList.remove('active');
        adminModal?.classList.add('hidden');
        adminForm.reset();
        clearAlert(adminAlert);
    }

    function setupAnimations() {
        const animatedNodes = document.querySelectorAll('[data-animate]');
        if (!animatedNodes.length) {
            return;
        }
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                }
            });
        }, { threshold: 0.2, rootMargin: '0px 0px -50px 0px' });

        animatedNodes.forEach(node => observer.observe(node));
    }

    function injectUtilityStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; transform: scale(0.95); }
                to { opacity: 1; transform: scale(1); }
            }
            @keyframes shake {
                0%, 100% { transform: rotate(0deg); }
                25% { transform: rotate(-10deg); }
                75% { transform: rotate(10deg); }
            }
            .nav-links.active {
                display: flex !important;
                flex-direction: column;
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: white;
                padding: 20px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                gap: 10px;
            }
        `;
        document.head.appendChild(style);
    }

    function fadeInOnLoad() {
        window.addEventListener('load', () => {
            document.body.style.opacity = '0';
            setTimeout(() => {
                document.body.style.transition = 'opacity 0.5s ease';
                document.body.style.opacity = '1';
            }, 80);
        });
    }

    function loadUsers() {
        const raw = localStorage.getItem(USERS_KEY);
        if (!raw) {
            return [];
        }
        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.error('Unable to parse stored users', error);
            return [];
        }
    }

    function hashPassword(password) {
        return btoa(unescape(encodeURIComponent(password + PASSWORD_SALT)));
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

    function showToast(message) {
        console.log(message);
    }

    function escapeHtml(value) {
        return value.replace(/[&<>'"]/g, char => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        })[char]);
    }

    function capitalize(value) {
        return value ? value.charAt(0).toUpperCase() + value.slice(1) : '';
    }

})();
