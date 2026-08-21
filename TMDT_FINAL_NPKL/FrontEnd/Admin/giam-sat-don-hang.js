document.addEventListener('DOMContentLoaded', () => {
    const BASE_API_URL = window.location.origin;

    const filterSelect = document.getElementById('orderStatusFilter');
    const orderTableBody = document.getElementById('orderTableBody');

    function formatVND(number) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(number || 0).replace('₫', 'đ');
    }

    function formatDate(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? dateStr : d.toLocaleString('vi-VN');
    }

    function getStatusBadgeHtml(status) {
        const statusMap = {
            'PENDING': '<span class="badge-status pending">Chờ xử lý</span>',
            'CONFIRMED': '<span class="badge-status active">Đã xác nhận</span>',
            'SHIPPING': '<span class="badge-status shipping">Đang giao hàng</span>',
            'DELIVERED': '<span class="badge-status delivered">Giao thành công</span>',
            'CANCELLED': '<span class="badge-status blocked">Đã hủy</span>'
        };
        return statusMap[status?.toUpperCase()] || `<span class="badge-status">${status}</span>`;
    }

    async function loadAdminAllOrders(statusFilter = 'ALL') {
        if (!orderTableBody) return;
        const token = sessionStorage.getItem('jwtToken') || localStorage.getItem('jwtToken');
        if (!token) return;

        orderTableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; padding:20px; color:#64748b;">
                    ⏳ Đang tải toàn bộ đơn hàng toàn sàn...
                </td>
            </tr>
        `;

        try {
            const queryParams = new URLSearchParams();
            if (statusFilter && statusFilter !== 'ALL') {
                queryParams.append('status', statusFilter);
            }

            const response = await fetch(`${BASE_API_URL}/api/DonHang/admin/all-orders?${queryParams.toString()}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const result = await response.json();
            if (response.ok && result.success) {
                const orders = result.data || [];
                renderAdminOrdersTable(orders);
            } else {
                orderTableBody.innerHTML = `
                    <tr>
                        <td colspan="7" style="text-align:center; padding:20px; color:#ef4444;">
                            ${result.message || 'Không thể lấy dữ liệu đơn hàng Admin.'}
                        </td>
                    </tr>
                `;
            }
        } catch (err) {
            console.error('Lỗi khi tải đơn hàng Admin:', err);
            orderTableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center; padding:20px; color:#ef4444;">
                        Lỗi kết nối máy chủ!
                    </td>
                </tr>
            `;
        }
    }

    function renderAdminOrdersTable(orders) {
        if (!orderTableBody) return;

        if (!orders || orders.length === 0) {
            orderTableBody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align:center; padding:30px; color:#64748b;">
                        📋 Không tìm thấy đơn hàng nào phù hợp.
                    </td>
                </tr>
            `;
            return;
        }

        orderTableBody.innerHTML = orders.map(order => {
            const orderId = order.orderId || order.OrderId;
            const shopName = order.shopName || order.ShopName || order.shopId;
            const customerName = order.customerName || order.CustomerName || order.customerId;
            const orderDate = formatDate(order.orderDate || order.OrderDate);
            const totalAmount = formatVND(order.totalAmount || order.TotalAmount || 0);
            const address = order.shippingAddress || order.ShippingAddress || 'Chưa cập nhật';
            const status = order.status || order.Status || 'PENDING';

            return `
                <tr data-status="${status}">
                    <td><strong>${orderId}</strong></td>
                    <td><strong>${customerName}</strong></td>
                    <td>${shopName}</td>
                    <td>${orderDate}</td>
                    <td><strong style="color:#10b981;">${totalAmount}</strong></td>
                    <td>${address}</td>
                    <td>${getStatusBadgeHtml(status)}</td>
                    <td>
                        <button class="btn-tb primary btn-view-order" data-id="${orderId}" title="Xem chi tiết đơn hàng" style="padding: 4px 8px; font-size: 1.1rem; border-radius: 4px; background: #e2e8f0; border: 1px solid #cbd5e1; cursor: pointer; color: #334155;">👁️</button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Lọc trạng thái đơn hàng
    if (filterSelect) {
        filterSelect.addEventListener('change', (e) => {
            const selectedStatus = e.target.value;
            loadAdminAllOrders(selectedStatus);
        });
    }

    // Chuyển trang / Mở xem chi tiết đơn hàng
    if (orderTableBody) {
        orderTableBody.addEventListener('click', (e) => {
            const viewBtn = e.target.closest('.btn-view-order');
            if (viewBtn) {
                const orderId = viewBtn.getAttribute('data-id');
                if (typeof showOrderDetailsModal === 'function') {
                    showOrderDetailsModal(orderId);
                }
            }
        });
    }

    loadAdminAllOrders();
});
