document.addEventListener('DOMContentLoaded', () => {
    const roleBtns = document.querySelectorAll('.role-tab-btn');
    const selectedRoleInput = document.querySelector('#selectedRole');
    const shopGroup = document.querySelector('#shopGroup');
    const registerForm = document.querySelector('#registerForm');

    // Role Tab Switching
    roleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            roleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const role = btn.getAttribute('data-role');
            if (selectedRoleInput) selectedRoleInput.value = role;

            if (role === 'SELLER') {
                if (shopGroup) shopGroup.style.display = 'block';
            } else {
                if (shopGroup) shopGroup.style.display = 'none';
            }
        });
    });

    // Form Submission Handling
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const fullName = document.querySelector('#fullName').value.trim();
            const username = document.querySelector('#username').value.trim();
            const email = document.querySelector('#email').value.trim();
            const password = document.querySelector('#password').value;
            const confirmPassword = document.querySelector('#confirmPassword').value;

            if (password !== confirmPassword) {
                alert('Mật khẩu xác nhận không khớp! Vui lòng kiểm tra lại.');
                return;
            }

            const role = selectedRoleInput ? selectedRoleInput.value : 'CUSTOMER';
            const roleName = role === 'SELLER' ? 'Người Bán (Seller)' : 'Khách Hàng (Customer)';

            alert(`Đăng ký tài khoản ${roleName} thành công!\nTài khoản sẽ ở trạng thái Chờ Duyệt (PENDING).\nĐang chuyển hướng sang trang Đăng Nhập...`);
            window.location.href = '../DangNhap/index.html';
        });
    }
});
