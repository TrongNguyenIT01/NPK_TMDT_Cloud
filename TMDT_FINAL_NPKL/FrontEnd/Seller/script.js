// Global Logout Handler for Seller pages
window.handleLogout = function handleLogout() {
    sessionStorage.clear();
    localStorage.removeItem("jwtToken"); 
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    localStorage.removeItem("fullName");
    localStorage.removeItem("email");
    localStorage.removeItem("phone");
    localStorage.removeItem("address");
    localStorage.removeItem("npkl_wishlist");
    localStorage.removeItem("npkl_cart_items");
    localStorage.removeItem("npkl_cart_count");
    // Clear dữ liệu nhạy cảm của Seller (Fix bảo mật)
    localStorage.removeItem("myShopStatus");
    localStorage.removeItem("myShopId");
    localStorage.removeItem("myShopName");
    localStorage.removeItem("mySellerId");
    // Clear các dữ liệu nhạy cảm khác nếu có
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('myShop') || key.startsWith('seller') || key.startsWith('shop_')) {
            localStorage.removeItem(key);
        }
    });

    alert("Bạn đã đăng xuất khỏi trang Quản Trị Cửa Hàng thành công!");
    window.location.href = "../TrangChinh/index.html"; 
};

document.addEventListener('DOMContentLoaded', () => {
    // Navigation Guard: Kiểm tra quyền truy cập của Seller dựa trên trạng thái Shop
    async function checkShopAccessGuard() {
        const currentPath = window.location.pathname.toLowerCase();
        if (currentPath.includes("thong-tin-cua-hang.html")) {
            return;
        }

        const token = sessionStorage.getItem("jwtToken") || localStorage.getItem("jwtToken");
        if (!token) return; // checkUser.js sẽ tự xử lý đẩy về trang Login

        try {
            const response = await fetch(`${window.location.origin}/api/Shop/my-shop`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            const result = await response.json();
            
            let status = "NONE";
            if (result.success && result.data) {
                status = result.data.status;
            }

            localStorage.setItem("myShopStatus", status);

            if (status !== "ACTIVE" && status !== "INACTIVE") {
                alert("Cửa hàng của bạn cần phải ở trạng thái HOẠT ĐỘNG (ACTIVE) để sử dụng các chức năng quản lý! Hệ thống sẽ chuyển hướng bạn về trang Thiết Lập Hồ Sơ.");
                window.location.href = "thong-tin-cua-hang.html";
            }
        } catch (error) {
            console.error("Lỗi kiểm tra quyền truy cập cửa hàng:", error);
        }
    }
    
    checkShopAccessGuard();

    // 0. Toggle Sidebar Collapse/Expand
    const toggleSidebarBtn = document.querySelector('#toggleSidebar');
    if (toggleSidebarBtn) {
        toggleSidebarBtn.addEventListener('click', () => {
            document.body.classList.toggle('sidebar-collapsed');
        });
    }

    // 0.1 Dropdown Submenu Accordion Toggle
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            const parentItem = toggle.closest('.has-dropdown');
            if (parentItem) {
                parentItem.classList.toggle('open');
            }
        });
    });

    // 1. Sidebar Navigation Tab Switching
    const menuLinks = document.querySelectorAll('.menu-link');
    const tabPanels = document.querySelectorAll('.tab-panel');
    const pageHeaderTitle = document.querySelector('#pageHeaderTitle');

    menuLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetTab = link.getAttribute('data-tab');
            if (!targetTab) return; // For external links like Log Out

            e.preventDefault();
            const title = link.getAttribute('data-title');

            menuLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            tabPanels.forEach(panel => {
                if (panel.id === targetTab) {
                    panel.classList.add('active');
                } else {
                    panel.classList.remove('active');
                }
            });

            if (pageHeaderTitle && title) {
                pageHeaderTitle.textContent = title;
            }
        });
    });

    // 2. Product Management (Add, Toggle Visibility, Delete)
    const addProductBtn = document.querySelector('#addProductBtn');
    const productModal = document.querySelector('#productModal');
    const closeProductModalBtn = document.querySelector('#closeProductModal');
    const productForm = document.querySelector('#productForm');
    const productTableBody = document.querySelector('#productTableBody');

    if (addProductBtn && productModal) {
        addProductBtn.addEventListener('click', () => {
            productModal.classList.add('active');
        });
    }

    if (closeProductModalBtn && productModal) {
        closeProductModalBtn.addEventListener('click', () => {
            productModal.classList.remove('active');
        });
    }

    if (productForm) {
        productForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.querySelector('#prodNameInput').value.trim();
            const cat = document.querySelector('#prodCatInput').value;
            const price = document.querySelector('#prodPriceInput').value;
            const stock = document.querySelector('#prodStockInput').value;
            const desc = document.querySelector('#prodDescInput').value.trim();

            if (!name || !price) return;

            const newId = 'SP00' + Math.floor(20 + Math.random() * 80);
            const formattedPrice = parseInt(price).toLocaleString('vi-VN') + 'đ';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${newId}</strong></td>
                <td>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <img src="../TrangChinh/images/dac_nhan_tam.jpg" class="product-img-thumb" alt="${name}">
                        <div>
                            <strong>${name}</strong>
                            <p style="font-size:0.78rem; color:#64748B;">Mô tả: ${desc || 'Sản phẩm mới'}</p>
                        </div>
                    </div>
                </td>
                <td>${cat}</td>
                <td><strong>${formattedPrice}</strong></td>
                <td>${stock} SP</td>
                <td class="approval-status-cell"><span class="badge-status pending">Chờ Duyệt (PENDING)</span></td>
                <td class="display-status-cell"><span class="badge-status active">Đang Bán</span></td>
                <td>
                    <div class="btn-action-group">
                        <button class="btn-tb block btn-toggle-vis">Ẩn SP</button>
                        <button class="btn-tb reject" onclick="if(confirm('Bạn có chắc muốn xóa sản phẩm này?')) this.closest('tr').remove();">Xóa</button>
                    </div>
                </td>
            `;

            if (productTableBody) productTableBody.prepend(tr);
            alert(`Đã gửi yêu cầu đăng sản phẩm "${name}"!\nTrạng thái: Chờ Duyệt (PENDING) từ Administrator.`);

            if (productModal) productModal.classList.remove('active');
            productForm.reset();
        });
    }



    // Toggle Product Visibility (Đang Bán <-> Tạm Ẩn)
    if (productTableBody) {
        productTableBody.addEventListener('click', (e) => {
            const visBtn = e.target.closest('.btn-toggle-vis');
            if (!visBtn) return;

            const row = visBtn.closest('tr');
            const displayCell = row.querySelector('.display-status-cell');
            const productName = row.querySelector('strong').textContent;

            if (visBtn.textContent.includes('Ẩn')) {
                displayCell.innerHTML = `<span class="badge-status hidden">Tạm Ẩn</span>`;
                visBtn.textContent = 'Hiện SP';
                visBtn.className = 'btn-tb approve btn-toggle-vis';
                alert(`Đã tạm ẩn sản phẩm: ${productName}`);
            } else {
                displayCell.innerHTML = `<span class="badge-status active">Đang Bán</span>`;
                visBtn.textContent = 'Ẩn SP';
                visBtn.className = 'btn-tb block btn-toggle-vis';
                alert(`Đã hiển thị mở bán lại sản phẩm: ${productName}`);
            }
        });
    }

    // 3. Order Processing Logic & Real API Integration
    const orderTableBody = document.querySelector('#orderTableBody');

    function formatVND(number) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(number).replace('₫', 'đ');
    }

    function formatDate(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? dateStr : d.toLocaleString('vi-VN');
    }

    let allSellerOrdersCache = [];

    async function loadSellerOrders() {
        if (!orderTableBody) return;
        const token = sessionStorage.getItem("jwtToken") || localStorage.getItem("jwtToken");
        if (!token) return;

        orderTableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; padding:20px; color:#64748b;">
                    ⏳ Đang tải danh sách đơn hàng của Shop...
                </td>
            </tr>
        `;

        try {
            const response = await fetch(`${window.location.origin}/api/DonHang/shop-orders`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            const result = await response.json();

            if (response.ok && result.success) {
                allSellerOrdersCache = result.data || result.Data || [];
                applyOrderFiltersAndRender();
            } else {
                orderTableBody.innerHTML = `
                    <tr>
                        <td colspan="7" style="text-align:center; padding:20px; color:#ef4444;">
                            ${result.message || 'Chưa thể lấy dữ liệu đơn hàng.'}
                        </td>
                    </tr>
                `;
            }
        } catch (err) {
            console.error("Lỗi tải đơn hàng Seller:", err);
            orderTableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center; padding:20px; color:#ef4444;">
                        Lỗi kết nối máy chủ!
                    </td>
                </tr>
            `;
        }
    }

    function applyOrderFiltersAndRender() {
        const filterVal = (document.querySelector('#orderStatusFilter')?.value || 'ALL').toUpperCase();
        let filteredOrders = allSellerOrdersCache;
        if (filterVal !== 'ALL') {
            filteredOrders = allSellerOrdersCache.filter(o => (o.status || o.Status || '').toUpperCase() === filterVal);
        }
        renderSellerOrdersTable(filteredOrders);
    }

    const orderStatusFilterSelect = document.querySelector('#orderStatusFilter');
    if (orderStatusFilterSelect) {
        orderStatusFilterSelect.addEventListener('change', () => {
            applyOrderFiltersAndRender();
        });
    }

    function renderSellerOrdersTable(orders) {
        if (!orderTableBody) return;

        if (!orders || orders.length === 0) {
            orderTableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center; padding:30px; color:#64748b;">
                        📦 Chưa có đơn hàng nào gửi đến gian hàng của bạn.
                    </td>
                </tr>
            `;
            return;
        }

        orderTableBody.innerHTML = orders.map(order => {
            const orderId = order.orderId || order.OrderId;
            const customerName = order.customerName || order.CustomerName || order.customerId || 'Khách hàng';
            const orderDate = formatDate(order.orderDate || order.OrderDate);
            const totalAmount = formatVND(order.totalAmount || order.TotalAmount || 0);
            const status = (order.status || order.Status || 'PENDING').toUpperCase();

            let statusBadgeHtml = '';
            let actionButtonsHtml = '';

            if (status === 'PENDING') {
                statusBadgeHtml = `<span class="badge-status pending">Chờ Duyệt (PENDING)</span>`;
                actionButtonsHtml = `
                    <button class="btn-tb approve btn-order-action" data-id="${orderId}" data-target-status="CONFIRMED">Duyệt Đơn</button>
                    <button class="btn-tb reject btn-order-action" data-id="${orderId}" data-target-status="CANCELLED">Hủy Đơn</button>
                `;
            } else if (status === 'CONFIRMED') {
                statusBadgeHtml = `<span class="badge-status active">Đã Xác Nhận</span>`;
                actionButtonsHtml = `
                    <button class="btn-tb primary btn-order-action" data-id="${orderId}" data-target-status="SHIPPING">Giao Vận Chuyển</button>
                    <button class="btn-tb reject btn-order-action" data-id="${orderId}" data-target-status="CANCELLED">Hủy Đơn</button>
                `;
            } else if (status === 'SHIPPING') {
                statusBadgeHtml = `<span class="badge-status shipping">Đang Giao Hàng</span>`;
                actionButtonsHtml = `
                    <button class="btn-tb approve btn-order-action" data-id="${orderId}" data-target-status="DELIVERED">Đã Giao Hàng</button>
                `;
            } else if (status === 'DELIVERED') {
                statusBadgeHtml = `<span class="badge-status delivered">Giao Thành Công</span>`;
                actionButtonsHtml = `<span style="font-size:0.82rem; color:#16A34A; font-weight:700;">✓ Hoàn tất</span>`;
            } else if (status === 'CANCELLED') {
                statusBadgeHtml = `<span class="badge-status blocked">Đã Hủy</span>`;
                actionButtonsHtml = `<span style="font-size:0.82rem; color:#DC2626; font-weight:700;">✕ Đã hủy</span>`;
            }

            const itemsCount = (order.orderDetails || order.OrderDetails || []).length;
            const itemsSummary = (order.orderDetails || order.OrderDetails || [])
                .map(i => `${i.productName || i.ProductName} (x${i.quantity || i.Quantity})`)
                .join(', ') || `${itemsCount} sản phẩm`;

            return `
                <tr>
                    <td><strong>${orderId}</strong></td>
                    <td>${orderDate}</td>
                    <td><strong>${customerName}</strong></td>
                    <td><span title="${itemsSummary}" style="display:inline-block; max-width:220px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; vertical-align:middle;">${itemsSummary}</span></td>
                    <td><strong style="color:#10b981;">${totalAmount}</strong></td>
                    <td class="order-status-cell">${statusBadgeHtml}</td>
                    <td>
                        <div class="btn-action-group">
                            <button class="btn-tb primary btn-view-seller-order-detail" data-id="${orderId}">🔍 Chi Tiết</button>
                            ${actionButtonsHtml}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    async function showSellerOrderDetailsModal(orderId) {
        const modal = document.getElementById('sellerOrderDetailsModal');
        if (!modal) return;

        document.getElementById('seller_order_id').textContent = '#' + orderId;
        document.getElementById('seller_order_date').textContent = '⏳ Đang tải...';

        const statusSpan = document.getElementById('seller_order_status');
        if (statusSpan) {
            statusSpan.textContent = '...';
            statusSpan.className = 'badge-status';
        }

        if (document.getElementById('seller_customer_id')) document.getElementById('seller_customer_id').textContent = '...';
        if (document.getElementById('seller_customer_name')) document.getElementById('seller_customer_name').textContent = '...';
        if (document.getElementById('seller_shipping_address')) document.getElementById('seller_shipping_address').textContent = '...';
        if (document.getElementById('seller_payment_method')) document.getElementById('seller_payment_method').textContent = '...';
        if (document.getElementById('seller_payment_status')) document.getElementById('seller_payment_status').textContent = '...';

        const detailsList = document.getElementById('seller_order_details_list');
        if (detailsList) detailsList.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px;">⏳ Đang tải danh sách sản phẩm...</td></tr>';
        if (document.getElementById('seller_total_amount')) document.getElementById('seller_total_amount').textContent = '0đ';

        modal.style.display = 'flex';

        const token = sessionStorage.getItem('jwtToken') || localStorage.getItem('jwtToken');
        try {
            const response = await fetch(`${window.location.origin}/api/DonHang/${orderId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const result = await response.json();

            if (response.ok && result.success && result.data) {
                const data = result.data;
                document.getElementById('seller_order_date').textContent = formatDate(data.orderDate);

                if (statusSpan) {
                    const statusMap = {
                        'PENDING': { label: 'Chờ duyệt (PENDING)', class: 'pending' },
                        'CONFIRMED': { label: 'Đã xác nhận (CONFIRMED)', class: 'active' },
                        'SHIPPING': { label: 'Đang giao (SHIPPING)', class: 'shipping' },
                        'DELIVERED': { label: 'Giao thành công (DELIVERED)', class: 'delivered' },
                        'CANCELLED': { label: 'Đã hủy (CANCELLED)', class: 'blocked' }
                    };
                    const stInfo = statusMap[data.status] || { label: data.status, class: '' };
                    statusSpan.textContent = stInfo.label;
                    statusSpan.className = `badge-status ${stInfo.class}`;
                }

                if (document.getElementById('seller_customer_id')) document.getElementById('seller_customer_id').textContent = data.customerId || 'N/A';
                if (document.getElementById('seller_customer_name')) document.getElementById('seller_customer_name').textContent = data.customerName || 'N/A';
                if (document.getElementById('seller_shipping_address')) document.getElementById('seller_shipping_address').textContent = data.shippingAddress || 'Chưa cung cấp';

                const payment = data.payment || {};
                if (document.getElementById('seller_payment_method')) document.getElementById('seller_payment_method').textContent = payment.paymentMethod || 'COD (Thanh toán khi nhận hàng)';
                
                const payStatusEl = document.getElementById('seller_payment_status');
                if (payStatusEl) {
                    if (payment.paymentStatus === 'FAILED' || data.status === 'CANCELLED') {
                        payStatusEl.textContent = 'THẤT BẠI / ĐÃ HỦY (FAILED)';
                        payStatusEl.className = 'badge-status blocked';
                    } else if (payment.paymentStatus === 'PAID' || data.status === 'DELIVERED') {
                        payStatusEl.textContent = 'ĐÃ THANH TOÁN (PAID)';
                        payStatusEl.className = 'badge-status active';
                    } else {
                        payStatusEl.textContent = 'CHƯA THANH TOÁN (PENDING)';
                        payStatusEl.className = 'badge-status pending';
                    }
                }

                const items = data.orderDetails || [];
                if (detailsList) {
                    if (items.length === 0) {
                        detailsList.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#64748b;">Không có dữ liệu chi tiết sản phẩm.</td></tr>';
                    } else {
                        detailsList.innerHTML = items.map(item => `
                            <tr>
                                <td><strong>${item.productId}</strong></td>
                                <td>
                                    <div style="display:flex; align-items:center; gap:10px;">
                                        ${item.productImage ? `<img src="${item.productImage.startsWith('/') ? window.location.origin + item.productImage : item.productImage}" style="width:40px; height:40px; border-radius:6px; object-fit:cover;" onerror="this.style.display='none'" />` : ''}
                                        <strong style="color:#0F172A;">${item.productName}</strong>
                                    </div>
                                </td>
                                <td>${formatVND(item.price)}</td>
                                <td><strong>x${item.quantity}</strong></td>
                                <td><strong style="color:#10B981;">${formatVND(item.price * item.quantity)}</strong></td>
                            </tr>
                        `).join('');
                    }
                }

                if (document.getElementById('seller_total_amount')) document.getElementById('seller_total_amount').textContent = formatVND(data.totalAmount);
            } else {
                alert(result.message || 'Không thể lấy thông tin chi tiết đơn hàng!');
            }
        } catch (err) {
            console.error('Lỗi khi lấy chi tiết đơn hàng Seller:', err);
            alert('Không thể kết nối máy chủ!');
        }
    }

    if (orderTableBody) {
        orderTableBody.addEventListener('click', async (e) => {
            const detailBtn = e.target.closest('.btn-view-seller-order-detail');
            if (detailBtn) {
                const orderId = detailBtn.getAttribute('data-id');
                if (orderId) showSellerOrderDetailsModal(orderId);
                return;
            }

            const btn = e.target.closest('.btn-order-action');
            if (!btn) return;

            const orderId = btn.getAttribute('data-id');
            const targetStatus = btn.getAttribute('data-target-status');
            const token = sessionStorage.getItem("jwtToken") || localStorage.getItem("jwtToken");

            if (!orderId || !targetStatus || !token) return;

            const statusNames = {
                'CONFIRMED': 'Xác nhận đơn hàng',
                'SHIPPING': 'Chuyển giao cho nhà vận chuyển',
                'DELIVERED': 'Xác nhận đơn hàng đã giao thành công',
                'CANCELLED': 'Hủy đơn hàng này'
            };

            if (confirm(`Bạn có chắc chắn muốn [${statusNames[targetStatus] || targetStatus}] cho đơn #${orderId}?`)) {
                try {
                    const response = await fetch(`${window.location.origin}/api/DonHang/${orderId}/status`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ status: targetStatus })
                    });
                    const result = await response.json();
                    if (response.ok && result.success) {
                        alert(result.message || 'Cập nhật trạng thái đơn hàng thành công!');
                        loadSellerOrders();
                    } else {
                        alert('Cập nhật thất bại: ' + (result.message || 'Lỗi không xác định'));
                    }
                } catch (err) {
                    console.error('Lỗi đổi trạng thái đơn Seller:', err);
                    alert('Lỗi kết nối máy chủ!');
                }
            }
        });
    }

    const closeSellerOrderModalBtn = document.getElementById('closeSellerOrderDetailsModal');
    const sellerOrderModal = document.getElementById('sellerOrderDetailsModal');

    if (closeSellerOrderModalBtn && sellerOrderModal) {
        closeSellerOrderModalBtn.addEventListener('click', () => {
            sellerOrderModal.style.display = 'none';
        });

        sellerOrderModal.addEventListener('click', (e) => {
            if (e.target === sellerOrderModal) {
                sellerOrderModal.style.display = 'none';
            }
        });
    }

    if (orderTableBody) {
        loadSellerOrders();
    }

    // 4. Shop Profile Save Form & API Integration
    const shopProfileForm = document.querySelector('#shopProfileForm');

    async function loadShopProfile() {
        const token = sessionStorage.getItem("jwtToken") || localStorage.getItem("jwtToken");
        if (!token) return;

        try {
            const response = await fetch(`${window.location.origin}/api/Shop/my-shop`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            const result = await response.json();

            const shopIdInput = document.querySelector('#profileShopId');
            const sellerIdInput = document.querySelector('#profileSellerId');
            const shopNameInput = document.querySelector('#profileShopName');
            const phoneInput = document.querySelector('#profilePhone');
            const emailInput = document.querySelector('#profileEmail');
            const addressInput = document.querySelector('#profileAddress');
            const descInput = document.querySelector('#profileDescription');
            const statusSelect = document.querySelector('#profileShopStatus');
            const submitBtn = document.querySelector('#btnSubmitProfile');
            const formTitle = document.querySelector('#formTitle');
            
            const banner = document.querySelector('#shopStatusBanner');
            const bannerText = document.querySelector('#shopStatusBannerText');
            const bannerIcon = document.querySelector('#shopStatusBannerIcon');

            const headerShopName = document.querySelector('#headerShopName');
            const headerShopSubtitle = document.querySelector('#headerShopSubtitle');
            const headerShopAvatar = document.querySelector('#headerShopAvatar');

            const sidebarName = document.querySelector('.seller-info .seller-name');
            const sidebarRole = document.querySelector('.seller-info .seller-role');
            const sidebarAvatar = document.querySelector('.seller-avatar');

            if (result.success && result.data) {
                const shop = result.data;
                if (shopIdInput) shopIdInput.value = shop.shopId;
                if (sellerIdInput) sellerIdInput.value = shop.sellerId;
                if (shopNameInput) shopNameInput.value = shop.shopName;
                if (phoneInput) phoneInput.value = shop.phone || '';
                if (emailInput) emailInput.value = shop.email || '';
                if (addressInput) addressInput.value = shop.address || '';
                if (descInput) descInput.value = shop.description || '';
                
                if (headerShopName) headerShopName.textContent = shop.shopName;
                if (headerShopSubtitle) headerShopSubtitle.textContent = `Mã Shop: ${shop.shopId} | Chủ: ${shop.sellerId}`;
                if (headerShopAvatar) headerShopAvatar.textContent = shop.shopName.substring(0, 2).toUpperCase();

                if (sidebarName) sidebarName.textContent = shop.shopName;
                if (sidebarRole) sidebarRole.textContent = `Mã Shop: ${shop.shopId}`;
                if (sidebarAvatar) sidebarAvatar.textContent = shop.shopName.substring(0, 2).toUpperCase();

                localStorage.setItem("myShopStatus", shop.status);

                if (shop.status === "PENDING") {
                    if (statusSelect) {
                        statusSelect.value = "PENDING";
                        statusSelect.disabled = true;
                    }
                    if (banner) {
                        banner.style.display = "flex";
                        banner.style.backgroundColor = "#FEF3C7";
                        banner.style.borderColor = "#F59E0B";
                        banner.style.color = "#D97706";
                        bannerText.textContent = "Cửa hàng đang chờ Admin phê duyệt. Bạn chưa thể đăng bán sản phẩm.";
                        bannerIcon.textContent = "⏳";
                    }
                    if (submitBtn) {
                        submitBtn.textContent = "Cập Nhật Thông Tin";
                    }
                } 
                else if (shop.status === "REJECTED") {
                    if (statusSelect) {
                        statusSelect.value = "PENDING";
                        statusSelect.disabled = true;
                    }
                    if (banner) {
                        banner.style.display = "flex";
                        banner.style.backgroundColor = "#FFEDD5";
                        banner.style.borderColor = "#F97316";
                        banner.style.color = "#EA580C";
                        bannerText.textContent = "Đơn mở gian hàng của bạn đã bị từ chối. Vui lòng chỉnh sửa lại thông tin và gửi lại yêu cầu duyệt.";
                        bannerIcon.textContent = "❌";
                    }
                    if (submitBtn) {
                        submitBtn.textContent = "Gửi Lại Yêu Cầu Duyệt";
                    }
                }
                else if (shop.status === "BANNED") {
                    if (statusSelect) {
                        statusSelect.value = "BANNED";
                        statusSelect.disabled = true;
                    }
                    if (shopNameInput) shopNameInput.disabled = true;
                    if (phoneInput) phoneInput.disabled = true;
                    if (emailInput) emailInput.disabled = true;
                    if (addressInput) addressInput.disabled = true;
                    if (descInput) descInput.disabled = true;
                    if (submitBtn) submitBtn.disabled = true;

                    if (banner) {
                        banner.style.display = "flex";
                        banner.style.backgroundColor = "#FEE2E2";
                        banner.style.borderColor = "#EF4444";
                        banner.style.color = "#DC2626";
                        bannerText.textContent = "Cửa hàng của bạn đã bị cấm hoạt động. Vui lòng liên hệ QTV để được giải quyết.";
                        bannerIcon.textContent = "🚫";
                    }
                } 
                else {
                    if (statusSelect) {
                        statusSelect.value = shop.status;
                        statusSelect.disabled = false;
                        Array.from(statusSelect.options).forEach(opt => {
                            if (opt.value === "ACTIVE" || opt.value === "INACTIVE") {
                                opt.disabled = false;
                            } else {
                                opt.disabled = true;
                            }
                        });
                    }
                    if (banner) banner.style.display = "none";
                    if (submitBtn) submitBtn.textContent = "Lưu Thay Đổi Hồ Sơ";
                }
            } 
            else if (result.code === "NO_SHOP") {
                localStorage.setItem("myShopStatus", "NONE");

                if (formTitle) formTitle.textContent = "Đăng Ký Mở Cửa Hàng Mới";
                if (shopIdInput) shopIdInput.value = "Hệ thống tự động sinh";
                if (sellerIdInput) sellerIdInput.value = "Tài khoản hiện tại";
                
                if (phoneInput) phoneInput.value = result.data?.phone || '';
                if (emailInput) emailInput.value = result.data?.email || '';
                if (addressInput) addressInput.value = result.data?.address || '';

                if (statusSelect) {
                    statusSelect.value = "PENDING";
                    statusSelect.disabled = true;
                }

                if (banner) {
                    banner.style.display = "flex";
                    banner.style.backgroundColor = "#DBEAFE";
                    banner.style.borderColor = "#3B82F6";
                    banner.style.color = "#1D4ED8";
                    bannerText.textContent = "Bạn chưa đăng ký cửa hàng. Vui lòng điền thông tin và gửi yêu cầu phê duyệt.";
                    bannerIcon.textContent = "🏪";
                }

                if (submitBtn) {
                    submitBtn.textContent = "Đăng Ký Mở Cửa Hàng";
                }

                if (headerShopName) headerShopName.textContent = "Chưa có cửa hàng";
                if (headerShopSubtitle) headerShopSubtitle.textContent = "Vui lòng đăng ký mới";
            }
        } catch (error) {
            console.error("Lỗi khi tải thông tin cửa hàng:", error);
        }
    }

    if (shopProfileForm) {
        shopProfileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const token = sessionStorage.getItem("jwtToken") || localStorage.getItem("jwtToken");
            if (!token) return;

            const shopName = document.querySelector('#profileShopName').value.trim();
            const phone = document.querySelector('#profilePhone').value.trim();
            const email = document.querySelector('#profileEmail').value.trim();
            const address = document.querySelector('#profileAddress').value.trim();
            const description = document.querySelector('#profileDescription').value.trim();
            const status = document.querySelector('#profileShopStatus').value;

            const isNewShop = localStorage.getItem("myShopStatus") === "NONE";
            const url = isNewShop ? `${window.location.origin}/api/Shop/create` : `${window.location.origin}/api/Shop/update-profile`;
            const method = isNewShop ? "POST" : "PUT";

            const payload = {
                shopName,
                phone,
                email,
                address,
                description
            };

            if (!isNewShop) {
                payload.status = status;
            }

            try {
                const response = await fetch(url, {
                    method: method,
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();
                if (response.ok && result.success) {
                    alert(result.message || "Cập nhật thành công!");
                    loadShopProfile();
                } else {
                    alert("Thất bại: " + (result.message || "Có lỗi xảy ra!"));
                }
            } catch (error) {
                console.error("Lỗi gửi form:", error);
                alert("Lỗi kết nối máy chủ!");
            }
        });
    }

    // Tự động tải dữ liệu nếu đang ở trang cấu hình cửa hàng
    if (document.querySelector('#shopProfileForm')) {
        loadShopProfile();
    }

    // 5. Revenue Tracking Page Logic & Chart.js Integration
    let dailyChartInstance = null;
    let orderStatusChartInstance = null;

    async function loadSellerRevenueStats(selectedMonth, selectedYear) {
        const dailyTableBody = document.querySelector('#dailyRevenueTableBody');
        const monthTitle = document.querySelector('#revenueMonthTitle');
        const totalRevenueEl = document.querySelector('#totalRevenueVal');
        const successfulOrdersEl = document.querySelector('#successfulOrdersVal');
        const averageOrderEl = document.querySelector('#averageOrderVal');
        const successRateEl = document.querySelector('#successRateText');

        if (!dailyTableBody) return; // Không ở trang Theo Dõi Doanh Thu

        const token = sessionStorage.getItem("jwtToken") || localStorage.getItem("jwtToken");
        if (!token) return;

        const now = new Date();
        const m = selectedMonth || (document.querySelector('#revenueMonthSelect')?.value) || (now.getMonth() + 1);
        const y = selectedYear || (document.querySelector('#revenueYearSelect')?.value) || now.getFullYear();

        // Đồng bộ giá trị vào select dropdown
        const monthSelect = document.querySelector('#revenueMonthSelect');
        const yearSelect = document.querySelector('#revenueYearSelect');
        if (monthSelect) monthSelect.value = m;
        if (yearSelect) yearSelect.value = y;

        if (monthTitle) monthTitle.textContent = `Tổng Doanh Thu Tháng ${m}/${y}`;
        dailyTableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center; padding:25px; color:#64748b;">
                    ⏳ Đang tải dữ liệu báo cáo doanh thu Tháng ${m}/${y}...
                </td>
            </tr>
        `;

        try {
            const response = await fetch(`${window.location.origin}/api/ThkeSeller/revenue-stats?month=${m}&year=${y}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            const result = await response.json();

            if (response.ok && result.success && result.data) {
                const data = result.data;

                // 1. Cập nhật Thẻ Metric Chỉ Số
                if (totalRevenueEl) totalRevenueEl.textContent = formatVND(data.totalRevenue || 0);
                if (successfulOrdersEl) successfulOrdersEl.textContent = `${data.successfulOrdersCount || 0} Đơn`;
                if (averageOrderEl) averageOrderEl.textContent = `${formatVND(data.averageOrderValue || 0)} / đơn`;
                if (successRateEl) successRateEl.textContent = `Tỷ lệ thành công: ${data.successRate || 0}% (${data.successfulOrdersCount}/${data.totalOrdersCount} đơn)`;

                // 2. Render Bảng Biến Động Doanh Thu Theo Ngày
                const dailyStats = data.dailyStats || [];
                if (dailyStats.length === 0) {
                    dailyTableBody.innerHTML = `
                        <tr>
                            <td colspan="5" style="text-align:center; padding:25px; color:#64748b;">
                                📦 Chưa có doanh thu ghi nhận trong tháng ${m}/${y}.
                            </td>
                        </tr>
                    `;
                } else {
                    dailyTableBody.innerHTML = dailyStats.map(stat => {
                        return `
                            <tr>
                                <td><strong>${stat.date} (Ngày ${stat.dayNumber})</strong></td>
                                <td><strong>${stat.successfulOrdersCount}</strong> đơn</td>
                                <td><strong style="color: #10B981;">${formatVND(stat.dailyRevenue)}</strong></td>
                                <td>${formatVND(stat.averageOrderValue)}</td>
                                <td><span class="badge-status active">Đã Ghi Nhận</span></td>
                            </tr>
                        `;
                    }).join('');
                }

                // 3. Vẽ Biểu Đồ Cột (Daily Revenue Chart)
                renderDailyRevenueChart(dailyStats);

                // 4. Vẽ Biểu Đồ Tròn (Order Status Donut Chart)
                renderOrderStatusChart(data.successfulOrdersCount, (data.totalOrdersCount - data.successfulOrdersCount));
            } else {
                dailyTableBody.innerHTML = `
                    <tr>
                        <td colspan="5" style="text-align:center; padding:25px; color:#ef4444;">
                            ${result.message || 'Không thể tải báo cáo doanh thu.'}
                        </td>
                    </tr>
                `;
            }
        } catch (err) {
            console.error("Lỗi tải báo cáo doanh thu Seller:", err);
            dailyTableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align:center; padding:25px; color:#ef4444;">
                        Lỗi kết nối máy chủ!
                    </td>
                </tr>
            `;
        }
    }

    function renderDailyRevenueChart(dailyStats) {
        const canvas = document.getElementById('dailyRevenueChart');
        if (!canvas || typeof Chart === 'undefined') return;

        const labels = dailyStats.map(d => `Ngày ${d.dayNumber}`);
        const revenues = dailyStats.map(d => d.dailyRevenue);

        if (dailyChartInstance) {
            dailyChartInstance.destroy();
        }

        const ctx = canvas.getContext('2d');
        dailyChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Doanh thu ngày (VNĐ)',
                    data: revenues,
                    backgroundColor: 'rgba(59, 130, 246, 0.75)',
                    borderColor: '#2563EB',
                    borderWidth: 1.5,
                    borderRadius: 4,
                    hoverBackgroundColor: '#1D4ED8'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return 'Doanh thu: ' + formatVND(context.raw);
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { font: { size: 10 } }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                if (value >= 1000000) return (value / 1000000) + ' triệu';
                                if (value >= 1000) return (value / 1000) + 'k';
                                return value;
                            }
                        }
                    }
                }
            }
        });
    }

    function renderOrderStatusChart(successCount, otherCount) {
        const canvas = document.getElementById('orderStatusChart');
        if (!canvas || typeof Chart === 'undefined') return;

        if (orderStatusChartInstance) {
            orderStatusChartInstance.destroy();
        }

        const safeOtherCount = Math.max(0, otherCount);
        const ctx = canvas.getContext('2d');

        orderStatusChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Đơn Thành Công / Paid', 'Các Trạng Thái Khác'],
                datasets: [{
                    data: [successCount, safeOtherCount],
                    backgroundColor: ['#10B981', '#E2E8F0'],
                    borderColor: ['#059669', '#CBD5E1'],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { font: { size: 11, weight: 'bold' } }
                    }
                }
            }
        });
    }

    // Sự kiện nút lọc Doanh Thu
    const btnFilterRevenue = document.querySelector('#btnFilterRevenue');
    if (btnFilterRevenue) {
        btnFilterRevenue.addEventListener('click', () => {
            const m = document.querySelector('#revenueMonthSelect')?.value;
            const y = document.querySelector('#revenueYearSelect')?.value;
            loadSellerRevenueStats(m, y);
        });
    }

    // Tự động tải báo cáo doanh thu khi truy cập theo-doi-doanh-thu.html
    if (document.querySelector('#dailyRevenueTableBody')) {
        const now = new Date();
        loadSellerRevenueStats(now.getMonth() + 1, now.getFullYear());
    }

    // 6. Seller Overview Dashboard (index.html) Data Loading
    async function loadSellerDashboardStats() {
        const totalRevenueEl = document.querySelector('#dashTotalRevenue');
        const revenueTrendEl = document.querySelector('#dashRevenueTrend');
        const pendingCountEl = document.querySelector('#dashPendingOrdersCount');
        const pendingBadgeEl = document.querySelector('#dashPendingBadge');
        const totalProductsEl = document.querySelector('#dashTotalProducts');
        const productBadgeEl = document.querySelector('#dashProductBadge');
        const recentOrdersTableBody = document.querySelector('#dashRecentOrdersTableBody');

        if (!totalRevenueEl && !recentOrdersTableBody) return; // Không phải trang Overview Dashboard

        const token = sessionStorage.getItem("jwtToken") || localStorage.getItem("jwtToken");
        if (!token) return;

        const now = new Date();
        const m = now.getMonth() + 1;
        const y = now.getFullYear();

        // 1. Tải Doanh Thu Bán Hàng Tháng Này từ ThkeSellerController API
        try {
            const revRes = await fetch(`${window.location.origin}/api/ThkeSeller/revenue-stats?month=${m}&year=${y}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const revData = await revRes.json();
            const isRevSuccess = revData.success || revData.Success;
            if (revRes.ok && isRevSuccess) {
                const dataObj = revData.data || revData.Data || {};
                const totalRev = dataObj.totalRevenue !== undefined ? dataObj.totalRevenue : (dataObj.TotalRevenue || 0);
                if (totalRevenueEl) totalRevenueEl.textContent = formatVND(totalRev);
                if (revenueTrendEl) revenueTrendEl.textContent = `Tháng ${m}/${y}`;
            }
        } catch (err) {
            console.error("Lỗi tải doanh thu dashboard:", err);
        }

        // 2. Tải Danh Sách Đơn Hàng từ DonHangController API (Đếm Đơn PENDING & Render Bảng Đơn Mới Nhất)
        try {
            const orderRes = await fetch(`${window.location.origin}/api/DonHang/shop-orders`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const orderData = await orderRes.json();
            const isOrderSuccess = orderData.success || orderData.Success;
            if (orderRes.ok && isOrderSuccess) {
                const orders = orderData.data || orderData.Data || [];
                const pendingOrders = orders.filter(o => (o.status || o.Status || '').toUpperCase() === 'PENDING');
                
                if (pendingCountEl) pendingCountEl.textContent = `${pendingOrders.length} Đơn Hàng`;
                if (pendingBadgeEl) pendingBadgeEl.textContent = `${pendingOrders.length} Đơn chờ duyệt`;

                if (recentOrdersTableBody) {
                    if (pendingOrders.length === 0) {
                        recentOrdersTableBody.innerHTML = `
                            <tr>
                                <td colspan="6" style="text-align:center; padding:25px; color:#64748b;">
                                    📦 Không có đơn hàng nào đang chờ phê duyệt.
                                </td>
                            </tr>
                        `;
                    } else {
                        recentOrdersTableBody.innerHTML = pendingOrders.map(order => {
                            const orderId = order.orderId || order.OrderId;
                            const customerName = order.customerName || order.CustomerName || order.customerId || 'Khách hàng';
                            const orderDate = formatDate(order.orderDate || order.OrderDate);
                            const totalAmount = formatVND(order.totalAmount || order.TotalAmount || 0);

                            const itemsCount = (order.orderDetails || order.OrderDetails || []).length;
                            const itemsSummary = (order.orderDetails || order.OrderDetails || [])
                                .map(i => `${i.productName || i.ProductName} (x${i.quantity || i.Quantity})`)
                                .join(', ') || `${itemsCount} sản phẩm`;

                            return `
                                <tr>
                                    <td><strong>${orderId}</strong></td>
                                    <td>${orderDate}</td>
                                    <td><strong>${customerName}</strong></td>
                                    <td><span title="${itemsSummary}" style="display:inline-block; max-width:260px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; vertical-align:middle;">${itemsSummary}</span></td>
                                    <td><strong style="color:#10b981;">${totalAmount}</strong></td>
                                    <td><span class="badge-status pending">Chờ Duyệt</span></td>
                                </tr>
                            `;
                        }).join('');
                    }
                }
            }
        } catch (err) {
            console.error("Lỗi tải danh sách đơn hàng dashboard:", err);
        }

        // 3. Tải Danh Sách Sản Phẩm Đang Kinh Doanh từ LaySPSellerController API (Chỉ đếm các sản phẩm đang kinh doanh is_deleted = false)
        try {
            const prodRes = await fetch(`${window.location.origin}/api/LaySPSeller/seller-list?page=1&pageSize=1000&status=visible`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const prodData = await prodRes.json();
            const isSuccess = prodData.success || prodData.Success;
            if (prodRes.ok && isSuccess) {
                const dataObj = prodData.data || prodData.Data || {};
                const pagObj = dataObj.pagination || dataObj.Pagination || {};
                const itemsList = (dataObj.items || dataObj.Items || []).filter(item => {
                    const deleted = item.isDeleted !== undefined ? item.isDeleted : item.IsDeleted;
                    return !deleted;
                });

                let totalCount = 0;
                if (pagObj.totalItems !== undefined && pagObj.totalItems !== null) {
                    totalCount = pagObj.totalItems;
                } else if (pagObj.TotalItems !== undefined && pagObj.TotalItems !== null) {
                    totalCount = pagObj.TotalItems;
                } else {
                    totalCount = itemsList.length;
                }

                if (totalProductsEl) totalProductsEl.textContent = `${totalCount}`;
                if (productBadgeEl) productBadgeEl.textContent = `${totalCount} Sản phẩm`;
            }
        } catch (err) {
            console.error("Lỗi tải tổng số sản phẩm dashboard:", err);
        }
    }

    // Tự động kích hoạt tải dữ liệu nếu ở trang Tổng Quan Dashboard (index.html)
    if (document.querySelector('#dashTotalRevenue') || document.querySelector('#dashRecentOrdersTableBody')) {
        loadSellerDashboardStats();
    }
});
