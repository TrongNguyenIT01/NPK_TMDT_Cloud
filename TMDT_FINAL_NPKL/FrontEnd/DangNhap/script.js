document.addEventListener('DOMContentLoaded', () => {
    const togglePassBtn = document.querySelector('#togglePassword');
    const passwordInput = document.querySelector('#password');
    const loginForm = document.querySelector('#loginForm');

    if (togglePassBtn && passwordInput) {
        togglePassBtn.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // Toggle icon SVG
            if (type === 'text') {
                togglePassBtn.innerHTML = `
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                `;
            } else {
                togglePassBtn.innerHTML = `
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                `;
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.querySelector('#username').value.trim();
            const password = passwordInput.value.trim();

            if (!username || !password) {
                alert('Vui lòng nhập đầy đủ Tên đăng nhập và Mật khẩu!');
                return;
            }

            // Save basic user info for display on status page
            const lowerUser = username.toLowerCase();
            sessionStorage.setItem('currentUser', JSON.stringify({
                username: username,
                email: username.includes('@') ? username : `${username}@example.com`,
                role: lowerUser.includes('seller') ? 'SELLER' : 'CUSTOMER',
                registrationDate: new Date().toLocaleDateString('vi-VN')
            }));

            // Test logic: Check keyword in username to redirect to appropriate status page
            if (lowerUser.includes('pending') || lowerUser.includes('choduyet')) {
                alert('Tài khoản của bạn đang ở trạng thái CHỜ DUYỆT (PENDING). Đang chuyển hướng...');
                window.location.href = '../Status/pending.html';
            } else if (lowerUser.includes('block') || lowerUser.includes('khoa')) {
                alert('Tài khoản của bạn đã BỊ KHÓA (BLOCKED). Đang chuyển hướng...');
                window.location.href = '../Status/blocked.html';
            } else if (lowerUser.includes('reject') || lowerUser.includes('tuchoi')) {
                alert('Tài khoản của bạn bị TỪ CHỐI DUYỆT (REJECTED). Đang chuyển hướng...');
                window.location.href = '../Status/rejected.html';
            } else {
                // Default active account
                alert('Đăng nhập thành công! Đang chuyển hướng về Trang Chủ...');
                window.location.href = '../TrangChinh/index.html';
            }
        });
    }
});
