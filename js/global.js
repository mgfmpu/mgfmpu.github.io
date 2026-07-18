
document.addEventListener('DOMContentLoaded', () => {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const dashboardContent = document.getElementById('dashboardContent');
    const mobileHeader = document.getElementById('mobileHeader');
    
    if(mobileMenuBtn && sidebar && overlay) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('sidebar-open');
            overlay.classList.toggle('active');
        });
        
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('sidebar-open');
            overlay.classList.remove('active');
        });
    }

    // O header mobile s deve aparecer quando o dashboard content perder a classe hidden
    // Criamos um MutationObserver para observar a classe hidden
    if(dashboardContent && mobileHeader) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    if (!dashboardContent.classList.contains('hidden')) {
                        mobileHeader.classList.remove('hidden');
                    } else {
                        mobileHeader.classList.add('hidden');
                    }
                }
            });
        });
        observer.observe(dashboardContent, { attributes: true });
    }
});
