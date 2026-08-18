// Global Logout Handler for Admin pages
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

    alert("Bạn đã đăng xuất khỏi trang Quản Trị thành công!");
    window.location.href = "../TrangChinh/index.html"; 
};

document.addEventListener('DOMContentLoaded', () => {
    // 0. Toggle Sidebar Collapse/Expand
    const toggleSidebarBtn = document.querySelector('#toggleSidebar');
    if (toggleSidebarBtn) {
        toggleSidebarBtn.addEventListener('click', () => {
            document.body.classList.toggle('sidebar-collapsed');
        });
    }

    // 0.1 Dropdown Submenu Toggle
    const dropdownToggles = document.querySelectorAll('.menu-item.has-dropdown > .menu-link');
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            const parentItem = toggle.closest('.menu-item');
            if (parentItem) {
                parentItem.classList.toggle('open');
            }
        });
    });

    // Auto-expand dropdown if a child link is active
    document.querySelectorAll('.submenu-link.active').forEach(activeSubLink => {
        const parentItem = activeSubLink.closest('.menu-item.has-dropdown');
        if (parentItem) {
            parentItem.classList.add('open');
        }
    });

    // 1. Sidebar Navigation Tab Switching
    const menuLinks = document.querySelectorAll('.menu-link:not(.dropdown-toggle)');
    const tabPanels = document.querySelectorAll('.tab-panel');
    const pageHeaderTitle = document.querySelector('#pageHeaderTitle');

    menuLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetTab = link.getAttribute('data-tab');
            if (!targetTab) return; // Để cho phép điều hướng bình thường đối với link Đăng Xuất hoặc HTML ngoài

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

    // 2. User Approval & Action Buttons (Dynamic API)
    const userTableBody = document.querySelector('#userTableBody');
    
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    async function loadPendingUsers() {
        const token = sessionStorage.getItem("jwtToken") || localStorage.getItem("jwtToken");
        if (!token) {
            alert("Bạn chưa đăng nhập hoặc không có quyền truy cập!");
            window.location.href = "../DangNhap/index.html";
            return;
        }

        const roleFilter = document.querySelector('#userRoleFilter')?.value || 'ALL';
        const statusFilter = document.querySelector('#userStatusFilter')?.value || 'ALL';
        const searchVal = document.querySelector('#userSearchInput')?.value || '';

        try {
            const response = await fetch(`https://localhost:3001/api/Admin/users?status=${statusFilter}&role=${roleFilter}&search=${encodeURIComponent(searchVal)}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            const result = await response.json();
            if (response.ok && result.success) {
                renderPendingUserTable(result.data);
            } else {
                console.error("Lỗi tải người dùng:", result.message);
            }
        } catch (error) {
            console.error("Lỗi kết nối API:", error);
        }
    }

    function renderPendingUserTable(users) {
        const tbody = document.getElementById("userTableBody");
        if (!tbody) return;
        tbody.innerHTML = "";

        if (users.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #64748B;">Không có tài khoản nào phù hợp</td></tr>`;
            return;
        }

        users.forEach(user => {
            let roleName = user.role === "ADMIN" ? "Quản Trị" : (user.role === "SELLER" ? "Người Bán" : "Khách Hàng");
            let roleClass = user.role === "ADMIN" ? "banned" : "shipping";

            let statusName = "Chờ Duyệt";
            let statusClass = "pending";
            if (user.status === "ACTIVE") {
                statusName = "Hoạt Động";
                statusClass = "active";
            } else if (user.status === "BLOCKED") {
                statusName = "Đã Khóa";
                statusClass = "blocked";
            } else if (user.status === "REJECTED") {
                statusName = "Bị Từ Chối";
                statusClass = "rejected";
            }

            let actionHtml = "";
            const currentUsername = localStorage.getItem("userName");

            if (user.username === currentUsername || user.userId === "AD0001") {
                actionHtml = `<span style="color:#64748B; font-size:0.8rem;">Hệ thống</span>`;
            } else if (user.status === "PENDING" || user.status === "REJECTED") {
                actionHtml = `
                    <div class="btn-action-group">
                        <button class="btn-tb approve btn-user-action" data-id="${user.userId}" data-action="ACTIVE">✓ Duyệt</button>
                        <button class="btn-tb reject btn-user-action" data-id="${user.userId}" data-action="REJECTED">✕ Từ Chối</button>
                    </div>
                `;
            } else if (user.status === "ACTIVE") {
                actionHtml = `
                    <div class="btn-action-group">
                        <button class="btn-tb block btn-user-action" data-id="${user.userId}" data-action="BLOCKED">Khóa</button>
                    </div>
                `;
            } else if (user.status === "BLOCKED") {
                actionHtml = `
                    <div class="btn-action-group">
                        <button class="btn-tb primary btn-user-action" data-id="${user.userId}" data-action="UNBLOCK" style="background-color: #10B981;">Mở Khóa</button>
                    </div>
                `;
            }

            const tr = document.createElement("tr");
            tr.setAttribute("data-role", user.role);
            tr.setAttribute("data-status", user.status);
            tr.innerHTML = `
                <td><strong>${user.userId}</strong></td>
                <td class="user-name-cell">${user.fullName}</td>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>${user.phone || "---"}</td>
                <td><span class="badge-status ${roleClass}">${roleName}</span></td>
                <td class="status-cell"><span class="badge-status ${statusClass}">${statusName}</span></td>
                <td>${actionHtml}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    if (userTableBody && !window.duyetTaiKhoanLoaded) {
        loadPendingUsers();

        userTableBody.addEventListener('click', async (e) => {
            const btn = e.target.closest('.btn-user-action');
            if (!btn) return;

            const action = btn.getAttribute('data-action');
            const userId = btn.getAttribute('data-id');
            const row = btn.closest('tr');
            const userName = row.querySelector('.user-name-cell').textContent;
            const token = sessionStorage.getItem("jwtToken") || localStorage.getItem("jwtToken");

            if (!token) {
                alert("Bạn chưa đăng nhập hoặc không có quyền truy cập!");
                return;
            }

            if (action === 'ACTIVE') {
                if (confirm(`Bạn có chắc muốn duyệt kích hoạt tài khoản: ${userName}?`)) {
                    try {
                        const response = await fetch(`https://localhost:3001/api/Admin/approve/${userId}`, {
                            method: "POST",
                            headers: {
                                "Authorization": `Bearer ${token}`,
                                "Content-Type": "application/json"
                            }
                        });
                        const data = await response.json();
                        if (response.ok && data.success) {
                            alert(data.message);
                            loadPendingUsers();
                        } else {
                            alert(data.message || "Duyệt thất bại!");
                        }
                    } catch (error) {
                        console.error("Lỗi API:", error);
                        alert("Không thể kết nối đến máy chủ!");
                    }
                }
            } else if (action === 'REJECTED') {
                const reason = prompt(`Nhập lý do từ chối tài khoản ${userName}:`);
                if (reason === null) return;
                if (!reason.trim()) {
                    alert("Lý do từ chối không được để trống!");
                    return;
                }

                try {
                    const response = await fetch(`https://localhost:3001/api/Admin/reject/${userId}`, {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${token}`,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ Reason: reason })
                    });
                    const data = await response.json();
                    if (response.ok && data.success) {
                        alert(data.message);
                        loadPendingUsers();
                    } else {
                        alert(data.message || "Từ chối thất bại!");
                    }
                } catch (error) {
                    console.error("Lỗi API:", error);
                    alert("Không thể kết nối đến máy chủ!");
                }
            } else if (action === 'BLOCKED') {
                const reason = prompt(`Nhập lý do khóa tài khoản ${userName}:`);
                if (reason === null) return;
                if (!reason.trim()) {
                    alert("Lý do khóa không được để trống!");
                    return;
                }

                try {
                    const response = await fetch(`https://localhost:3001/api/Admin/block/${userId}`, {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${token}`,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ Reason: reason })
                    });
                    const data = await response.json();
                    if (response.ok && data.success) {
                        alert(data.message);
                        loadPendingUsers();
                    } else {
                        alert(data.message || "Khóa thất bại!");
                    }
                } catch (error) {
                    console.error("Lỗi API:", error);
                    alert("Không thể kết nối đến máy chủ!");
                }
            } else if (action === 'UNBLOCK') {
                if (confirm(`Bạn có chắc muốn mở khóa tài khoản: ${userName}?`)) {
                    try {
                        const response = await fetch(`https://localhost:3001/api/Admin/unblock/${userId}`, {
                            method: "POST",
                            headers: {
                                "Authorization": `Bearer ${token}`,
                                "Content-Type": "application/json"
                            }
                        });
                        const data = await response.json();
                        if (response.ok && data.success) {
                            alert(data.message);
                            loadPendingUsers();
                        } else {
                            alert(data.message || "Mở khóa thất bại!");
                        }
                    } catch (error) {
                        console.error("Lỗi API:", error);
                        alert("Không thể kết nối đến máy chủ!");
                    }
                }
            }
        });
    }

    // 3. Shop Status Action Buttons & Dynamic API Integration
    const shopTableBody = document.querySelector('#shopTableBody');
    const shopSearchInput = document.querySelector('#shopSearchInput');
    const shopStatusFilter = document.querySelector('#shopStatusFilter');

    async function loadAdminShops() {
        const token = sessionStorage.getItem("jwtToken") || localStorage.getItem("jwtToken");
        if (!token) return;

        const searchVal = shopSearchInput?.value || '';
        const statusFilter = shopStatusFilter?.value || 'ALL';

        try {
            const response = await fetch(`https://localhost:3001/api/Admin/shops?status=ALL&search=${encodeURIComponent(searchVal)}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            const result = await response.json();
            if (!result.success || !result.data) {
                console.error("Lỗi lấy danh sách shop:", result.message);
                return;
            }

            const allShops = result.data;

            // Tính toán số liệu cho Metric Cards
            const activeCount = allShops.filter(s => s.status === 'ACTIVE').length;
            const pendingCount = allShops.filter(s => s.status === 'PENDING').length;
            const inactiveCount = allShops.filter(s => s.status === 'INACTIVE').length;

            const activeCard = document.querySelector('#activeShopsCount');
            const pendingCard = document.querySelector('#pendingShopsCount');
            const inactiveCard = document.querySelector('#inactiveShopsCount');
            const pendingTrend = document.querySelector('#pendingShopsTrend');

            if (activeCard) activeCard.textContent = activeCount;
            if (pendingCard) pendingCard.textContent = pendingCount;
            if (inactiveCard) inactiveCard.textContent = inactiveCount;
            if (pendingTrend) pendingTrend.textContent = `${pendingCount} Chờ duyệt`;

            // Lọc theo trạng thái đã chọn để hiển thị ra bảng
            let filteredShops = allShops;
            if (statusFilter !== 'ALL') {
                filteredShops = allShops.filter(s => s.status === statusFilter);
            }

            // Render vào bảng
            if (!shopTableBody) return;
            shopTableBody.innerHTML = '';
            
            if (filteredShops.length === 0) {
                shopTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 20px; color: #64748B;">Không tìm thấy gian hàng nào.</td></tr>`;
                return;
            }

            filteredShops.forEach(shop => {
                const tr = document.createElement('tr');
                const date = new Date(shop.createdAt);
                const dateStr = date.toLocaleDateString('vi-VN');

                let statusBadge = '';
                if (shop.status === 'ACTIVE') {
                    statusBadge = '<span class="badge-status active">Hoạt Động</span>';
                } else if (shop.status === 'PENDING') {
                    statusBadge = '<span class="badge-status pending">Chờ Duyệt Mở</span>';
                } else if (shop.status === 'INACTIVE') {
                    statusBadge = '<span class="badge-status warning" style="background:#FEF3C7; color:#D97706; padding: 4px 8px; border-radius: 6px; font-size: 0.78rem; font-weight:700;">Tạm Nghỉ</span>';
                } else if (shop.status === 'BANNED') {
                    statusBadge = '<span class="badge-status banned">Bị Cấm</span>';
                } else if (shop.status === 'REJECTED') {
                    statusBadge = '<span class="badge-status rejected" style="background:#FEE2E2; color:#DC2626; padding: 4px 8px; border-radius: 6px; font-size: 0.78rem; font-weight:700;">Bị Từ Chối</span>';
                } else {
                    statusBadge = `<span class="badge-status">${shop.status}</span>`;
                }

                let actionButtons = '';
                if (shop.status === 'PENDING') {
                    actionButtons = `
                        <button class="btn-tb approve btn-shop-action" data-shopid="${shop.shopId}" data-action="APPROVE">Duyệt</button>
                        <button class="btn-tb reject btn-shop-action" data-shopid="${shop.shopId}" data-action="REJECT">Từ Chối</button>
                    `;
                } else if (shop.status === 'ACTIVE') {
                    actionButtons = `
                        <button class="btn-tb block btn-shop-action" data-shopid="${shop.shopId}" data-action="SUSPEND">Tạm nghỉ</button>
                        <button class="btn-tb reject btn-shop-action" data-shopid="${shop.shopId}" data-action="BAN">Cấm Shop</button>
                    `;
                } else if (shop.status === 'INACTIVE') {
                    actionButtons = `
                        <button class="btn-tb approve btn-shop-action" data-shopid="${shop.shopId}" data-action="APPROVE">Mở Lại</button>
                        <button class="btn-tb reject btn-shop-action" data-shopid="${shop.shopId}" data-action="BAN">Cấm Shop</button>
                    `;
                } else if (shop.status === 'BANNED') {
                    actionButtons = `
                        <button class="btn-tb approve btn-shop-action" data-shopid="${shop.shopId}" data-action="UNBAN">Mở Khóa</button>
                    `;
                } else if (shop.status === 'REJECTED') {
                    actionButtons = `<span style="font-size:0.8rem; color:#64748B;">Chờ Seller sửa hồ sơ</span>`;
                }

                tr.innerHTML = `
                    <td><strong>${shop.shopId}</strong></td>
                    <td class="shop-name-cell">${shop.shopName}</td>
                    <td>${shop.sellerId}</td>
                    <td>${shop.description || 'Chưa có mô tả'}</td>
                    <td>${dateStr}</td>
                    <td class="shop-status-cell">${statusBadge}</td>
                    <td>
                        <div class="btn-action-group">
                            ${actionButtons}
                        </div>
                    </td>
                `;
                shopTableBody.appendChild(tr);
            });
        } catch (error) {
            console.error("Lỗi khi tải danh sách cửa hàng:", error);
        }
    }

    if (shopTableBody) {
        loadAdminShops();

        if (shopSearchInput) {
            shopSearchInput.addEventListener('input', debounce(loadAdminShops, 400));
        }
        if (shopStatusFilter) {
            shopStatusFilter.addEventListener('change', loadAdminShops);
        }

        shopTableBody.addEventListener('click', async (e) => {
            const btn = e.target.closest('.btn-shop-action');
            if (!btn) return;

            const action = btn.getAttribute('data-action');
            const shopId = btn.getAttribute('data-shopid');
            const row = btn.closest('tr');
            const shopName = row.querySelector('.shop-name-cell').textContent;

            const token = sessionStorage.getItem("jwtToken") || localStorage.getItem("jwtToken");
            if (!token) return;

            let url = "";
            let confirmMsg = "";

            if (action === 'APPROVE') {
                url = `https://localhost:3001/api/Admin/shops/approve/${shopId}`;
                confirmMsg = `Bạn có chắc muốn DUYỆT mở gian hàng "${shopName}"?`;
            } else if (action === 'REJECT') {
                url = `https://localhost:3001/api/Admin/shops/reject/${shopId}`;
                confirmMsg = `Bạn có chắc muốn TỪ CHỐI hồ sơ mở gian hàng "${shopName}"?`;
            } else if (action === 'SUSPEND') {
                url = `https://localhost:3001/api/Admin/shops/suspend/${shopId}`;
                confirmMsg = `Bạn có chắc muốn chuyển gian hàng "${shopName}" sang TẠM NGHỈ?`;
            } else if (action === 'BAN') {
                url = `https://localhost:3001/api/Admin/shops/ban/${shopId}`;
                confirmMsg = `CẢNH BÁO: Bạn có chắc muốn CẤM hoạt động gian hàng "${shopName}"?`;
            } else if (action === 'UNBAN') {
                url = `https://localhost:3001/api/Admin/shops/unban/${shopId}`;
                confirmMsg = `Bạn có chắc muốn GỠ CẤM và kích hoạt lại gian hàng "${shopName}"?`;
            }

            if (confirmMsg && !confirm(confirmMsg)) return;

            try {
                const response = await fetch(url, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });

                const result = await response.json();
                if (response.ok && result.success) {
                    alert(result.message || "Thao tác thành công!");
                    loadAdminShops();
                } else {
                    alert("Lỗi: " + (result.message || "Không thể thực hiện thao tác!"));
                }
            } catch (error) {
                console.error("Lỗi khi xử lý thao tác với shop:", error);
                alert("Lỗi kết nối máy chủ!");
            }
        });
    }

    // 5. Add Category Modal & Form
    const addCatBtn = document.querySelector('#addCatBtn');
    const catModal = document.querySelector('#catModal');
    const closeCatModalBtn = document.querySelector('#closeCatModal');
    const catForm = document.querySelector('#catForm');
    const catTableBody = document.querySelector('#catTableBody');

    if (addCatBtn && catModal) {
        addCatBtn.addEventListener('click', () => {
            catModal.classList.add('active');
        });
    }

    if (closeCatModalBtn && catModal) {
        closeCatModalBtn.addEventListener('click', () => {
            catModal.classList.remove('active');
        });
    }

    if (catForm) {
        catForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const catName = document.querySelector('#catNameInput').value.trim();
            const catDesc = document.querySelector('#catDescInput').value.trim();

            if (!catName) return;

            const newId = 'CAT' + Math.floor(1000 + Math.random() * 9000);
            const now = new Date().toLocaleDateString('vi-VN');

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${newId}</strong></td>
                <td><strong>${catName}</strong></td>
                <td>${catDesc || 'Không có mô tả'}</td>
                <td>0 SP</td>
                <td>${now}</td>
                <td>
                    <button class="btn-tb primary">Sửa</button>
                    <button class="btn-tb reject" onclick="this.closest('tr').remove()">Xóa</button>
                </td>
            `;

            if (catTableBody) catTableBody.appendChild(tr);
            alert(`Đã thêm danh mục mới "${catName}" [${newId}]!`);

            if (catModal) catModal.classList.remove('active');
            catForm.reset();
        });
    }

    // 6. User Table Filter
    const userRoleFilter = document.querySelector('#userRoleFilter');
    const userStatusFilter = document.querySelector('#userStatusFilter');
    const userSearchInput = document.querySelector('#userSearchInput');

    function filterUserTable() {
        if (userTableBody) {
            loadPendingUsers();
        } else {
            const roleVal = userRoleFilter ? userRoleFilter.value : 'ALL';
            const statusVal = userStatusFilter ? userStatusFilter.value : 'ALL';
            const searchVal = userSearchInput ? userSearchInput.value.toLowerCase().trim() : '';

            const rows = document.querySelectorAll('table tbody tr');
            rows.forEach(row => {
                const role = row.getAttribute('data-role');
                const status = row.getAttribute('data-status');
                const text = row.textContent.toLowerCase();

                const roleMatch = (roleVal === 'ALL' || role === roleVal);
                const statusMatch = (statusVal === 'ALL' || status === statusVal);
                const searchMatch = (searchVal === '' || text.includes(searchVal));

                if (roleMatch && statusMatch && searchMatch) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        }
    }

    if (userRoleFilter) userRoleFilter.addEventListener('change', filterUserTable);
    if (userStatusFilter) userStatusFilter.addEventListener('change', filterUserTable);
    if (userSearchInput) userSearchInput.addEventListener('input', debounce(filterUserTable, 300));

    // 7. Grant Account Form Handler
    const grantAccountForm = document.querySelector('#grantAccountForm');
    const grantedUserTableBody = document.querySelector('#grantedUserTableBody');

    if (grantAccountForm && grantedUserTableBody) {
        grantAccountForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const fullName = document.querySelector('#grantFullName').value.trim();
            const username = document.querySelector('#grantUsername').value.trim();
            const email = document.querySelector('#grantEmail').value.trim();
            const phone = document.querySelector('#grantPhone').value.trim();
            const role = document.querySelector('#grantRole').value;
            const status = document.querySelector('#grantStatus').value;

            if (!fullName || !username || !email) {
                alert('Vui lòng điền đầy đủ các thông tin bắt buộc!');
                return;
            }

            let prefix = 'CUS';
            let roleBadge = '<span class="badge-status shipping">Khách Hàng</span>';
            if (role === 'ADMIN') {
                prefix = 'AD';
                roleBadge = '<span class="badge-status banned">Quản Trị Viên</span>';
            } else if (role === 'SELLER') {
                prefix = 'SL';
                roleBadge = '<span class="badge-status shipping">Người Bán</span>';
            }

            const userId = prefix + Math.floor(1000 + Math.random() * 9000);
            const statusBadge = status === 'ACTIVE' 
                ? '<span class="badge-status active">Hoạt Động</span>' 
                : '<span class="badge-status pending">Chờ Duyệt</span>';

            const tr = document.createElement('tr');
            tr.setAttribute('data-role', role);
            tr.setAttribute('data-status', status);
            tr.innerHTML = `
                <td><strong>${userId}</strong></td>
                <td class="user-name-cell">${fullName}</td>
                <td>${username}</td>
                <td>${email}</td>
                <td>${phone || '---'}</td>
                <td>${roleBadge}</td>
                <td class="status-cell">${statusBadge}</td>
                <td>
                    <div class="btn-action-group">
                        <button class="btn-tb block btn-user-action" data-action="BLOCKED">Khóa</button>
                    </div>
                </td>
            `;


        });
    }
});
