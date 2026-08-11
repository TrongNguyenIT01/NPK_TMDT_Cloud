document.addEventListener('DOMContentLoaded', () => {
    const roleSelect = document.querySelector('#roleSelect');
    const shopGroup = document.querySelector('#shopGroup');
    const registerForm = document.querySelector('#registerForm');

    // Role Select Combobox Change Event
    if (roleSelect) {
        roleSelect.addEventListener('change', (e) => {
            const role = e.target.value;

            if (role === 'SELLER') {
                if (shopGroup) shopGroup.style.display = 'block';
            } else {
                if (shopGroup) shopGroup.style.display = 'none';
            }
        });
    }

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

            const role = roleSelect ? roleSelect.value : 'CUSTOMER';
            const roleName = role === 'SELLER' ? 'Người Bán (Seller)' : 'Khách Hàng (Customer)';

            alert(`Đăng ký tài khoản ${roleName} thành công!\nTài khoản sẽ ở trạng thái Chờ Duyệt (PENDING).\nĐang chuyển hướng sang trang Đăng Nhập...`);
            window.location.href = '../DangNhap/index.html';
        });
    }
});
