document.addEventListener('DOMContentLoaded', () => {
    // Read session user data if stored from login
    const savedUser = JSON.parse(sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser') || '{}');
    
    if (savedUser.username) {
        const usernameElem = document.getElementById('userUsername');
        if (usernameElem) usernameElem.textContent = savedUser.username;
    }
    if (savedUser.email) {
        const emailElem = document.getElementById('userEmail');
        if (emailElem) emailElem.textContent = savedUser.email;
    }
    if (savedUser.role) {
        const roleElem = document.getElementById('userRole');
        if (roleElem) roleElem.textContent = savedUser.role.toUpperCase();
    }
    if (savedUser.registrationDate) {
        const dateElem = document.getElementById('registrationDate');
        if (dateElem) dateElem.textContent = savedUser.registrationDate;
    }

    // Handle Refresh Status Button
    const refreshBtn = document.getElementById('btnRefreshStatus');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            refreshBtn.classList.add('loading');
            const originalText = refreshBtn.innerHTML;
            refreshBtn.disabled = true;
            refreshBtn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;">
                    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path>
                    <path d="M21 3v5h-5"></path>
                </svg>
                Đang kiểm tra...
            `;

            setTimeout(() => {
                refreshBtn.disabled = false;
                refreshBtn.innerHTML = originalText;
                showToast('Hệ thống chưa ghi nhận thay đổi trạng thái. Vui lòng kiểm tra lại sau!');
            }, 1200);
        });
    }

    // Modal Support / Appeal Handlers
    const openModalBtn = document.getElementById('btnOpenModal');
    const modalOverlay = document.getElementById('supportModal');
    const closeModalBtn = document.getElementById('btnCloseModal');
    const supportForm = document.getElementById('supportForm');

    if (openModalBtn && modalOverlay) {
        openModalBtn.addEventListener('click', () => {
            modalOverlay.classList.add('active');
        });
    }

    if (closeModalBtn && modalOverlay) {
        closeModalBtn.addEventListener('click', () => {
            modalOverlay.classList.remove('active');
        });

        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.classList.remove('active');
            }
        });
    }

    if (supportForm) {
        supportForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const message = document.getElementById('supportMessage')?.value.trim();
            if (!message) return;

            modalOverlay.classList.remove('active');
            showToast('Yêu cầu hỗ trợ của bạn đã được gửi thành công! Quản trị viên sẽ phản hồi sớm nhất.');
            supportForm.reset();
        });
    }
});

// Toast Helper Function
function showToast(message) {
    let toast = document.querySelector('.toast-notification');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span class="toast-message"></span>
        `;
        document.body.appendChild(toast);
    }

    toast.querySelector('.toast-message').textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

// Keyframe CSS for spin animation
const styleSheet = document.createElement("style");
styleSheet.innerText = `
@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}
`;
document.head.appendChild(styleSheet);
