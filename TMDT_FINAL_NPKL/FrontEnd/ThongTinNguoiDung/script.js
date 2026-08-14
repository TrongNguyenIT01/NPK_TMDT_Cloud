document.addEventListener('DOMContentLoaded', () => {
    // 0. Auth Check
    const token = sessionStorage.getItem('jwtToken') || localStorage.getItem('jwtToken');
    if (!token) {
        alert('Vui lòng đăng nhập để xem thông tin!');
        window.location.href = '../DangNhap/index.html';
        return;
    }

    // Sync User Account Name from Storage
    const nameElem = document.getElementById('headerUserName');
    const statusElem = document.getElementById('headerUserStatus');
    const displayName = sessionStorage.getItem('fullName') || localStorage.getItem('fullName') || sessionStorage.getItem('userName') || localStorage.getItem('userName') || 'Khách Hàng';
    const userName = sessionStorage.getItem('userName') || localStorage.getItem('userName') || 'khachhang';
    const email = sessionStorage.getItem('email') || localStorage.getItem('email') || 'khachhang@example.com';
    const role = sessionStorage.getItem('userRole') || localStorage.getItem('userRole');
    
    if (nameElem) nameElem.textContent = displayName;
    if (statusElem) statusElem.textContent = role === 'CUSTOMER' ? 'Khách Hàng' : (role || '');

    // Fill form data
    const inputUsername = document.getElementById('username');
    const inputFullName = document.getElementById('fullName');
    const inputEmail = document.getElementById('email');
    if (inputUsername) inputUsername.value = userName;
    if (inputFullName) inputFullName.value = displayName;
    if (inputEmail) inputEmail.value = email;

    // 1. Quản lý Dropdown Account
    const userProfileBtn = document.getElementById('userProfileBtn');
    const userDropdownMenu = document.getElementById('userDropdownMenu');

    if (userProfileBtn && userDropdownMenu) {
        const dropdownName = document.getElementById('dropdownUserName');
        const dropdownRole = document.getElementById('dropdownUserRole');
        if (dropdownName) dropdownName.textContent = displayName;
        if (dropdownRole) dropdownRole.textContent = role === 'CUSTOMER' ? 'Khách Hàng' : (role || '');

        userProfileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const isVisible = userDropdownMenu.style.display === 'block';
            userDropdownMenu.style.display = isVisible ? 'none' : 'block';
        });

        // Đóng dropdown khi click ra ngoài
        document.addEventListener('click', (e) => {
            if (!userProfileBtn.contains(e.target) && !userDropdownMenu.contains(e.target)) {
                userDropdownMenu.style.display = 'none';
            }
        });
    }

    // 2. Xử lý lưu form thông tin
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = profileForm.querySelector('.btn-save');
            const originalText = btn.textContent;
            
            // Giả lập lưu
            btn.textContent = 'Đang lưu...';
            btn.disabled = true;

            setTimeout(() => {
                alert('Đã cập nhật thông tin thành công!');
                btn.textContent = originalText;
                btn.disabled = false;
            }, 800);
        });
    }

    // 3. Đăng xuất
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            if (confirm('Bạn có chắc muốn đăng xuất?')) {
                window.location.href = '../DangNhap/index.html';
            }
        });
    }
    // 4. Đồng bộ Top Bar & Badges & Search
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
