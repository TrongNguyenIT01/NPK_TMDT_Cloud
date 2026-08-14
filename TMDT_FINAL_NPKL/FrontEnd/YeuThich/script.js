document.addEventListener('DOMContentLoaded', () => {
    // 1. Kiểm tra Đăng nhập - Bắt buộc phải đăng nhập mới được xem danh sách yêu thích
    const token = sessionStorage.getItem('jwtToken') || localStorage.getItem('jwtToken');
    if (!token) {
        alert('Vui lòng đăng nhập để xem danh sách sản phẩm yêu thích của bạn!');
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

    // Quản lý Dropdown Account
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
        document.addEventListener('click', (e) => {
            if (!userProfileBtn.contains(e.target) && !userDropdownMenu.contains(e.target)) {
                userDropdownMenu.style.display = 'none';
            }
        });
        const btnLogout = document.getElementById('btnLogout');
        if (btnLogout) {
            btnLogout.addEventListener('click', () => {
                if (confirm('Bạn có chắc muốn đăng xuất?')) {
                    sessionStorage.removeItem('jwtToken');
                    localStorage.removeItem('jwtToken');
                    window.location.href = '../DangNhap/index.html';
                }
            });
        }
    }

    const wishlistGrid = document.getElementById('wishlistGrid');
    const emptyState = document.getElementById('emptyState');
    const wishlistCountElem = document.getElementById('wishlistCount');
    const wishlistBadge = document.getElementById('wishlistBadge');
    const cartBadge = document.getElementById('cartBadge');
    const btnClearAll = document.getElementById('btnClearAll');
    const btnMoveAllToCart = document.getElementById('btnMoveAllToCart');

    // Wishlist data from localStorage
    let wishlistItems = JSON.parse(localStorage.getItem('npkl_wishlist')) || [];
    let cartItemsCount = parseInt(localStorage.getItem('npkl_cart_count') || '2');

    function updateBadgeCounts() {
        if (wishlistBadge) wishlistBadge.textContent = wishlistItems.length;
        if (wishlistCountElem) wishlistCountElem.textContent = wishlistItems.length;
        if (cartBadge) cartBadge.textContent = cartItemsCount;
        localStorage.setItem('npkl_wishlist', JSON.stringify(wishlistItems));
        localStorage.setItem('npkl_cart_count', cartItemsCount);
    }

    function fixImgSrc(src) {
        if (!src) return '../TrangChinh/images/dac_nhan_tam.jpg';
        if (src.startsWith('../TrangChinh/')) return src;
        if (src.startsWith('images/')) return '../TrangChinh/' + src;
        if (src.startsWith('./images/')) return '../TrangChinh/' + src.substring(2);
        return '../TrangChinh/images/' + src;
    }

    function renderWishlist() {
        updateBadgeCounts();

        if (wishlistItems.length === 0) {
            if (wishlistGrid) wishlistGrid.style.display = 'none';
            if (emptyState) emptyState.classList.add('active');
            if (btnClearAll) btnClearAll.style.display = 'none';
            if (btnMoveAllToCart) btnMoveAllToCart.style.display = 'none';
            return;
        }

        if (wishlistGrid) wishlistGrid.style.display = 'grid';
        if (emptyState) emptyState.classList.remove('active');
        if (btnClearAll) btnClearAll.style.display = 'inline-flex';
        if (btnMoveAllToCart) btnMoveAllToCart.style.display = 'inline-flex';

        if (wishlistGrid) {
            wishlistGrid.innerHTML = wishlistItems.map(item => `
                <div class="wishlist-card" id="${item.id}">
                    <div class="card-img-box">
                        <img src="${fixImgSrc(item.img)}" alt="${item.title}" />
                        <button type="button" class="btn-remove-wishlist" data-id="${item.id}" title="Xóa khỏi danh sách">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <div class="card-content">
                        <span class="cat-badge">${item.categoryTag}</span>
                        <h3 class="card-title">${item.title}</h3>
                        <p class="card-author">${item.author}</p>
                        <div class="card-price-row">
                            <span class="card-price">${item.price}</span>
                            <span class="stock-status">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="#10B981"><circle cx="12" cy="12" r="10"/></svg>
                                Còn hàng
                            </span>
                        </div>
                        <button type="button" class="btn-add-to-cart" data-id="${item.id}" data-title="${item.title}">
                            🛒 THÊM VÀO GIỎ HÀNG
                        </button>
                    </div>
                </div>
            `).join('');
        }

        // Bind Remove Single Item
        document.querySelectorAll('.btn-remove-wishlist').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const card = document.getElementById(id);
                if (card) {
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.9)';
                    setTimeout(() => {
                        wishlistItems = wishlistItems.filter(i => i.id !== id);
                        renderWishlist();
                        showToast('Đã xóa sản phẩm khỏi danh sách yêu thích');
                    }, 250);
                }
            });
        });

        // Bind Add to Cart Single Item
        document.querySelectorAll('.btn-add-to-cart').forEach(btn => {
            btn.addEventListener('click', () => {
                const title = btn.getAttribute('data-title');
                cartItemsCount += 1;
                updateBadgeCounts();
                showToast(`Đã thêm "${title}" vào Giỏ Hàng!`);
            });
        });
    }

    // Bind Clear All
    if (btnClearAll) {
        btnClearAll.addEventListener('click', () => {
            if (confirm('Bạn có chắc chắn muốn xóa toàn bộ danh sách yêu thích?')) {
                wishlistItems = [];
                renderWishlist();
                showToast('Đã xóa tất cả sản phẩm khỏi yêu thích');
            }
        });
    }

    // Bind Move All to Cart
    if (btnMoveAllToCart) {
        btnMoveAllToCart.addEventListener('click', () => {
            if (wishlistItems.length > 0) {
                cartItemsCount += wishlistItems.length;
                updateBadgeCounts();
                showToast(`Đã thêm toàn bộ ${wishlistItems.length} sản phẩm vào Giỏ Hàng!`);
            }
        });
    }

    // Initial render
    renderWishlist();

    // Toast Notification Helper
    function showToast(message) {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span>${message}</span>
        `;

        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    // 4. Đồng bộ Top Bar & Search
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
