function showOrderDetailsModal(orderId) {
    const modal = document.getElementById('orderDetailsModal');
    if (!modal) return;
    
    // Đặt hiển thị mã đơn hàng tạm thời
    document.getElementById('order_id').textContent = orderId;
    
    // Reset/Xóa nội dung cũ trong khi chờ API load dữ liệu
    document.getElementById('order_date').textContent = '...';
    const statusSpan = document.getElementById('status');
    statusSpan.textContent = '...';
    statusSpan.className = 'badge-status'; // Xóa màu trạng thái
    
    document.getElementById('customer_id').textContent = '...';
    document.getElementById('customer_name').textContent = '...';
    document.getElementById('customer_phone').textContent = '...';
    document.getElementById('shipping_address').textContent = '...';
    
    document.getElementById('shop_id').textContent = '...';
    document.getElementById('shop_name').textContent = '...';
    
    document.getElementById('order_details_list').innerHTML = ''; // Dọn bảng sản phẩm
    
    document.getElementById('subtotal').textContent = '...';
    document.getElementById('shipping_fee').textContent = '...';
    document.getElementById('total_amount').textContent = '...';

    /* 
    ========================================================
    GỌI API Ở ĐÂY ĐỂ LẤY DỮ LIỆU CHI TIẾT ĐƠN HÀNG
    ========================================================
    Ví dụ:
    fetch(`https://your-api.com/api/orders/${orderId}`)
        .then(response => response.json())
        .then(data => {
            // Nạp dữ liệu vào giao diện:
            // document.getElementById('order_date').textContent = data.order_date;
            // ...
            
            // Xử lý render danh sách sản phẩm:
            // const tbody = document.getElementById('order_details_list');
            // tbody.innerHTML = data.items.map(...).join('');
        })
        .catch(error => console.error("Lỗi lấy dữ liệu:", error));
    */

    modal.style.display = 'flex';
}

document.addEventListener('DOMContentLoaded', () => {
    const closeBtn = document.getElementById('closeOrderDetailsModal');
    const modal = document.getElementById('orderDetailsModal');
    
    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        // Đóng khi click bên ngoài modal-card
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
});
