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
    const role = sessionStorage.getItem('userRole') || localStorage.getItem('userRole');
    
    if (nameElem) nameElem.textContent = displayName;
    if (statusElem) statusElem.textContent = role === 'CUSTOMER' ? 'Khách Hàng' : (role || '');

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

    // 2. Đăng xuất
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            if (confirm('Bạn có chắc muốn đăng xuất?')) {
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

    // 3. Modal Chi Tiết Đơn Hàng
    const modal = document.getElementById('orderDetailModal');
    const btnClose = document.getElementById('closeModalBtn');
    const btnViews = document.querySelectorAll('.btn-view-order');

    function openModal(orderId) {
        if (modal) {
            document.getElementById('modalOrderId').textContent = orderId;
            // Fake data loading
            document.getElementById('modalOrderDate').textContent = '11/08/2026 14:20';
            document.getElementById('modalOrderShop').textContent = 'SH0001 - NPKL Bookshop';
            document.getElementById('modalOrderTotal').textContent = '450.000đ';
            document.getElementById('modalOrderAddress').textContent = 'TP. Hồ Chí Minh';
            
            modal.style.display = 'flex';
            // Trigger reflow
            void modal.offsetWidth;
            modal.classList.add('active');
        }
    }

    function closeModal() {
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300); // Wait for transition
        }
    }

    btnViews.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const orderId = e.currentTarget.getAttribute('data-id');
            openModal(orderId);
        });
    });

    if (btnClose) {
        btnClose.addEventListener('click', closeModal);
    }

    // Đóng khi click ngoài modal container
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
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
