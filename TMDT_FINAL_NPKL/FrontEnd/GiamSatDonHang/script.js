document.addEventListener('DOMContentLoaded', () => {
    const BASE_API_URL = 'https://localhost:3001';

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

    // Formatters
    function formatVND(number) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
            .format(number)
            .replace('₫', 'đ');
    }

    function formatDate(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleString('vi-VN');
    }

    function getStatusBadge(status) {
        const statusMap = {
            'PENDING': '<span class="badge-status pending" style="background:#FEF3C7; color:#D97706; padding:4px 8px; border-radius:4px; font-weight:600;">⏳ Chờ xử lý</span>',
            'CONFIRMED': '<span class="badge-status active" style="background:#DBEAFE; color:#2563EB; padding:4px 8px; border-radius:4px; font-weight:600;">✓ Đã xác nhận</span>',
            'SHIPPING': '<span class="badge-status shipping" style="background:#E0E7FF; color:#4F46E5; padding:4px 8px; border-radius:4px; font-weight:600;">🚚 Đang giao hàng</span>',
            'DELIVERED': '<span class="badge-status delivered" style="background:#D1FAE5; color:#059669; padding:4px 8px; border-radius:4px; font-weight:600;">🎉 Đã hoàn thành</span>',
            'CANCELLED': '<span class="badge-status blocked" style="background:#FEE2E2; color:#DC2626; padding:4px 8px; border-radius:4px; font-weight:600;">✕ Đã hủy</span>'
        };
        return statusMap[status?.toUpperCase()] || `<span class="badge-status">${status}</span>`;
    }

    let customerOrdersCache = [];

    // 3. Tải danh sách đơn hàng thực tế từ API
    async function loadCustomerOrders() {
        const orderTableBody = document.getElementById('orderTableBody');
        if (!orderTableBody) return;

        orderTableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 20px; color: #64748b;">
                    ⏳ Đang tải dữ liệu đơn hàng...
                </td>
            </tr>
        `;

        try {
            const response = await fetch(`${BASE_API_URL}/api/DonHang/my-orders`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const result = await response.json();

            if (response.ok && result.success) {
                customerOrdersCache = result.data || result.Data || [];
                renderCustomerOrdersTable(customerOrdersCache);
            } else {
                orderTableBody.innerHTML = `
                    <tr>
                        <td colspan="7" style="text-align: center; padding: 20px; color: #ef4444;">
                            ${result.message || 'Không thể lấy dữ liệu đơn hàng.'}
                        </td>
                    </tr>
                `;
            }
        } catch (err) {
            console.error('Lỗi khi tải đơn hàng:', err);
            orderTableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 20px; color: #ef4444;">
                        Lỗi kết nối máy chủ! Vui lòng thử lại sau.
                    </td>
                </tr>
            `;
        }
    }

    function renderCustomerOrdersTable(orders) {
        const orderTableBody = document.getElementById('orderTableBody');
        if (!orderTableBody) return;

        if (!orders || orders.length === 0) {
            orderTableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 30px; color: #64748b;">
                        📦 Bạn chưa có đơn hàng nào! <a href="../TrangChinh/index.html" style="color:#3b82f6; text-decoration:underline;">Mua sắm ngay</a>
                    </td>
                </tr>
            `;
            return;
        }

        orderTableBody.innerHTML = orders.map(order => {
            const orderId = order.orderId || order.OrderId;
            const shopName = order.shopName || order.ShopName || 'Cửa hàng';
            const orderDate = formatDate(order.orderDate || order.OrderDate);
            const totalAmount = formatVND(order.totalAmount || order.TotalAmount || 0);
            const address = order.shippingAddress || order.ShippingAddress || 'Chưa cập nhật';
            const status = order.status || order.Status || 'PENDING';

            const canCancel = (status === 'PENDING');
            const cancelBtnHtml = canCancel ? `
                <button class="btn-icon btn-cancel-order" data-id="${orderId}" title="Hủy đơn hàng" style="color: #ef4444; margin-left: 5px;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                </button>
            ` : '';

            return `
                <tr>
                    <td><strong>${orderId}</strong></td>
                    <td>${shopName}</td>
                    <td>${orderDate}</td>
                    <td><strong style="color:#10b981;">${totalAmount}</strong></td>
                    <td>${address}</td>
                    <td>${getStatusBadge(status)}</td>
                    <td>
                        <button class="btn-icon btn-view-order" data-id="${orderId}" title="Xem chi tiết">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                        </button>
                        ${cancelBtnHtml}
                    </td>
                </tr>
            `;
        }).join('');
    }

    // 4. Modal Chi Tiết Đơn Hàng
    const modal = document.getElementById('orderDetailModal');
    const btnClose = document.getElementById('closeModalBtn');

    function openModal(orderId) {
        const order = customerOrdersCache.find(o => (o.orderId || o.OrderId) === orderId);
        if (!order || !modal) return;

        const modalOrderId = document.getElementById('modalOrderId');
        const modalOrderDate = document.getElementById('modalOrderDate');
        const modalOrderShop = document.getElementById('modalOrderShop');
        const modalOrderTotal = document.getElementById('modalOrderTotal');
        const modalOrderAddress = document.getElementById('modalOrderAddress');

        if (modalOrderId) modalOrderId.textContent = '#' + orderId;
        if (modalOrderDate) modalOrderDate.textContent = formatDate(order.orderDate || order.OrderDate);
        if (modalOrderShop) modalOrderShop.textContent = order.shopName || order.ShopName || order.shopId;
        if (modalOrderTotal) modalOrderTotal.textContent = formatVND(order.totalAmount || order.TotalAmount || 0);
        if (modalOrderAddress) modalOrderAddress.textContent = order.shippingAddress || order.ShippingAddress;

        // Render sản phẩm trong modal
        const modalBody = modal.querySelector('.modal-body');
        let detailsGroup = modalBody.querySelector('.modal-products-list');
        if (!detailsGroup) {
            detailsGroup = document.createElement('div');
            detailsGroup.className = 'order-detail-group modal-products-list';
            modalBody.appendChild(detailsGroup);
        }

        const items = order.orderDetails || order.OrderDetails || [];
        const itemsHtml = items.length > 0 ? items.map(item => `
            <li style="margin-bottom: 6px; display:flex; justify-content:space-between; align-items:center;">
                <span><strong>${item.productName || item.ProductName || 'Sản phẩm'}</strong> × ${item.quantity || item.Quantity}</span>
                <span style="font-weight:600; color:#475569;">${formatVND((item.price || item.Price) * (item.quantity || item.Quantity))}</span>
            </li>
        `).join('') : '<li>Không có chi tiết sản phẩm</li>';

        const paymentStatus = order.payment?.paymentStatus || 'NotPay';
        const paymentMethod = order.payment?.paymentMethod || 'COD';

        detailsGroup.innerHTML = `
            <label style="font-weight:700; color:#334155;">Danh sách sản phẩm (${items.length} món):</label>
            <ul style="padding-left: 0; list-style:none; color: #1e293b; margin-top: 8px;">
                ${itemsHtml}
            </ul>
            <div style="margin-top: 12px; padding-top: 10px; border-top: 1px dashed #cbd5e1; font-size:0.9rem;">
                <p>💳 <strong>Thanh toán:</strong> ${paymentMethod} (${paymentStatus === 'PAID' ? '✅ Đã thanh toán' : '⏳ Chưa thanh toán'})</p>
                <p>📌 <strong>Trạng thái đơn:</strong> ${getStatusBadge(order.status || order.Status)}</p>
            </div>
        `;

        modal.style.display = 'flex';
        void modal.offsetWidth;
        modal.classList.add('active');
    }

    function closeModal() {
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
    }

    // Sự kiện click bảng (Xem chi tiết & Hủy đơn)
    const orderTableBody = document.getElementById('orderTableBody');
    if (orderTableBody) {
        orderTableBody.addEventListener('click', async (e) => {
            const viewBtn = e.target.closest('.btn-view-order');
            if (viewBtn) {
                const orderId = viewBtn.getAttribute('data-id');
                openModal(orderId);
                return;
            }

            const cancelBtn = e.target.closest('.btn-cancel-order');
            if (cancelBtn) {
                const orderId = cancelBtn.getAttribute('data-id');
                if (confirm(`Bạn có chắc chắn muốn hủy đơn hàng #${orderId}?`)) {
                    try {
                        const response = await fetch(`${BASE_API_URL}/api/DonHang/${orderId}/cancel`, {
                            method: 'PUT',
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });
                        const result = await response.json();
                        if (response.ok && result.success) {
                            alert('Đã hủy đơn hàng thành công! Số lượng sản phẩm đã được hoàn lại kho.');
                            loadCustomerOrders();
                        } else {
                            alert('Hủy đơn hàng thất bại: ' + (result.message || 'Lỗi không xác định'));
                        }
                    } catch (err) {
                        console.error('Lỗi khi hủy đơn hàng:', err);
                        alert('Lỗi kết nối máy chủ!');
                    }
                }
            }
        });
    }

    if (btnClose) {
        btnClose.addEventListener('click', closeModal);
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    // 5. Đồng bộ Top Bar & Badges
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

    loadCustomerOrders();
});
