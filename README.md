# Campus Shelf

Campus Shelf is a fully animated campus library experience that blends a modern login flow with a rich browsing dashboard. It provides student-friendly discovery tools, an admin review console, and simulated authentication so you can demo the complete journey without a backend server.

## Tech Stack
- HTML5 for semantic structure across the login portal and library dashboard
- Vanilla CSS (two themed stylesheets) for glassmorphism, gradients, and responsive layouts
- JavaScript (ES2020) for authentication flow, localStorage/sessionStorage state, and interactive UI behaviors
- Font Awesome 6 for iconography

## Key Features
- **Authentication sandbox:** Email and social sign-up, verification codes, password resets, and persistent sessions powered by localStorage
- **Animated UX:** Intersection-driven reveals, micro-interactions, and smooth scrolling across every section
- **Search and filters:** Real-time keyword search plus category chips that instantly refine the featured books grid
- **Responsive navigation:** Sticky navbar with mobile drawer, active-section highlighting, and user dropdown controls
- **Admin console:** Password-protected dashboard with metrics and a live queue of unverified users (admin password: `CampusShelf@Admin2025`)
- **Engagement tools:** Newsletter opt-in, contact form acknowledgements, follow buttons, and notification animation

## Getting Started
1. Open `index.html` in a modern browser to access the login portal.
2. Register a new account (email sign-up requires a 6-digit verification code shown in-app). Social buttons create verified demo users instantly.
3. Sign in to reach `Campus Shelf.html`, the main library interface. Session details persist in `sessionStorage` until logout or expiry.
4. Use the search bar, category chips, and navigation links to explore the animated sections.
5. Unlock the admin dashboard with the admin password above. The default admin account (`admin@campus-shelf.com`) is provisioned automatically.

## Usage Guide
- **Registration & verification:** Submit the register form, copy the displayed 6-digit code, and confirm it inside the verification modal to activate your account.
- **Social sign-in:** Click any provider button to spawn a fully verified demo profile—perfect for quick previews.
- **Password management:** Use the forgot password flow to request a reset token, then set a new password in the follow-up modal.
- **Session handling:** Successful sign-in stores a session in `sessionStorage`; logging out clears it and redirects back to the login portal.
- **Admin unlock:** Open the admin access modal from the dashboard, enter `CampusShelf@Admin2025`, and the guard view swaps to the metrics/table console.
- **Content exploration:** Search trims the featured grid in real time, while category chips filter by genre with smooth card animations.
- **Engagement widgets:** The contact form thanks the sender inline and the newsletter button provides instant feedback without page reloads.

## Animations & UX Highlights
- Elements with `[data-animate]` fade and rise into view via an IntersectionObserver-powered reveal system.
- Cards, buttons, and navigation affordances use subtle transforms and shadow transitions to communicate state changes.
- Mobile navigation collapses into a toggle-driven drawer that inherits the same animated styling for consistency.

## Project Structure
- `index.html` / `style.css` — authentication portal and modal flows
- `Campus Shelf.html` / `Campus Shelf.css` — library experience, animations, and admin console
- `auth.js` — registration, verification, password reset, and social login handlers
- `script.js` — library interactions, nav state, metrics, and admin gating

## Data & Security Notes
- This project stores demo credentials in the browser only; no external services are called.
- Password hashing uses a simple salted Base64 helper suitable for prototype use, not production.
- Clearing browser storage resets users, sessions, and admin unlock state.

## Contributing
Feel free to fork the repository and extend it with real backend services, additional book data, or faculty-facing workflows. Pull requests are welcome.
