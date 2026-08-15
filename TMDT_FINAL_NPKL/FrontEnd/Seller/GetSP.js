document.addEventListener("DOMContentLoaded", function () {
    loadProducts();

    const visibilityFilter = document.getElementById("prodVisibility");
    if (visibilityFilter) {
        visibilityFilter.addEventListener("change", function () {
            loadProducts();
        });
    }
});


async function loadProducts() {
    const tableBody = document.getElementById("productTableBody");
    const token = localStorage.getItem("jwtToken"); // Lấy token

    if (!token) {
        alert("Bạn chưa đăng nhập!");
        window.location.href = "../DangNhap/index.html";
        return;
    }

    // Lấy trạng thái đang chọn trên bộ lọc (all / visible / hidden), mặc định "all"
    const visibilityFilter = document.getElementById("prodVisibility");
    const filterStatus = visibilityFilter ? visibilityFilter.value : "all";

    try {
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Đang tải dữ liệu...</td></tr>`;


        const response = await fetch(`https://localhost:3001/api/LaySPSeller/seller-list?page=1&pageSize=50&status=${filterStatus}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const result = await response.json();
        const isSuccess = result.Success || result.success;

        if (response.ok && isSuccess) {
            const items = result.data ? result.data.items : result.Data.Items;
            
            tableBody.innerHTML = ""; // Xóa chữ "Đang tải dữ liệu"

            if (items.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Bạn chưa có sản phẩm nào đang bán.</td></tr>`;
                return;
            }

            // Lặp qua từng sản phẩm và tạo HTML
            items.forEach(item => {
                const formattedPrice = new Intl.NumberFormat('vi-VN').format(item.price || item.Price) + 'đ';
                const imagePath = item.image || item.Image;
                const fullImageUrl = imagePath ? `https://localhost:3001${imagePath}` : '../TrangChinh/images/default.jpg';

                let approvalStatusHtml = '';
                const approvalStatus = (item.approvalStatus || item.ApprovalStatus || "").toUpperCase();
                const pId = item.productId || item.ProductId;
                
                if (approvalStatus === "APPROVED") {
                    approvalStatusHtml = `<span class="badge-status active">Đã Duyệt</span>`;
                } else if (approvalStatus === "PENDING") {
                    approvalStatusHtml = `
                        <div style="display:flex; align-items:center; justify-content:center;">
                            <span class="badge-status pending">Chờ Duyệt</span>
                            <button class="btn-view-reason" onclick="viewApprovalLog('${pId}')" title="Xem chi tiết">🔍</button>
                        </div>`;
                } else {
                    approvalStatusHtml = `
                        <div style="display:flex; align-items:center; justify-content:center;">
                            <span class="badge-status reject">Từ Chối</span>
                            <button class="btn-view-reason" onclick="viewApprovalLog('${pId}')" title="Xem lý do từ chối">📋 Lý do</button>
                        </div>`;
                }

                // Trạng thái ẩn/hiện thực tế của sản phẩm (is_deleted dùng làm cờ ẩn)
                const isHidden = item.isDeleted !== undefined ? item.isDeleted : item.IsDeleted;

                const displayStatusHtml = isHidden
                    ? `<span class="badge-status reject">Đã Ẩn</span>`
                    : `<span class="badge-status active">Đang Bán</span>`;

                const productId = item.productId || item.ProductId;

                const actionButtonHtml = isHidden
                    ? `<button class="btn-tb primary btn-toggle-vis" onclick="showProduct('${productId}')">Hiện SP</button>`
                    : `<button class="btn-tb block btn-toggle-vis" onclick="hideProduct('${productId}')">Ẩn SP</button>`;

                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td><strong>${productId}</strong></td>
                    <td>
                        <div style="display:flex; align-items:center; gap:10px;">
                            <img src="${fullImageUrl}" class="product-img-thumb" alt="Ảnh sản phẩm" onerror="this.onerror=null;this.src='../TrangChinh/images/default.jpg';">
                            <div>
                                <strong>${item.productName || item.ProductName}</strong>
                                <p style="font-size:0.78rem; color:#64748B;">Mã DM: ${item.categoryId || item.CategoryId}</p>
                            </div>
                        </div>
                    </td>
                    <td>Danh mục ID: ${item.categoryId || item.CategoryId}</td>
                    <td><strong>${formattedPrice}</strong></td>
                    <td>${item.stockQuantity || item.StockQuantity} SP</td>
                    <td>${approvalStatusHtml}</td>
                    <td class="display-status-cell">${displayStatusHtml}</td>
                    <td>
                        <div class="btn-action-group">
                            ${actionButtonHtml}
                            <button class="btn-tb reject" onclick="alert('Chức năng xóa cứng đang bảo trì!');">Xóa</button>
                        </div>
                    </td>
                `;
                tableBody.appendChild(tr);
            });
        } else {
            tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:red;">Lỗi: ${result.Message || result.message}</td></tr>`;
        }
    } catch (error) {
        console.error("Lỗi tải sản phẩm:", error);
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:red;">Mất kết nối tới máy chủ!</td></tr>`;
    }
}

// Hàm 2: Gọi API Ẩn sản phẩm
async function hideProduct(productId) {
    if (!confirm(`Bạn có chắc chắn muốn Ẩn sản phẩm [${productId}] này khỏi hệ thống không?`)) {
        return; 
    }

    const token = localStorage.getItem("jwtToken");

    try {
        // ĐÃ SỬA URL: Trỏ đúng vào LaySPSellerController
        const response = await fetch(`https://localhost:3001/api/LaySPSeller/hide-product/${productId}`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        const result = await response.json();
        const isSuccess = result.Success || result.success;

        if (response.ok && isSuccess) {
            alert("✅ " + (result.Message || result.message));
            loadProducts(); // Tải lại danh sách để cập nhật giao diện
        } else {
            alert("❌ Lỗi: " + (result.Message || result.message));
        }
    } catch (error) {
        console.error("Lỗi khi ẩn sản phẩm:", error);
        alert("Lỗi kết nối đến máy chủ!");
    }
}

// Hàm 3: Gọi API Hiện lại sản phẩm đã ẩn
async function showProduct(productId) {
    if (!confirm(`Bạn có muốn Hiện lại sản phẩm [${productId}] này không?`)) {
        return;
    }

    const token = localStorage.getItem("jwtToken");

    try {
        const response = await fetch(`https://localhost:3001/api/LaySPSeller/show-product/${productId}`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        const result = await response.json();
        const isSuccess = result.Success || result.success;

        if (response.ok && isSuccess) {
            alert("✅ " + (result.Message || result.message));
            loadProducts(); // Tải lại danh sách để cập nhật giao diện
        } else {
            alert("❌ Lỗi: " + (result.Message || result.message));
        }
    } catch (error) {
        console.error("Lỗi khi hiện lại sản phẩm:", error);
        alert("Lỗi kết nối đến máy chủ!");
    }
}

// Hàm 4: Gọi API lấy log duyệt & hiển thị Modal
async function viewApprovalLog(productId) {
    const token = localStorage.getItem("jwtToken");
    if (!token) return;

    try {
        const response = await fetch(`https://localhost:3001/api/LaySPSeller/approval-log/${productId}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        const result = await response.json();
        
        if (response.ok && (result.Success || result.success)) {
            const data = result.data || result.Data;
            const logs = data.logs || data.Logs || [];
            
            document.getElementById("logProductName").textContent = data.productName || data.ProductName || "N/A";
            document.getElementById("logProductId").textContent = data.productId || data.ProductId || productId;
            
            if (logs.length > 0) {
                // Lấy log mới nhất
                const latestLog = logs[0];
                const action = (latestLog.action || latestLog.Action || "").toUpperCase();
                const note = latestLog.note || latestLog.Note || "Không có ghi chú.";
                
                // Format Date
                const createdStr = latestLog.createdAt || latestLog.CreatedAt;
                let dateStr = "N/A";
                if (createdStr) {
                    const date = new Date(createdStr);
                    dateStr = date.toLocaleString('vi-VN', { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit' });
                }
                
                document.getElementById("logDate").textContent = dateStr;
                document.getElementById("logAdminName").textContent = latestLog.adminName || latestLog.AdminName || "Hệ thống";
                document.getElementById("logAdminEmail").textContent = latestLog.adminEmail || latestLog.AdminEmail || "";
                
                const statusBadge = document.getElementById("logStatusBadge");
                const reasonBox = document.getElementById("logReasonBox");
                const logNoteP = document.getElementById("logNote");
                
                if (action === "REJECTED") {
                    statusBadge.innerHTML = `<span class="badge-status reject">Từ Chối</span>`;
                    logNoteP.textContent = note;
                    reasonBox.style.display = "block";
                    reasonBox.style.backgroundColor = "var(--status-blocked-bg)";
                    reasonBox.style.borderLeftColor = "var(--status-blocked-text)";
                    reasonBox.querySelector("strong").style.color = "#B91C1C";
                    reasonBox.querySelector("strong").textContent = "Lý do từ chối:";
                    logNoteP.style.color = "#7F1D1D";
                } else if (action === "PENDING") {
                    statusBadge.innerHTML = `<span class="badge-status pending">Chờ Duyệt</span>`;
                    logNoteP.textContent = note;
                    reasonBox.style.display = "block";
                    reasonBox.style.backgroundColor = "#FEF3C7";
                    reasonBox.style.borderLeftColor = "#D97706";
                    reasonBox.querySelector("strong").style.color = "#D97706";
                    reasonBox.querySelector("strong").textContent = "Ghi chú:";
                    logNoteP.style.color = "#92400E";
                } else if (action === "APPROVED") {
                    statusBadge.innerHTML = `<span class="badge-status active">Đã Duyệt</span>`;
                    reasonBox.style.display = "none";
                } else {
                    statusBadge.innerHTML = `<span class="badge-status pending">${action}</span>`;
                    reasonBox.style.display = "none";
                }
            } else {
                document.getElementById("logDate").textContent = "Chưa có dữ liệu";
                document.getElementById("logAdminName").textContent = "Chưa có";
                document.getElementById("logAdminEmail").textContent = "";
                document.getElementById("logStatusBadge").innerHTML = `<span class="badge-status pending">Chờ Duyệt</span>`;
                document.getElementById("logReasonBox").style.display = "none";
            }
            
            // Show modal
            document.getElementById("approvalLogModal").classList.add("active");
            
        } else {
            alert("❌ Lỗi: " + (result.Message || result.message || "Không lấy được thông tin kiểm duyệt."));
        }
    } catch (error) {
        console.error("Lỗi xem lý do từ chối:", error);
        alert("Lỗi kết nối đến máy chủ!");
    }
}

// Đóng modal
function closeApprovalModal() {
    document.getElementById("approvalLogModal").classList.remove("active");
}

// Thêm sự kiện bấm ra ngoài để đóng modal
window.addEventListener("click", function(event) {
    const modal = document.getElementById("approvalLogModal");
    if (event.target === modal) {
        closeApprovalModal();
    }
});