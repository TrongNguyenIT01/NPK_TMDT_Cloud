function formatVND(number) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(number || 0).replace('₫', 'đ');
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleString('vi-VN');
}

async function showOrderDetailsModal(orderId) {
    const modal = document.getElementById('orderDetailsModal');
    if (!modal) return;
    
    document.getElementById('order_id').textContent = orderId;
    
    // Reset/Xóa nội dung cũ trong khi chờ API load dữ liệu
    document.getElementById('order_date').textContent = '⏳ Đang tải...';
    const statusSpan = document.getElementById('status');
    if (statusSpan) {
        statusSpan.textContent = '...';
        statusSpan.className = 'badge-status';
    }
    
    if (document.getElementById('customer_id')) document.getElementById('customer_id').textContent = '...';
    if (document.getElementById('customer_name')) document.getElementById('customer_name').textContent = '...';
    if (document.getElementById('customer_phone')) document.getElementById('customer_phone').textContent = '...';
    if (document.getElementById('shipping_address')) document.getElementById('shipping_address').textContent = '...';
    
    if (document.getElementById('shop_id')) document.getElementById('shop_id').textContent = '...';
    if (document.getElementById('shop_name')) document.getElementById('shop_name').textContent = '...';
    
    const detailsList = document.getElementById('order_details_list');
    if (detailsList) detailsList.innerHTML = '<tr><td colspan="4" style="text-align:center;">⏳ Đang tải danh sách sản phẩm...</td></tr>';
    
    if (document.getElementById('subtotal')) document.getElementById('subtotal').textContent = '...';
    if (document.getElementById('shipping_fee')) document.getElementById('shipping_fee').textContent = '...';
    if (document.getElementById('total_amount')) document.getElementById('total_amount').textContent = '...';

    modal.style.display = 'flex';

    const token = sessionStorage.getItem('jwtToken') || localStorage.getItem('jwtToken');
    try {
        const response = await fetch(`https://localhost:3001/api/DonHang/${orderId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const result = await response.json();

        if (response.ok && result.success && result.data) {
            const data = result.data;
            if (document.getElementById('order_date')) document.getElementById('order_date').textContent = formatDate(data.orderDate);
            
            if (statusSpan) {
                const statusMap = {
                    'PENDING': { label: 'Chờ xử lý (PENDING)', class: 'pending' },
                    'CONFIRMED': { label: 'Đã xác nhận (CONFIRMED)', class: 'active' },
                    'SHIPPING': { label: 'Đang giao hàng (SHIPPING)', class: 'shipping' },
                    'DELIVERED': { label: 'Giao thành công (DELIVERED)', class: 'delivered' },
                    'CANCELLED': { label: 'Đã hủy (CANCELLED)', class: 'blocked' }
                };
                const stInfo = statusMap[data.status] || { label: data.status, class: '' };
                statusSpan.textContent = stInfo.label;
                statusSpan.className = `badge-status ${stInfo.class}`;
            }

            if (document.getElementById('customer_id')) document.getElementById('customer_id').textContent = data.customerId || 'N/A';
            if (document.getElementById('customer_name')) document.getElementById('customer_name').textContent = data.customerName || 'N/A';
            if (document.getElementById('customer_phone')) document.getElementById('customer_phone').textContent = 'Xem thông tin tài khoản';
            if (document.getElementById('shipping_address')) document.getElementById('shipping_address').textContent = data.shippingAddress || 'N/A';

            if (document.getElementById('shop_id')) document.getElementById('shop_id').textContent = data.shopId || 'N/A';
            if (document.getElementById('shop_name')) document.getElementById('shop_name').textContent = data.shopName || 'N/A';

            const items = data.orderDetails || [];
            if (detailsList) {
                detailsList.innerHTML = items.map(item => `
                    <tr>
                        <td><strong>${item.productId}</strong></td>
                        <td>${item.productName}</td>
                        <td>${formatVND(item.price)}</td>
                        <td>${item.quantity}</td>
                        <td><strong>${formatVND(item.price * item.quantity)}</strong></td>
                    </tr>
                `).join('');
            }

            if (document.getElementById('subtotal')) document.getElementById('subtotal').textContent = formatVND(data.totalAmount);
            if (document.getElementById('shipping_fee')) document.getElementById('shipping_fee').textContent = 'Miễn phí / Đồng giá';
            if (document.getElementById('total_amount')) document.getElementById('total_amount').textContent = formatVND(data.totalAmount);
        }
    } catch (err) {
        console.error('Lỗi lấy chi tiết đơn hàng Admin:', err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const closeBtn = document.getElementById('closeOrderDetailsModal');
    const modal = document.getElementById('orderDetailsModal');
    
    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
});
