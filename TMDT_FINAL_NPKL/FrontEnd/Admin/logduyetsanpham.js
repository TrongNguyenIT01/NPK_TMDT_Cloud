document.addEventListener('DOMContentLoaded', function () {
    fetchLogs();

    // Lắng nghe sự kiện tìm kiếm và lọc
    const searchInput = document.querySelector('.search-input-admin');
    const filterSelect = document.querySelector('.filter-select');

    if (searchInput) {
        searchInput.addEventListener('input', filterAndRenderLogs);
    }
    if (filterSelect) {
        filterSelect.addEventListener('change', filterAndRenderLogs);
    }
});

let allLogs = []; // Biến lưu trữ toàn bộ data từ BE

async function fetchLogs() {
    try {
        const token = sessionStorage.getItem("jwtToken") || localStorage.getItem("jwtToken");
        if (!token) {
            console.warn("Không tìm thấy token. Vui lòng đăng nhập.");
            // Có thể redirect về trang đăng nhập nếu cần
        }

        // Tùy theo cấu hình URL, chỉnh lại domain nếu cần
        const response = await fetch(`${window.location.origin}/api/AdminDuyetSP/logs`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Thêm token nếu API yêu cầu Authorize
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success && result.data) {
            allLogs = result.data;
            updateMetrics(allLogs);
            filterAndRenderLogs(); // Gọi hàm render ban đầu
        } else {
            console.error('Lỗi khi lấy dữ liệu log:', result.message);
        }
    } catch (error) {
        console.error('Lỗi call API fetchLogs:', error);
    }
}

function updateMetrics(logs) {
    const totalElement = document.querySelectorAll('.metric-value')[0];
    const approvedElement = document.querySelectorAll('.metric-value')[1];
    const rejectedElement = document.querySelectorAll('.metric-value')[2];

    if (totalElement) totalElement.textContent = logs.length;
    
    let approvedCount = 0;
    let rejectedCount = 0;

    logs.forEach(log => {
        if (log.action.toUpperCase() === 'APPROVED') approvedCount++;
        if (log.action.toUpperCase() === 'REJECTED') rejectedCount++;
    });

    if (approvedElement) approvedElement.textContent = approvedCount;
    if (rejectedElement) rejectedElement.textContent = rejectedCount;
}

function filterAndRenderLogs() {
    const searchInput = document.querySelector('.search-input-admin');
    const filterSelect = document.querySelector('.filter-select');

    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const filterValue = filterSelect ? filterSelect.value.toUpperCase() : 'ALL';

    // Lọc mảng allLogs
    const filteredLogs = allLogs.filter(log => {
        // Lọc theo Search (Mã log, Tên SP, Tên Admin, Tên Shop)
        const productNameStr = log.productName ? log.productName.toLowerCase() : '';
        const adminNameStr = log.adminName ? log.adminName.toLowerCase() : '';
        const shopNameStr = log.shopName ? log.shopName.toLowerCase() : '';
        
        const matchSearch = 
            log.logId.toLowerCase().includes(searchTerm) ||
            productNameStr.includes(searchTerm) ||
            log.productId.toLowerCase().includes(searchTerm) ||
            adminNameStr.includes(searchTerm) ||
            shopNameStr.includes(searchTerm);

        // Lọc theo Action (APPROVED, REJECTED, ALL)
        const matchFilter = filterValue === 'ALL' || log.action.toUpperCase() === filterValue;

        return matchSearch && matchFilter;
    });

    renderTable(filteredLogs);
}

function renderTable(logs) {
    const tbody = document.querySelector('.admin-table tbody');
    if (!tbody) return;

    tbody.innerHTML = ''; // Xóa data cũ

    if (logs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 20px;">Không tìm thấy kết quả nào</td></tr>`;
        return;
    }

    logs.forEach(log => {
        const tr = document.createElement('tr');
        
        // Format ngày tháng
        const dateObj = new Date(log.createdAt);
        const dateStr = dateObj.toLocaleDateString('vi-VN') + ' ' + dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        // Badge Status
        let statusBadge = '';
        if (log.action.toUpperCase() === 'APPROVED') {
            statusBadge = `<span class="badge-status approved">✅ Đã duyệt</span>`;
        } else if (log.action.toUpperCase() === 'REJECTED') {
            statusBadge = `<span class="badge-status" style="background-color: #fef2f2; color: #ef4444; padding: 0.35rem 0.75rem; border-radius: 9999px; font-size: 0.8rem; font-weight: 600;">❌ Từ chối</span>`;
        } else {
             statusBadge = `<span class="badge-status" style="background-color: #f3f4f6; color: #4b5563; padding: 0.35rem 0.75rem; border-radius: 9999px; font-size: 0.8rem; font-weight: 600;">${log.action}</span>`;
        }

        tr.innerHTML = `
            <td><strong style="font-weight: 700; color: var(--primary-navy);">${log.logId}</strong></td>
            <td>
                <div style="font-weight: 700; color: var(--text-dark);">${log.productName || 'Sản phẩm không xác định'}</div>
                <div style="font-size: 0.8rem; color: var(--text-muted);">Shop: <strong>${log.shopName || 'Không xác định'}</strong> | Mã SP: ${log.productId}</div>
            </td>
            <td>
                <div style="font-weight: 700; color: var(--text-dark);">👤 ${log.adminName}</div>
            </td>
            <td>${statusBadge}</td>
            <td><div style="max-width: 280px; font-size: 0.88rem; color: var(--text-dark); font-weight: 500;">${log.note || ''}</div></td>
            <td><span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">🕒 ${dateStr}</span></td>
        `;

        tbody.appendChild(tr);
    });
    
    // Cập nhật thông tin phân trang (giả)
    const paginationInfo = document.querySelector('.pagination-info');
    if (paginationInfo) {
         paginationInfo.textContent = `Hiển thị ${logs.length} trong tổng số ${allLogs.length} kết quả`;
    }
}
