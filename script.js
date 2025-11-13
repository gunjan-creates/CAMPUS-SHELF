// Search Functionality
const searchInput = document.getElementById('searchInput');
const bookCards = document.querySelectorAll('.book-card');

searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    
    bookCards.forEach(card => {
        const title = card.querySelector('h3').textContent.toLowerCase();
        const author = card.querySelector('.author').textContent.toLowerCase();
        const tags = Array.from(card.querySelectorAll('.tag')).map(tag => tag.textContent.toLowerCase()).join(' ');
        
        if (title.includes(searchTerm) || author.includes(searchTerm) || tags.includes(searchTerm)) {
            card.style.display = 'block';
            card.style.animation = 'fadeIn 0.5s ease';
        } else {
            card.style.display = 'none';
        }
    });
});

// Category Filter Functionality
const filterChips = document.querySelectorAll('.chip');

filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
        // Remove active class from all chips
        filterChips.forEach(c => c.classList.remove('active'));
        // Add active class to clicked chip
        chip.classList.add('active');
        
        const category = chip.getAttribute('data-category');
        
        bookCards.forEach(card => {
            if (category === 'all' || card.getAttribute('data-category') === category) {
                card.style.display = 'block';
                card.style.animation = 'fadeIn 0.5s ease';
            } else {
                card.style.display = 'none';
            }
        });
    });
});

// Smooth Scroll for Navigation Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Mobile Menu Toggle
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const navLinks = document.querySelector('.nav-links');

if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });
}

// Book Card Animations on Scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all book and author cards
document.querySelectorAll('.book-card, .author-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = 'all 0.6s ease';
    observer.observe(card);
});

// Follow Button Toggle
document.querySelectorAll('.follow-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (btn.innerHTML.includes('Follow')) {
            btn.innerHTML = '<i class="fas fa-check"></i> Following';
            btn.style.background = 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))';
            btn.style.color = 'white';
            btn.style.borderColor = 'transparent';
        } else {
            btn.innerHTML = '<i class="fas fa-plus"></i> Follow';
            btn.style.background = 'transparent';
            btn.style.color = 'var(--primary-color)';
            btn.style.borderColor = 'var(--primary-color)';
        }
    });
});

// Notification Icon Animation
const notificationIcon = document.querySelector('.notification-icon');
if (notificationIcon) {
    setInterval(() => {
        notificationIcon.style.animation = 'shake 0.5s ease';
        setTimeout(() => {
            notificationIcon.style.animation = '';
        }, 500);
    }, 5000);
}

// Add shake animation to CSS dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: scale(0.95);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
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
    }
`;
document.head.appendChild(style);

// Newsletter Form Handler
const newsletterForm = document.querySelector('.newsletter');
if (newsletterForm) {
    const newsletterBtn = newsletterForm.querySelector('button');
    newsletterBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const email = newsletterForm.querySelector('input').value;
        if (email) {
            alert('Thank you for subscribing! We will keep you updated.');
            newsletterForm.querySelector('input').value = '';
        }
    });
}

// Add loading animation
window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
});

console.log('🎉 Campus Shelf loaded successfully!');
