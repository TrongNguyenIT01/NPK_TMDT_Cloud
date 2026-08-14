document.addEventListener('DOMContentLoaded', () => {
    const filterSelect = document.getElementById('orderStatusFilter');
    const orderTableBody = document.getElementById('orderTableBody');

    // Lọc trạng thái đơn hàng
    if (filterSelect && orderTableBody) {
        filterSelect.addEventListener('change', (e) => {
            const selectedStatus = e.target.value;
            const rows = orderTableBody.querySelectorAll('tr');

            rows.forEach(row => {
                const rowStatus = row.getAttribute('data-status');
                if (selectedStatus === 'ALL' || rowStatus === selectedStatus) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }

    // Chuyển trang xem chi tiết đơn hàng
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
});
