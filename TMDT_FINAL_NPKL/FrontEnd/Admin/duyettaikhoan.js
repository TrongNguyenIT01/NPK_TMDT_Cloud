// duyettaikhoan.js - Xử lý dữ liệu động cho trang Duyệt Tài Khoản Đăng Ký
window.duyetTaiKhoanLoaded = true;

document.addEventListener("DOMContentLoaded", () => {
    // 1. Tải số liệu thống kê cho 4 thẻ Metric Cards
    loadApprovalMetrics();

    // 2. Tải danh sách người dùng chờ duyệt
    loadPendingUsers();

    // 3. Đăng ký sự kiện thay đổi bộ lọc & tìm kiếm
    const roleFilter = document.getElementById("userRoleFilter");
    const statusFilter = document.getElementById("userStatusFilter");
    const searchInput = document.getElementById("userSearchInput");

    if (roleFilter) {
        roleFilter.addEventListener("change", () => loadPendingUsers());
    }
    if (statusFilter) {
        statusFilter.addEventListener("change", () => loadPendingUsers());
    }
    if (searchInput) {
        searchInput.addEventListener("input", debounce(() => loadPendingUsers(), 300));
    }

    // 4. Đăng ký sự kiện click cho các nút hành động trong bảng
    const tbody = document.getElementById("userTableBody");
    if (tbody) {
        tbody.addEventListener("click", async (e) => {
            const btn = e.target.closest(".btn-user-action");
            if (!btn) return;

            const action = btn.getAttribute("data-action");
            const userId = btn.getAttribute("data-id");
            const row = btn.closest("tr");
            const userName = row ? row.querySelector(".user-name-cell")?.textContent || userId : userId;
            const token = sessionStorage.getItem("jwtToken") || localStorage.getItem("jwtToken");

            if (!token) {
                alert("Bạn chưa đăng nhập hoặc không có quyền truy cập!");
                window.location.href = "../DangNhap/index.html";
                return;
            }

            if (action === "ACTIVE") {
                if (confirm(`Bạn có chắc muốn duyệt kích hoạt tài khoản: "${userName}" [${userId}]?`)) {
                    try {
                        const response = await fetch(`${window.location.origin}/api/Admin/approve/${userId}`, {
                            method: "POST",
                            headers: {
                                "Authorization": `Bearer ${token}`,
                                "Content-Type": "application/json"
                            }
                        });
                        const data = await response.json();
                        if (response.ok && data.success) {
                            alert(data.message || "Đã duyệt kích hoạt tài khoản thành công!");
                            loadPendingUsers();
                            loadApprovalMetrics();
                        } else {
                            alert(data.message || "Duyệt tài khoản thất bại!");
                        }
                    } catch (error) {
                        console.error("Lỗi duyệt tài khoản:", error);
                        alert("Không thể kết nối đến máy chủ!");
                    }
                }
            } else if (action === "REJECTED") {
                const reason = prompt(`Nhập lý do từ chối tài khoản "${userName}" [${userId}]:`);
                if (reason === null) return; // Nhấn Hủy
                if (!reason.trim()) {
                    alert("Lý do từ chối không được để trống!");
                    return;
                }

                try {
                    const response = await fetch(`${window.location.origin}/api/Admin/reject/${userId}`, {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${token}`,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ Reason: reason.trim() })
                    });
                    const data = await response.json();
                    if (response.ok && data.success) {
                        alert(data.message || "Đã từ chối tài khoản thành công!");
                        loadPendingUsers();
                        loadApprovalMetrics();
                    } else {
                        alert(data.message || "Từ chối tài khoản thất bại!");
                    }
                } catch (error) {
                    console.error("Lỗi từ chối tài khoản:", error);
                    alert("Không thể kết nối đến máy chủ!");
                }
            } else if (action === "BLOCKED") {
                const reason = prompt(`Nhập lý do khóa tài khoản "${userName}" [${userId}]:`);
                if (reason === null) return;
                if (!reason.trim()) {
                    alert("Lý do khóa không được để trống!");
                    return;
                }

                try {
                    const response = await fetch(`${window.location.origin}/api/Admin/block/${userId}`, {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${token}`,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ Reason: reason.trim() })
                    });
                    const data = await response.json();
                    if (response.ok && data.success) {
                        alert(data.message || "Đã khóa tài khoản thành công!");
                        loadPendingUsers();
                        loadApprovalMetrics();
                    } else {
                        alert(data.message || "Khóa tài khoản thất bại!");
                    }
                } catch (error) {
                    console.error("Lỗi khóa tài khoản:", error);
                    alert("Không thể kết nối đến máy chủ!");
                }
            } else if (action === "UNBLOCK") {
                if (confirm(`Bạn có chắc muốn mở khóa cho tài khoản: "${userName}" [${userId}]?`)) {
                    try {
                        const response = await fetch(`${window.location.origin}/api/Admin/unblock/${userId}`, {
                            method: "POST",
                            headers: {
                                "Authorization": `Bearer ${token}`,
                                "Content-Type": "application/json"
                            }
                        });
                        const data = await response.json();
                        if (response.ok && data.success) {
                            alert(data.message || "Đã mở khóa tài khoản thành công!");
                            loadPendingUsers();
                            loadApprovalMetrics();
                        } else {
                            alert(data.message || "Mở khóa tài khoản thất bại!");
                        }
                    } catch (error) {
                        console.error("Lỗi mở khóa tài khoản:", error);
                        alert("Không thể kết nối đến máy chủ!");
                    }
                }
            }
        });
    }
});

// Hàm gọi API lấy số liệu 4 Metric Cards
async function loadApprovalMetrics() {
    const token = sessionStorage.getItem("jwtToken") || localStorage.getItem("jwtToken");
    if (!token) return;

    try {
        const response = await fetch(`${window.location.origin}/api/Admin/user-approval-metrics`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        const result = await response.json();
        if (response.ok && result.success && result.data) {
            const data = result.data;

            // 1. Thẻ Chờ duyệt tổng
            const metricPendingTotal = document.getElementById("metricPendingTotal");
            if (metricPendingTotal) metricPendingTotal.textContent = data.pendingTotal ?? 0;

            // 2. Thẻ Người bán chờ duyệt
            const metricPendingSellers = document.getElementById("metricPendingSellers");
            const badgePendingSellers = document.getElementById("badgePendingSellers");
            if (metricPendingSellers) metricPendingSellers.textContent = data.pendingSellers ?? 0;
            if (badgePendingSellers) badgePendingSellers.textContent = `${data.pendingSellers ?? 0} Gian hàng`;

            // 3. Thẻ Khách hàng chờ duyệt
            const metricPendingCustomers = document.getElementById("metricPendingCustomers");
            if (metricPendingCustomers) metricPendingCustomers.textContent = data.pendingCustomers ?? 0;

            // 4. Thẻ Đã duyệt tháng này & hôm nay
            const metricApprovedMonth = document.getElementById("metricApprovedMonth");
            const badgeApprovedToday = document.getElementById("badgeApprovedToday");
            if (metricApprovedMonth) metricApprovedMonth.textContent = data.approvedThisMonth ?? 0;
            if (badgeApprovedToday) badgeApprovedToday.textContent = `↑ +${data.approvedToday ?? 0} hôm nay`;
        }
    } catch (error) {
        console.error("Lỗi khi tải số liệu thống kê tài khoản:", error);
    }
}

// Hàm gọi API lấy danh sách người dùng theo bộ lọc
async function loadPendingUsers() {
    const token = sessionStorage.getItem("jwtToken") || localStorage.getItem("jwtToken");
    if (!token) return;

    const roleFilter = document.getElementById("userRoleFilter")?.value || "ALL";
    const statusFilter = document.getElementById("userStatusFilter")?.value || "PENDING";
    const searchVal = document.getElementById("userSearchInput")?.value || "";

    const tbody = document.getElementById("userTableBody");
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 20px; color: #64748B;">Đang tải danh sách tài khoản...</td></tr>`;
    }

    try {
        const url = `${window.location.origin}/api/Admin/users?status=${encodeURIComponent(statusFilter)}&role=${encodeURIComponent(roleFilter)}&search=${encodeURIComponent(searchVal)}`;
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        const result = await response.json();
        if (response.ok && result.success && Array.isArray(result.data)) {
            renderPendingUserTable(result.data);
        } else {
            if (tbody) {
                tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 20px; color: #EF4444;">${result.message || "Lỗi khi tải danh sách người dùng"}</td></tr>`;
            }
        }
    } catch (error) {
        console.error("Lỗi kết nối API lấy danh sách người dùng:", error);
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 20px; color: #EF4444;">Mất kết nối đến máy chủ!</td></tr>`;
        }
    }
}

// Hàm render danh sách tài khoản ra bảng chuẩn 8 cột
function renderPendingUserTable(users) {
    const tbody = document.getElementById("userTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (!users || users.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 24px; color: #64748B;">Không có tài khoản nào phù hợp với điều kiện tìm kiếm</td></tr>`;
        return;
    }

    const currentUsername = localStorage.getItem("userName") || sessionStorage.getItem("userName");

    users.forEach(user => {
        // 1. Phân loại vai trò
        let roleName = "Khách Hàng";
        let roleClass = "shipping";
        if (user.role === "ADMIN") {
            roleName = "Quản Trị";
            roleClass = "banned";
        } else if (user.role === "SELLER") {
            roleName = "Người Bán";
            roleClass = "shipping";
        }

        // 2. Phân loại trạng thái
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

        // 3. Xử lý nút hành động
        let actionHtml = "";
        if (user.username === currentUsername || user.userId === "AD0001") {
            actionHtml = `<span style="color:#64748B; font-size:0.8rem;">Hệ thống</span>`;
        } else if (user.status === "PENDING" || user.status === "REJECTED") {
            actionHtml = `
                <div class="btn-action-group">
                    <button class="btn-tb approve btn-user-action" data-id="${user.userId}" data-action="ACTIVE">✓ Duyệt Kích Hoạt</button>
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

        // Thêm ghi chú lý do từ chối nếu có
        let rejectNoteHtml = "";
        if (user.status === "REJECTED" && user.rejectReason) {
            rejectNoteHtml = `<div style="font-size:0.75rem; color:#EF4444; margin-top:2px;">(Lý do: ${user.rejectReason})</div>`;
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
            <td class="status-cell">
                <span class="badge-status ${statusClass}">${statusName}</span>
                ${rejectNoteHtml}
            </td>
            <td>${actionHtml}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Hàm debounce hỗ trợ tìm kiếm mượt mà
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}
