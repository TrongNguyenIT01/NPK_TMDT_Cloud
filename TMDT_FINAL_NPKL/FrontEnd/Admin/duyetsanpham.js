document.addEventListener("DOMContentLoaded", () => {
    loadProducts();

    const searchInput = document.querySelector(".search-input-admin");
    if (searchInput) searchInput.addEventListener("input", debounce(loadProducts, 300));

    const tbody = document.getElementById("productApprovalBody");
    const rejectModal = document.getElementById("rejectModal");
    const closeRejectModalBtn = document.getElementById("closeRejectModal");
    const confirmRejectBtn = document.getElementById("confirmRejectBtn");
    const rejectNoteInput = document.getElementById("rejectNoteInput");
    
    let currentRejectProductId = null;

    if (tbody) {
        tbody.addEventListener("click", async (e) => {
            const btn = e.target.closest(".btn-product-action");
            if (!btn) return;

            const productId = btn.getAttribute("data-id");
            const action = btn.getAttribute("data-action"); // APPROVED hoặc REJECTED
            const token = localStorage.getItem("jwtToken");

            if (!token) {
                alert("Bạn chưa đăng nhập hoặc không có quyền truy cập!");
                return;
            }

            if (action === "APPROVED") {
                if (confirm("Bạn có chắc chắn muốn duyệt sản phẩm này lên sàn?")) {
                    await approveOrRejectProduct(productId, "APPROVED", "", token);
                }
            } else if (action === "REJECTED") {
                currentRejectProductId = productId;
                rejectNoteInput.value = "";
                rejectModal.style.display = "flex";
            }
        });
    }

    if (closeRejectModalBtn) {
        closeRejectModalBtn.addEventListener("click", () => {
            rejectModal.style.display = "none";
            currentRejectProductId = null;
        });
    }

    if (confirmRejectBtn) {
        confirmRejectBtn.addEventListener("click", async () => {
            const note = rejectNoteInput.value.trim();
            if (!note) {
                alert("Vui lòng nhập lý do từ chối!");
                return;
            }

            const token = localStorage.getItem("jwtToken");
            if (!token) {
                alert("Bạn chưa đăng nhập hoặc không có quyền truy cập!");
                return;
            }

            await approveOrRejectProduct(currentRejectProductId, "REJECTED", note, token);
            rejectModal.style.display = "none";
            currentRejectProductId = null;
        });
    }
});

async function approveOrRejectProduct(productId, status, note, token) {
    try {
        const response = await fetch(`https://localhost:3001/api/AdminDuyetSP/approve/${productId}`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                Status: status,
                Note: note
            })
        });

        const data = await response.json();
        if (response.ok && data.success) {
            alert(data.message || "Xử lý thành công!");
            loadProducts(); // Load lại bảng
        } else {
            alert(data.message || "Xử lý thất bại!");
        }
    } catch (error) {
        console.error("Lỗi khi xử lý sản phẩm:", error);
        alert("Không thể kết nối đến máy chủ!");
    }
}

async function loadProducts() {
    const token = localStorage.getItem("jwtToken");
    if (!token) {
        alert("Bạn chưa đăng nhập hoặc không có quyền truy cập!");
        window.location.href = "../DangNhap/index.html";
        return;
    }

    // Currently no status filter in HTML, we will fetch 'PENDING' by default, or 'ALL' and filter in JS if needed.
    // Let's fetch 'all' and render all of them, or 'PENDING'. The HTML says "Danh Sách Sản Phẩm Chờ Duyệt Công Khai", so let's fetch PENDING
    // Actually, I'll fetch 'ALL' for now or just follow the search
    const searchVal = document.querySelector(".search-input-admin")?.value.toLowerCase() || "";

    try {
        // Fetch all products (status=all or status=pending based on what's best. Let's do 'all' to show history if we want, or 'pending' by default. Let's do 'all' for now)
        const response = await fetch(`https://localhost:3001/api/AdminDuyetSP/all-products?page=1&pageSize=1000&status=all`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        const result = await response.json();
        if (response.ok && result.success) {
            let products = result.data.items || [];
            
            // Lọc theo search input
            if (searchVal) {
                products = products.filter(p => 
                    p.productName.toLowerCase().includes(searchVal) || 
                    p.shopName.toLowerCase().includes(searchVal) ||
                    p.productId.toLowerCase().includes(searchVal)
                );
            }

            renderProductsTable(products);
            
            // Cập nhật các chỉ số ở phần đầu trang (Metric Cards)
            const allItems = result.data.items || [];
            const pendingCount = allItems.filter(p => p.approvalStatus === "PENDING").length;
            const approvedCount = allItems.filter(p => p.approvalStatus === "APPROVED").length;
            const rejectedCount = allItems.filter(p => p.approvalStatus === "REJECTED").length;
            const totalCount = result.data.pagination ? result.data.pagination.totalItems : allItems.length;

            const pendingMetric = document.getElementById("pendingProductMetric");
            const approvedMetric = document.getElementById("approvedProductMetric");
            const rejectedMetric = document.getElementById("rejectedProductMetric");
            const totalMetric = document.getElementById("totalProductMetric");

            if (pendingMetric) pendingMetric.textContent = pendingCount;
            if (approvedMetric) approvedMetric.textContent = approvedCount;
            if (rejectedMetric) rejectedMetric.textContent = rejectedCount;
            if (totalMetric) totalMetric.textContent = totalCount;

        } else {
            console.error("Lỗi tải danh sách sản phẩm:", result.message);
        }
    } catch (error) {
        console.error("Lỗi kết nối API:", error);
    }
}

function renderProductsTable(products) {
    const tbody = document.getElementById("productApprovalBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (products.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #64748B;">Không có sản phẩm nào phù hợp</td></tr>`;
        return;
    }

    products.forEach(product => {
        let statusName = "Chờ Duyệt";
        let statusClass = "pending";

        if (product.approvalStatus === "APPROVED") {
            statusName = "Đã Duyệt";
            statusClass = "active";
        } else if (product.approvalStatus === "REJECTED") {
            statusName = "Từ Chối";
            statusClass = "rejected";
        }

        let actionHtml = "";
        if (product.approvalStatus === "PENDING") {
            actionHtml = `
                <div class="btn-action-group">
                    <button class="btn-tb approve btn-product-action" data-id="${product.productId}" data-action="APPROVED">✓ Duyệt Bán</button>
                    <button class="btn-tb reject btn-product-action" data-id="${product.productId}" data-action="REJECTED">✕ Từ Chối</button>
                </div>
            `;
        } else {
            actionHtml = `<span style="color:#64748B; font-size: 0.85rem;">Đã xử lý</span>`;
        }

        const fullImageUrl = product.image ? `https://localhost:3001${product.image}` : '../TrangChinh/images/default.jpg';

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${product.productId}</strong></td>
            <td class="product-name-cell">
                <div style="display:flex; align-items:center; gap:8px;">
                    <img src="${fullImageUrl}" alt="img" style="width:40px; height:40px; object-fit:cover; border-radius:4px;" onerror="this.onerror=null;this.src='../TrangChinh/images/default.jpg';">
                    <span>${product.productName}</span>
                </div>
            </td>
            <td>${product.shopName}</td>
            <td>${product.categoryName}</td>
            <td>${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}</td>
            <td>${product.stockQuantity}</td>
            <td class="product-status-cell"><span class="badge-status ${statusClass}">${statusName}</span></td>
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
