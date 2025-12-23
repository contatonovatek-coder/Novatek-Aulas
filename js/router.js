// router.js - Sistema de rotas
class Router {
    constructor() {
        this.routes = {};
        this.currentRoute = null;
        this.init();
    }

    init() {
        this.mapNavigation();
        
        if (auth.isAuthenticated()) {
            this.navigateTo('dashboard');
        }
    }

    mapNavigation() {
        document.addEventListener('click', (e) => {
            const navItem = e.target.closest('.nav-item');
            if (navItem && navItem.dataset.route) {
                e.preventDefault();
                this.navigateTo(navItem.dataset.route);
            }
        });

        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[data-route]');
            if (link) {
                e.preventDefault();
                this.navigateTo(link.dataset.route);
            }
        });

        document.addEventListener('click', (e) => {
            const menuLink = e.target.closest('.user-menu a[data-route]');
            if (menuLink) {
                e.preventDefault();
                this.navigateTo(menuLink.dataset.route);
            }
        });
    }

    registerRoute(route, handler) {
        this.routes[route] = handler;
    }

    navigateTo(route) {
        this.currentRoute = route;
        
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.route === route) {
                item.classList.add('active');
            }
        });

        if (this.routes[route]) {
            this.routes[route]();
        } else {
            console.warn(`Rota não encontrada: ${route}`);
        }

        if (window.innerWidth <= 992) {
            document.querySelector('.sidebar')?.classList.remove('active');
        }

        window.scrollTo(0, 0);
    }

    getCurrentRoute() {
        return this.currentRoute;
    }
}

// Instância global
const router = new Router();