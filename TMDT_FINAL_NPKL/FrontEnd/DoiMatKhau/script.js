document.addEventListener('DOMContentLoaded', () => {
    // =========================================================================
    // 0. KIỂM TRA ĐĂNG NHẬP & ĐỒNG BỘ TRẠNG THÁI NGƯỜI DÙNG
    // =========================================================================
    const token = sessionStorage.getItem('jwtToken') || localStorage.getItem('jwtToken');
    if (!token) {
        alert('Vui lòng đăng nhập để thực hiện đổi mật khẩu!');
        window.location.href = '../DangNhap/index.html';
        return;
    }

    const displayName = sessionStorage.getItem('fullName') || localStorage.getItem('fullName') || sessionStorage.getItem('userName') || localStorage.getItem('userName') || 'Khách Hàng';
    const role = sessionStorage.getItem('userRole') || localStorage.getItem('userRole');

    const headerUserName = document.getElementById('headerUserName');
    const headerUserStatus = document.getElementById('headerUserStatus');
    const dropdownUserName = document.getElementById('dropdownUserName');
    const dropdownUserRole = document.getElementById('dropdownUserRole');

    if (headerUserName) headerUserName.textContent = displayName;
    if (headerUserStatus) headerUserStatus.textContent = role === 'CUSTOMER' ? 'Khách Hàng' : (role || '');
    if (dropdownUserName) dropdownUserName.textContent = displayName;
    if (dropdownUserRole) dropdownUserRole.textContent = role === 'CUSTOMER' ? 'Khách Hàng' : (role || '');

    // Ẩn/Hiện Kênh Người Bán & Quản Trị Admin
    const sellerLink = document.getElementById('sellerLink');
    const sellerDivider = document.getElementById('sellerDivider');
    const adminLink = document.getElementById('adminLink');
    const adminDivider = document.getElementById('adminDivider');

    if (role === 'CUSTOMER' || !role) {
        if (sellerLink) sellerLink.style.display = 'none';
        if (sellerDivider) sellerDivider.style.display = 'none';
        if (adminLink) adminLink.style.display = 'none';
        if (adminDivider) adminDivider.style.display = 'none';
    }

    // Đồng bộ Badges Yêu thích & Giỏ hàng
    const wishlistBadge = document.getElementById('wishlistBadge');
    const cartBadge = document.getElementById('cartBadge');
    if (wishlistBadge) {
        const wishlist = JSON.parse(localStorage.getItem('npkl_wishlist') || '[]');
        wishlistBadge.textContent = wishlist.length;
    }
    if (cartBadge) {
        const cartCount = localStorage.getItem('npkl_cart_count') || '0';
        cartBadge.textContent = cartCount;
    }

    // =========================================================================
    // 1. DROPDOWN MENU TÀI KHOẢN & ĐĂNG XUẤT
    // =========================================================================
    const userProfileBtn = document.getElementById('userProfileBtn');
    const userDropdownMenu = document.getElementById('userDropdownMenu');

    if (userProfileBtn && userDropdownMenu) {
        userProfileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const isVisible = userDropdownMenu.style.display === 'block';
            userDropdownMenu.style.display = isVisible ? 'none' : 'block';
        });

        document.addEventListener('click', (e) => {
            if (!userProfileBtn.contains(e.target) && !userDropdownMenu.contains(e.target)) {
                userDropdownMenu.style.display = 'none';
            }
        });
    }

    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            if (confirm('Bạn có chắc chắn muốn đăng xuất tài khoản?')) {
                sessionStorage.clear();
                localStorage.removeItem('jwtToken');
                localStorage.removeItem('userRole');
                localStorage.removeItem('userName');
                localStorage.removeItem('fullName');
                localStorage.removeItem('email');
                localStorage.removeItem('phone');
                localStorage.removeItem('address');
                localStorage.removeItem('npkl_wishlist');
                localStorage.removeItem('npkl_cart_items');
                localStorage.removeItem('npkl_cart_count');
                window.location.href = '../DangNhap/index.html';
            }
        });
    }

    // Tìm kiếm nhanh từ Header
    const btnExecuteSearch = document.getElementById('btnExecuteSearch');
    const globalSearchInput = document.getElementById('globalSearchInput');
    if (btnExecuteSearch && globalSearchInput) {
        btnExecuteSearch.addEventListener('click', () => {
            const query = globalSearchInput.value.trim();
            if (query) {
                localStorage.setItem('npkl_pending_search', query);
            }
            window.location.href = '../TrangChinh/index.html';
        });
        globalSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') btnExecuteSearch.click();
        });
    }

    // =========================================================================
    // 2. XỬ LÝ ẨN / HIỆN MẬT KHẨU (EYE TOGGLES)
    // =========================================================================
    function setupPasswordToggle(toggleBtnId, inputId) {
        const toggleBtn = document.getElementById(toggleBtnId);
        const input = document.getElementById(inputId);
        if (!toggleBtn || !input) return;

        toggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';

            const eyeOpen = toggleBtn.querySelector('.eye-open');
            const eyeClosed = toggleBtn.querySelector('.eye-closed');

            if (eyeOpen && eyeClosed) {
                eyeOpen.style.display = isPassword ? 'none' : 'block';
                eyeClosed.style.display = isPassword ? 'block' : 'none';
            }
        });
    }

    setupPasswordToggle('toggleOldPassword', 'oldPassword');
    setupPasswordToggle('toggleNewPassword', 'newPassword');
    setupPasswordToggle('toggleConfirmPassword', 'confirmPassword');

    // =========================================================================
    // 3. KIỂM TRA ĐIỀU KIỆN MẬT KHẨU REAL-TIME
    // =========================================================================
    const oldPasswordInput = document.getElementById('oldPassword');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');

    const ruleLength = document.getElementById('ruleLength');
    const ruleDiffOld = document.getElementById('ruleDiffOld');
    const ruleMatch = document.getElementById('ruleMatch');

    function checkPasswordRules() {
        const oldVal = oldPasswordInput ? oldPasswordInput.value : '';
        const newVal = newPasswordInput ? newPasswordInput.value : '';
        const confirmVal = confirmPasswordInput ? confirmPasswordInput.value : '';

        // Quy tắc 1: Tối thiểu 8 ký tự
        if (ruleLength) {
            if (newVal.length >= 8) {
                ruleLength.className = 'rule-item valid';
                ruleLength.querySelector('.rule-icon').textContent = '✅';
            } else {
                ruleLength.className = 'rule-item';
                ruleLength.querySelector('.rule-icon').textContent = '⚪';
            }
        }

        // Quy tắc 2: Khác mật khẩu cũ
        if (ruleDiffOld) {
            if (newVal.length > 0 && oldVal.length > 0 && newVal !== oldVal) {
                ruleDiffOld.className = 'rule-item valid';
                ruleDiffOld.querySelector('.rule-icon').textContent = '✅';
            } else if (newVal.length > 0 && oldVal.length > 0 && newVal === oldVal) {
                ruleDiffOld.className = 'rule-item invalid';
                ruleDiffOld.querySelector('.rule-icon').textContent = '❌';
            } else {
                ruleDiffOld.className = 'rule-item';
                ruleDiffOld.querySelector('.rule-icon').textContent = '⚪';
            }
        }

        // Quy tắc 3: Khớp mật khẩu xác nhận
        if (ruleMatch) {
            if (confirmVal.length > 0 && newVal.length > 0 && confirmVal === newVal) {
                ruleMatch.className = 'rule-item valid';
                ruleMatch.querySelector('.rule-icon').textContent = '✅';
            } else if (confirmVal.length > 0 && confirmVal !== newVal) {
                ruleMatch.className = 'rule-item invalid';
                ruleMatch.querySelector('.rule-icon').textContent = '❌';
            } else {
                ruleMatch.className = 'rule-item';
                ruleMatch.querySelector('.rule-icon').textContent = '⚪';
            }
        }
    }

    if (oldPasswordInput) oldPasswordInput.addEventListener('input', checkPasswordRules);
    if (newPasswordInput) newPasswordInput.addEventListener('input', checkPasswordRules);
    if (confirmPasswordInput) confirmPasswordInput.addEventListener('input', checkPasswordRules);

    // =========================================================================
    // 4. XỬ LÝ SUBMIT FORM ĐỔI MẬT KHẨU
    // =========================================================================
    const form = document.getElementById('changePasswordForm');
    const alertBox = document.getElementById('passwordAlertBox');
    const btnSubmit = document.getElementById('btnSubmitPassword');

    const errorOldPassword = document.getElementById('errorOldPassword');
    const errorNewPassword = document.getElementById('errorNewPassword');
    const errorConfirmPassword = document.getElementById('errorConfirmPassword');

    function showAlert(msg, isSuccess) {
        if (!alertBox) return;
        alertBox.textContent = msg;
        alertBox.className = `alert-banner ${isSuccess ? 'success' : 'error'}`;
        alertBox.style.display = 'flex';
        alertBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function clearErrors() {
        if (alertBox) alertBox.style.display = 'none';
        if (errorOldPassword) errorOldPassword.textContent = '';
        if (errorNewPassword) errorNewPassword.textContent = '';
        if (errorConfirmPassword) errorConfirmPassword.textContent = '';

        [oldPasswordInput, newPasswordInput, confirmPasswordInput].forEach(input => {
            if (input) input.classList.remove('input-error');
        });
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearErrors();

            const oldPass = oldPasswordInput ? oldPasswordInput.value.trim() : '';
            const newPass = newPasswordInput ? newPasswordInput.value.trim() : '';
            const confirmPass = confirmPasswordInput ? confirmPasswordInput.value.trim() : '';

            let hasError = false;

            // Validate Mật khẩu cũ
            if (!oldPass) {
                if (errorOldPassword) errorOldPassword.textContent = 'Vui lòng nhập mật khẩu hiện tại.';
                if (oldPasswordInput) oldPasswordInput.classList.add('input-error');
                hasError = true;
            }

            // Validate Mật khẩu mới
            if (!newPass) {
                if (errorNewPassword) errorNewPassword.textContent = 'Vui lòng nhập mật khẩu mới.';
                if (newPasswordInput) newPasswordInput.classList.add('input-error');
                hasError = true;
            } else if (newPass.length < 8) {
                if (errorNewPassword) errorNewPassword.textContent = 'Mật khẩu mới phải có tối thiểu 8 ký tự.';
                if (newPasswordInput) newPasswordInput.classList.add('input-error');
                hasError = true;
            } else if (oldPass && newPass === oldPass) {
                if (errorNewPassword) errorNewPassword.textContent = 'Mật khẩu mới không được trùng với mật khẩu hiện tại.';
                if (newPasswordInput) newPasswordInput.classList.add('input-error');
                hasError = true;
            }

            // Validate Xác nhận mật khẩu
            if (!confirmPass) {
                if (errorConfirmPassword) errorConfirmPassword.textContent = 'Vui lòng xác nhận lại mật khẩu mới.';
                if (confirmPasswordInput) confirmPasswordInput.classList.add('input-error');
                hasError = true;
            } else if (newPass && confirmPass !== newPass) {
                if (errorConfirmPassword) errorConfirmPassword.textContent = 'Mật khẩu xác nhận không khớp.';
                if (confirmPasswordInput) confirmPasswordInput.classList.add('input-error');
                hasError = true;
            }

            if (hasError) return;

            // Hiệu ứng Loading
            const originalBtnText = btnSubmit ? btnSubmit.innerHTML : 'Lưu Thay Đổi';
            if (btnSubmit) {
                btnSubmit.innerHTML = '⏳ Đang xử lý...';
                btnSubmit.disabled = true;
            }

            try {
                const response = await fetch(`${window.location.origin}/api/DangNhap/change-password`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        OldPassword: oldPass,
                        NewPassword: newPass,
                        ConfirmNewPassword: confirmPass
                    })
                });

                if (response.status === 401) {
                    showAlert('Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại!', false);
                    setTimeout(() => {
                        sessionStorage.clear();
                        localStorage.removeItem('jwtToken');
                        window.location.href = '../DangNhap/index.html';
                    }, 1500);
                    return;
                }

                const result = await response.json().catch(() => ({}));

                if (response.ok && (result.success || result.Success)) {
                    showAlert(result.message || result.Message || '🎉 Đổi mật khẩu thành công! Mật khẩu mới của bạn đã được cập nhật.', true);
                    form.reset();
                    checkPasswordRules();
                } else {
                    const errorMsg = result.message || result.Message || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại thông tin!';
                    showAlert(errorMsg, false);
                    if (errorMsg.toLowerCase().includes('mật khẩu cũ')) {
                        if (errorOldPassword) errorOldPassword.textContent = errorMsg;
                        if (oldPasswordInput) oldPasswordInput.classList.add('input-error');
                    }
                }
            } catch (err) {
                console.error('Lỗi kết nối API đổi mật khẩu:', err);
                showAlert('Không thể kết nối đến máy chủ Backend (https://localhost:3001). Vui lòng thử lại sau!', false);
            } finally {
                if (btnSubmit) {
                    btnSubmit.innerHTML = originalBtnText;
                    btnSubmit.disabled = false;
                }
            }
        });

        // Nút Reset Form
        const btnReset = document.getElementById('btnResetForm');
        if (btnReset) {
            btnReset.addEventListener('click', () => {
                setTimeout(() => {
                    clearErrors();
                    checkPasswordRules();
                }, 50);
            });
        }
    }
});
