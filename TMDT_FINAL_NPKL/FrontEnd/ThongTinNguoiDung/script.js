document.addEventListener('DOMContentLoaded', async () => {
    const API_BASE_URL = 'https://localhost:3001/api/DangNhap';

    // 0. Auth Check
    const token = sessionStorage.getItem('jwtToken') || localStorage.getItem('jwtToken');
    if (!token) {
        alert('Vui lòng đăng nhập để xem và quản lý thông tin tài khoản!');
        window.location.href = '../DangNhap/index.html';
        return;
    }

    // Các thành phần giao diện
    const nameElem = document.getElementById('headerUserName');
    const statusElem = document.getElementById('headerUserStatus');
    const dropdownName = document.getElementById('dropdownUserName');
    const dropdownRole = document.getElementById('dropdownUserRole');

    const inputUsername = document.getElementById('username');
    const inputFullName = document.getElementById('fullName');
    const inputEmail = document.getElementById('email');
    const inputPhone = document.getElementById('phone');
    const inputAddress = document.getElementById('address');
    const alertBox = document.getElementById('profileAlertBox');
    const profileForm = document.getElementById('profileForm');
    const btnSave = document.getElementById('btnSaveProfile');

    function showAlert(msg, isSuccess) {
        if (!alertBox) return;
        alertBox.textContent = msg;
        alertBox.style.display = 'block';
        alertBox.style.backgroundColor = isSuccess ? '#dcfce7' : '#fee2e2';
        alertBox.style.color = isSuccess ? '#15803d' : '#b91c1c';
        alertBox.style.border = `1px solid ${isSuccess ? '#86efac' : '#fca5a5'}`;
        alertBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function hideAlert() {
        if (alertBox) alertBox.style.display = 'none';
    }

    function updateHeaderUserInfo(fullName, role) {
        const roleLabel = role === 'CUSTOMER' ? 'Khách Hàng' : (role || 'Khách Hàng');
        if (nameElem) nameElem.textContent = fullName || 'Tài khoản';
        if (statusElem) statusElem.textContent = roleLabel;
        if (dropdownName) dropdownName.textContent = fullName || 'Tài khoản';
        if (dropdownRole) dropdownRole.textContent = roleLabel;
    }

    // 1. Tải thông tin người dùng từ Backend API
    async function loadUserProfile() {
        try {
            const response = await fetch(`${API_BASE_URL}/profile`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 401) {
                alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!');
                sessionStorage.clear();
                localStorage.removeItem('jwtToken');
                window.location.href = '../DangNhap/index.html';
                return;
            }

            const result = await response.json().catch(() => ({}));

            if (response.ok && (result.success || result.Success)) {
                const user = result.data || result.Data;
                if (user) {
                    if (inputUsername) inputUsername.value = user.username || user.Username || '';
                    if (inputFullName) inputFullName.value = user.fullName || user.FullName || '';
                    if (inputEmail) inputEmail.value = user.email || user.Email || '';
                    if (inputPhone) inputPhone.value = user.phone || user.Phone || '';
                    if (inputAddress) inputAddress.value = user.address || user.Address || '';

                    // Cập nhật Header
                    const currentFullName = user.fullName || user.FullName || '';
                    const currentRole = user.role || user.Role || '';
                    updateHeaderUserInfo(currentFullName, currentRole);

                    // Đồng bộ lại local storage
                    sessionStorage.setItem('fullName', currentFullName);
                    sessionStorage.setItem('userName', user.username || user.Username || '');
                    sessionStorage.setItem('email', user.email || user.Email || '');
                    sessionStorage.setItem('phone', user.phone || user.Phone || '');
                    sessionStorage.setItem('address', user.address || user.Address || '');
                    localStorage.setItem('fullName', currentFullName);
                    localStorage.setItem('userName', user.username || user.Username || '');
                    localStorage.setItem('email', user.email || user.Email || '');
                    localStorage.setItem('phone', user.phone || user.Phone || '');
                    localStorage.setItem('address', user.address || user.Address || '');
                }
            } else {
                showAlert(result.message || result.Message || 'Không thể tải thông tin hồ sơ!', false);
            }
        } catch (err) {
            console.error('Lỗi khi tải thông tin hồ sơ:', err);
            showAlert('Không thể kết nối đến máy chủ Backend (https://localhost:3001)!', false);
        }
    }

    await loadUserProfile();

    // 2. Xử lý lưu form cập nhật thông tin
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideAlert();

            const fullNameVal = inputFullName ? inputFullName.value.trim() : '';
            const emailVal = inputEmail ? inputEmail.value.trim() : '';
            const phoneVal = inputPhone ? inputPhone.value.trim() : '';
            const addressVal = inputAddress ? inputAddress.value.trim() : '';

            // Validate dữ liệu
            if (!fullNameVal) {
                showAlert('Vui lòng nhập họ và tên của bạn!', false);
                if (inputFullName) inputFullName.focus();
                return;
            }

            if (!emailVal) {
                showAlert('Vui lòng nhập địa chỉ email!', false);
                if (inputEmail) inputEmail.focus();
                return;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(emailVal)) {
                showAlert('Địa chỉ email không đúng định dạng!', false);
                if (inputEmail) inputEmail.focus();
                return;
            }

            const originalBtnText = btnSave ? btnSave.textContent : 'Lưu Thông Tin';
            if (btnSave) {
                btnSave.textContent = '⏳ Đang lưu...';
                btnSave.disabled = true;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/update-profile`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        FullName: fullNameVal,
                        Email: emailVal,
                        Phone: phoneVal || null,
                        Address: addressVal || null
                    })
                });

                if (response.status === 401) {
                    showAlert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!', false);
                    setTimeout(() => {
                        sessionStorage.clear();
                        localStorage.removeItem('jwtToken');
                        window.location.href = '../DangNhap/index.html';
                    }, 1500);
                    return;
                }

                const result = await response.json().catch(() => ({}));

                if (response.ok && (result.success || result.Success)) {
                    showAlert(result.message || result.Message || '🎉 Cập nhật thông tin thành công!', true);

                    const updatedUser = result.data || result.Data;
                    if (updatedUser) {
                        const newName = updatedUser.fullName || updatedUser.FullName || fullNameVal;
                        const newRole = sessionStorage.getItem('userRole') || localStorage.getItem('userRole');
                        updateHeaderUserInfo(newName, newRole);

                        sessionStorage.setItem('fullName', newName);
                        sessionStorage.setItem('email', emailVal);
                        sessionStorage.setItem('phone', phoneVal);
                        sessionStorage.setItem('address', addressVal);
                        localStorage.setItem('fullName', newName);
                        localStorage.setItem('email', emailVal);
                        localStorage.setItem('phone', phoneVal);
                        localStorage.setItem('address', addressVal);
                    }
                } else {
                    showAlert(result.message || result.Message || 'Cập nhật thông tin thất bại. Vui lòng thử lại!', false);
                }
            } catch (err) {
                console.error('Lỗi khi cập nhật hồ sơ:', err);
                showAlert('Không thể kết nối đến máy chủ Backend (https://localhost:3001). Vui lòng thử lại!', false);
            } finally {
                if (btnSave) {
                    btnSave.textContent = originalBtnText;
                    btnSave.disabled = false;
                }
            }
        });
    }

    // 3. Quản lý Dropdown Account
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

    // 4. Đăng xuất
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
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

    // 5. Đồng bộ Top Bar, Badges & Search
    const role = sessionStorage.getItem('userRole') || localStorage.getItem('userRole');
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
});
