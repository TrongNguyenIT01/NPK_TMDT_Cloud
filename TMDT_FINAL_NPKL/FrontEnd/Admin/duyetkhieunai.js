document.addEventListener("DOMContentLoaded", () => {
    loadAppeals();

    const statusFilter = document.getElementById("appealStatusFilter");
    const searchInput = document.getElementById("appealSearchInput");

    if (statusFilter) statusFilter.addEventListener("change", loadAppeals);
    if (searchInput) searchInput.addEventListener("input", debounce(loadAppeals, 300));

    // Đăng ký sự kiện click cho các nút duyệt/từ chối khiếu nại trong bảng
    const tbody = document.getElementById("appealTableBody");
    if (tbody) {
        tbody.addEventListener("click", async (e) => {
            const btn = e.target.closest(".btn-appeal-action");
            if (!btn) return;

            const appealId = btn.getAttribute("data-id");
            const action = btn.getAttribute("data-action"); // APPROVED hoặc REJECTED
            const row = btn.closest("tr");
            const appealTitle = row.querySelector(".appeal-title-cell").textContent;
            const token = localStorage.getItem("jwtToken");

            if (!token) {
                alert("Bạn chưa đăng nhập hoặc không có quyền truy cập!");
                return;
            }

            const actionText = action === "APPROVED" ? "Phê duyệt" : "Từ chối";
            const adminNote = prompt(`Nhập ghi chú phản hồi cho đơn khiếu nại "${appealTitle}":`);
            if (adminNote === null) return; // Nhấn Hủy
            if (!adminNote.trim()) {
                alert("Ghi chú phản hồi không được để trống!");
                return;
            }

            try {
                const response = await fetch(`${window.location.origin}/api/Admin/appeals/resolve/${appealId}`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        Status: action,
                        AdminNote: adminNote
                    })
                });

                const data = await response.json();
                if (response.ok && data.success) {
                    alert(data.message || `${actionText} khiếu nại thành công!`);
                    loadAppeals();
                } else {
                    alert(data.message || "Xử lý khiếu nại thất bại!");
                }
            } catch (error) {
                console.error("Lỗi khi xử lý khiếu nại:", error);
                alert("Không thể kết nối đến máy chủ!");
            }
        });
    }
});

async function loadAppeals() {
    const token = localStorage.getItem("jwtToken");
    if (!token) {
        alert("Bạn chưa đăng nhập hoặc không có quyền truy cập!");
        window.location.href = "../DangNhap/index.html";
        return;
    }

    const statusVal = document.getElementById("appealStatusFilter")?.value || "PENDING";
    const searchVal = document.getElementById("appealSearchInput")?.value || "";

    try {
        const response = await fetch(`${window.location.origin}/api/Admin/appeals?status=${statusVal}&search=${encodeURIComponent(searchVal)}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        const result = await response.json();
        if (response.ok && result.success) {
            renderAppealsTable(result.data);
        } else {
            console.error("Lỗi tải danh sách khiếu nại:", result.message);
        }
    } catch (error) {
        console.error("Lỗi kết nối API:", error);
    }
}

function renderAppealsTable(appeals) {
    const tbody = document.getElementById("appealTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (appeals.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: #64748B;">Không có đơn khiếu nại nào phù hợp</td></tr>`;
        return;
    }

    appeals.forEach(appeal => {
        let statusName = "Chờ xử lý";
        let statusClass = "pending";

        if (appeal.status === "APPROVED") {
            statusName = "Chấp Nhận";
            statusClass = "active";
        } else if (appeal.status === "REJECTED") {
            statusName = "Từ Chối";
            statusClass = "rejected";
        }

        // Ngày tạo
        const createdDate = new Date(appeal.createdAt).toLocaleString("vi-VN");
        
        // Thao tác / Thông tin phản hồi
        let actionHtml = "";
        if (appeal.status === "PENDING") {
            actionHtml = `
                <div class="btn-action-group">
                    <button class="btn-tb approve btn-appeal-action" data-id="${appeal.appealId}" data-action="APPROVED">✓ Chấp nhận</button>
                    <button class="btn-tb reject btn-appeal-action" data-id="${appeal.appealId}" data-action="REJECTED">✕ Từ chối</button>
                </div>
            `;
        } else {
            const resolvedDate = appeal.resolvedAt ? new Date(appeal.resolvedAt).toLocaleString("vi-VN") : "---";
            actionHtml = `
                <div style="font-size:0.8rem; line-height: 1.4; color: #64748B; text-align: left;">
                    <div><strong>Admin:</strong> ${appeal.resolvedBy || "Hệ thống"}</div>
                    <div><strong>Ngày:</strong> ${resolvedDate}</div>
                    <div style="font-style: italic;"><strong>Ghi chú:</strong> "${appeal.adminNote || 'Không có'}"</div>
                </div>
            `;
        }

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${appeal.appealId}</strong></td>
            <td><strong style="color: #E05A2B;">${appeal.blockId}</strong></td>
            <td>
                <div style="text-align: left; font-size: 0.88rem;">
                    <strong>${appeal.fullName}</strong>
                    <div style="color: #64748B; font-size: 0.78rem;">@${appeal.username}</div>
                    <div style="color: #64748B; font-size: 0.78rem;">${appeal.email}</div>
                </div>
            </td>
            <td style="max-width: 150px; white-space: normal; text-align: left; font-size: 0.8rem; color:#EF4444;">
                ${appeal.blockReason}
            </td>
            <td class="appeal-title-cell" style="font-weight: 600; text-align: left;">${appeal.title}</td>
            <td style="max-width: 250px; white-space: normal; text-align: left; font-size: 0.84rem;">
                ${appeal.content}
            </td>
            <td style="font-size: 0.8rem;">${createdDate}</td>
            <td><span class="badge-status ${statusClass}">${statusName}</span></td>
            <td>${actionHtml}</td>
        `;
        tbody.appendChild(tr);
    });
}

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}
