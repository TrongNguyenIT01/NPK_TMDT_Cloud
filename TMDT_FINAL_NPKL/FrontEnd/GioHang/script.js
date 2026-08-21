document.addEventListener('DOMContentLoaded', () => {
    // 1. Kiểm tra Đăng nhập - Bắt buộc phải đăng nhập mới được xem giỏ hàng
    const token = sessionStorage.getItem('jwtToken') || localStorage.getItem('jwtToken');
    if (!token) {
        alert('Vui lòng đăng nhập để xem giỏ hàng của bạn!');
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
    }

    const cartContainer = document.getElementById('cartContainer');
    const emptyCartBox = document.getElementById('emptyCartBox');
    const cartItemsList = document.getElementById('cartItemsList');
    const cartBadge = document.getElementById('cartBadge');
    const wishlistBadge = document.getElementById('wishlistBadge');
    
    // Summary Elem References
    const subtotalElem = document.getElementById('cartSubtotal');
    const shippingElem = document.getElementById('cartShipping');
    const totalElem = document.getElementById('cartTotal');
    const freeshipMessage = document.getElementById('freeshipMessage');
    const freeshipBarFill = document.getElementById('freeshipBarFill');

    // Checkout
    const btnCheckout = document.getElementById('btnCheckout');

    const BASE_API_URL = window.location.origin;

    // [Thay đổi] Chuyển cartItems từ chỉ đọc LocalStorage sang đồng bộ trực tiếp từ Database qua API Backend
    // Dữ liệu từ LocalStorage vẫn được dùng làm fallback khởi tạo để tránh màn hình trắng khi đang tải API
    let cartItems = JSON.parse(localStorage.getItem('npkl_cart_items')) || [];
    const FREESHIP_THRESHOLD = 300000;
    const STANDARD_SHIPPING = 30000;

    function formatVND(amount) {
        return (amount || 0).toLocaleString('vi-VN') + 'đ';
    }

    function calculateTotals() {
        let subtotal = 0;
        let totalItemsCount = 0;

        cartItems.forEach(item => {
            const price = Number(item.price) || 0;
            const qty = Number(item.qty) || 0;
            subtotal += price * qty;
            totalItemsCount += qty;
        });

        // Shipping fee calculation
        let shippingFee = subtotal >= FREESHIP_THRESHOLD || subtotal === 0 ? 0 : STANDARD_SHIPPING;

        // Freeship Progress Bar Calculation
        if (freeshipMessage && freeshipBarFill) {
            if (subtotal >= FREESHIP_THRESHOLD) {
                freeshipMessage.innerHTML = '🎉 Bạn đã đủ điều kiện <strong>Miễn Phí Giao Hàng (Freeship)</strong>!';
                freeshipBarFill.style.width = '100%';
            } else {
                const needed = FREESHIP_THRESHOLD - subtotal;
                const percent = Math.min(100, Math.round((subtotal / FREESHIP_THRESHOLD) * 100));
                freeshipMessage.innerHTML = `🚚 Mua thêm <strong>${formatVND(needed)}</strong> để được <strong>Miễn Phí Giao Hàng</strong>!`;
                freeshipBarFill.style.width = `${percent}%`;
            }
        }

        // Final total
        let total = Math.max(0, subtotal + shippingFee);

        // Update DOM
        if (subtotalElem) subtotalElem.textContent = formatVND(subtotal);
        if (shippingElem) shippingElem.textContent = shippingFee === 0 ? 'Miễn phí' : formatVND(shippingFee);
        if (totalElem) totalElem.textContent = formatVND(total);
        if (cartBadge) cartBadge.textContent = totalItemsCount;

        // Lưu bản sao vào LocalStorage để đồng bộ tạm thời giữa các trang
        localStorage.setItem('npkl_cart_items', JSON.stringify(cartItems));
        localStorage.setItem('npkl_cart_count', totalItemsCount);
    }

    function fixImgSrc(src) {
        if (!src) return '../TrangChinh/images/dac_nhan_tam.jpg';
        if (src.includes('https://') || src.includes('http://')) {
            const httpIdx = src.indexOf('http');
            return src.substring(httpIdx);
        }
        if (src.startsWith('/images/')) return `${BASE_API_URL}${src}`;
        if (src.startsWith('../TrangChinh/')) return src;
        if (src.startsWith('images/')) return '../TrangChinh/' + src;
        if (src.startsWith('./images/')) return '../TrangChinh/' + src.substring(2);
        return '../TrangChinh/images/' + src;
    }

    // [Mới] Hàm lấy giỏ hàng từ Database qua Backend API
    async function loadCartFromAPI() {
        try {
            const response = await fetch(`${BASE_API_URL}/api/GioHang`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 401) {
                alert('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại!');
                window.location.href = '../DangNhap/index.html';
                return;
            }

            if (response.ok) {
                const data = await response.json();
                if (data && data.items) {
                    cartItems = data.items.map(item => ({
                        id: item.productId,
                        productId: item.productId,
                        cartItemId: item.cartItemId,
                        title: item.title,
                        price: item.price,
                        img: item.img,
                        qty: item.qty,
                        stockQuantity: item.stockQuantity,
                        categoryTag: item.categoryTag,
                        author: item.author
                    }));
                    renderCart();
                }
            } else {
                console.warn('Không thể tải giỏ hàng từ máy chủ, dùng dữ liệu tạm.');
                renderCart();
            }
        } catch (error) {
            console.error('Lỗi khi gọi API giỏ hàng:', error);
            renderCart();
        }
    }

    function renderCart() {
        const wishlistItems = JSON.parse(localStorage.getItem('npkl_wishlist') || '[]');
        if (wishlistBadge) wishlistBadge.textContent = wishlistItems.length;

        if (cartItems.length === 0) {
            if (cartContainer) cartContainer.style.display = 'none';
            if (emptyCartBox) emptyCartBox.classList.add('active');
            if (cartBadge) cartBadge.textContent = '0';
            return;
        }

        if (cartContainer) cartContainer.style.display = 'grid';
        if (emptyCartBox) emptyCartBox.classList.remove('active');

        if (cartItemsList) {
            cartItemsList.innerHTML = cartItems.map(item => `
                <div class="cart-item-row" id="${item.productId || item.id}">
                    <img src="${fixImgSrc(item.img)}" alt="${item.title}" class="cart-item-img" onerror="this.src='../TrangChinh/images/dac_nhan_tam.jpg'" />
                    <div class="cart-item-details">
                        <span class="item-cat-badge">${item.categoryTag || 'Sản phẩm'}</span>
                        <h4 class="item-title">${item.title}</h4>
                        <span class="item-author">${item.author || 'Cửa hàng'}</span>
                        <span class="item-price">${formatVND(item.price)}</span>
                    </div>
                    <div class="quantity-stepper">
                        <button type="button" class="btn-qty btn-minus" data-id="${item.productId || item.id}">-</button>
                        <input type="text" class="qty-input" value="${item.qty}" readonly />
                        <button type="button" class="btn-qty btn-plus" data-id="${item.productId || item.id}">+</button>
                    </div>
                    <div class="item-subtotal">${formatVND(item.price * item.qty)}</div>
                    <button type="button" class="btn-delete-item" data-id="${item.productId || item.id}" title="Xóa khỏi giỏ">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            `).join('');
        }

        // Gán sự kiện tăng/giảm số lượng kết nối Backend API
        document.querySelectorAll('.btn-minus').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                const target = cartItems.find(i => (i.productId || i.id) === id);
                if (target) {
                    if (target.qty > 1) {
                        await updateQuantityAPI(target.productId || id, target.qty - 1);
                    } else {
                        await deleteCartItem(id);
                    }
                }
            });
        });

        document.querySelectorAll('.btn-plus').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                const target = cartItems.find(i => (i.productId || i.id) === id);
                if (target) {
                    await updateQuantityAPI(target.productId || id, target.qty + 1);
                }
            });
        });

        // Gán sự kiện xóa sản phẩm kết nối Backend API
        document.querySelectorAll('.btn-delete-item').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                await deleteCartItem(id);
            });
        });

        calculateTotals();
    }

    // [Mới] Hàm cập nhật số lượng gọi API Backend
    async function updateQuantityAPI(productId, newQty) {
        try {
            const response = await fetch(`${BASE_API_URL}/api/GioHang/update-quantity`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    productId: productId,
                    quantity: newQty
                })
            });

            const data = await response.json();
            if (response.ok && data.success) {
                // Đồng bộ lại danh sách từ response Backend
                cartItems = data.items.map(item => ({
                    id: item.productId,
                    productId: item.productId,
                    cartItemId: item.cartItemId,
                    title: item.title,
                    price: item.price,
                    img: item.img,
                    qty: item.qty,
                    stockQuantity: item.stockQuantity,
                    categoryTag: item.categoryTag,
                    author: item.author
                }));
                renderCart();
            } else {
                showToast(data.message || 'Không thể cập nhật số lượng!');
            }
        } catch (error) {
            console.error('Lỗi khi cập nhật số lượng:', error);
            showToast('Lỗi máy chủ khi cập nhật giỏ hàng!');
        }
    }

    // [Thay đổi] Hàm xóa sản phẩm gọi API Backend và cập nhật giao diện
    async function deleteCartItem(id) {
        const itemRow = document.getElementById(id);
        if (itemRow) {
            itemRow.style.opacity = '0';
        }

        try {
            const response = await fetch(`${BASE_API_URL}/api/GioHang/remove/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (response.ok && data.success) {
                cartItems = data.items.map(item => ({
                    id: item.productId,
                    productId: item.productId,
                    cartItemId: item.cartItemId,
                    title: item.title,
                    price: item.price,
                    img: item.img,
                    qty: item.qty,
                    stockQuantity: item.stockQuantity,
                    categoryTag: item.categoryTag,
                    author: item.author
                }));
                renderCart();
                showToast('Đã xóa sản phẩm khỏi giỏ hàng');
            } else {
                // Fallback nếu API lỗi
                cartItems = cartItems.filter(i => (i.productId || i.id) !== id);
                renderCart();
                showToast('Đã xóa sản phẩm khỏi giỏ hàng');
            }
        } catch (error) {
            console.error('Lỗi khi xóa sản phẩm khỏi giỏ:', error);
            cartItems = cartItems.filter(i => (i.productId || i.id) !== id);
            renderCart();
            showToast('Đã xóa sản phẩm khỏi giỏ hàng');
        }
    }

    // Checkout Action: Chuyển hướng sang trang Thanh Toán & Đặt Hàng
    if (btnCheckout) {
        btnCheckout.addEventListener('click', () => {
            if (!cartItems || cartItems.length === 0) {
                alert('Giỏ hàng của bạn đang trống! Vui lòng chọn ít nhất 1 sản phẩm.');
                return;
            }

            const token = sessionStorage.getItem('jwtToken') || localStorage.getItem('jwtToken');
            if (!token) {
                alert('Vui lòng đăng nhập để tiến hành đặt hàng & thanh toán!');
                window.location.href = '../DangNhap/index.html';
                return;
            }

            // Chuyển hướng sang trang Thanh toán riêng biệt
            window.location.href = '../ThanhToan/index.html';
        });
    }

    // Tải dữ liệu giỏ hàng từ Database qua API Backend
    loadCartFromAPI();

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
