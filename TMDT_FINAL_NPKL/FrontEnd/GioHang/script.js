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

    // Cart data from localStorage
    let cartItems = JSON.parse(localStorage.getItem('npkl_cart_items')) || [];
    const FREESHIP_THRESHOLD = 300000;
    const STANDARD_SHIPPING = 30000;

    function formatVND(amount) {
        return amount.toLocaleString('vi-VN') + 'đ';
    }

    function calculateTotals() {
        let subtotal = 0;
        let totalItemsCount = 0;

        cartItems.forEach(item => {
            subtotal += item.price * item.qty;
            totalItemsCount += item.qty;
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

        // Save state
        localStorage.setItem('npkl_cart_items', JSON.stringify(cartItems));
        localStorage.setItem('npkl_cart_count', totalItemsCount);
    }

    function fixImgSrc(src) {
        if (!src) return '../TrangChinh/images/dac_nhan_tam.jpg';
        if (src.startsWith('../TrangChinh/')) return src;
        if (src.startsWith('images/')) return '../TrangChinh/' + src;
        if (src.startsWith('./images/')) return '../TrangChinh/' + src.substring(2);
        return '../TrangChinh/images/' + src;
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
                <div class="cart-item-row" id="${item.id}">
                    <img src="${fixImgSrc(item.img)}" alt="${item.title}" class="cart-item-img" />
                    <div class="cart-item-details">
                        <span class="item-cat-badge">${item.categoryTag}</span>
                        <h4 class="item-title">${item.title}</h4>
                        <span class="item-author">${item.author}</span>
                        <span class="item-price">${formatVND(item.price)}</span>
                    </div>
                    <div class="quantity-stepper">
                        <button type="button" class="btn-qty btn-minus" data-id="${item.id}">-</button>
                        <input type="text" class="qty-input" value="${item.qty}" readonly />
                        <button type="button" class="btn-qty btn-plus" data-id="${item.id}">+</button>
                    </div>
                    <div class="item-subtotal">${formatVND(item.price * item.qty)}</div>
                    <button type="button" class="btn-delete-item" data-id="${item.id}" title="Xóa khỏi giỏ">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            `).join('');
        }

        // Bind Quantity Steppers
        document.querySelectorAll('.btn-minus').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const target = cartItems.find(i => i.id === id);
                if (target) {
                    if (target.qty > 1) {
                        target.qty -= 1;
                        renderCart();
                    } else {
                        deleteCartItem(id);
                    }
                }
            });
        });

        document.querySelectorAll('.btn-plus').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const target = cartItems.find(i => i.id === id);
                if (target) {
                    target.qty += 1;
                    renderCart();
                }
            });
        });

        // Bind Delete Single Item
        document.querySelectorAll('.btn-delete-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                deleteCartItem(id);
            });
        });

        calculateTotals();
    }

    function deleteCartItem(id) {
        const itemRow = document.getElementById(id);
        if (itemRow) {
            itemRow.style.opacity = '0';
            setTimeout(() => {
                cartItems = cartItems.filter(i => i.id !== id);
                renderCart();
                showToast('Đã xóa sản phẩm khỏi giỏ hàng');
            }, 200);
        }
    }

    // Checkout Action
    if (btnCheckout) {
        btnCheckout.addEventListener('click', () => {
            if (cartItems.length === 0) return;
            alert('🎉 Đặt hàng thành công! Đội ngũ NPKL sẽ liên hệ xác nhận đơn hàng của bạn ngay lập tức.');
            cartItems = [];
            renderCart();
        });
    }

    // Initial Render
    renderCart();

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
});
