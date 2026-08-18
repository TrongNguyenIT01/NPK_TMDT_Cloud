async function fetchDashboardMetrics() {
        try {
            // Gọi đến đường dẫn API trong DashboardController
            const response = await fetch('https://localhost:3001/api/dashboard/dashboard-metrics'); 
            
            // Kiểm tra nếu lỗi (ví dụ 404, 500)
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Chuyển đổi dữ liệu trả về sang JSON
            const data = await response.json(); 

            // 1. Cập nhật số liệu Người dùng
            document.getElementById('total-user').innerText = data.totalUsers;
            document.getElementById('pending-user').innerText = `chưa duyệt: ${data.pendingUsers} tài khoản`;

            // 2. Cập nhật số liệu Cửa hàng
            document.getElementById('total-shop').innerText = data.activeShops;

            // 3. Cập nhật số liệu Sản phẩm
            document.getElementById('total-item').innerText = data.totalProducts;
            document.getElementById('pending-item').innerText = `${data.pendingProducts} Chờ duyệt`;

            // 4. Cập nhật số liệu Tổng doanh thu giao dịch
            const revenueElem = document.getElementById('total-revenue');
            if (revenueElem) {
                const formattedRevenue = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(data.totalRevenue || 0);
                revenueElem.innerText = formattedRevenue;
            }

        } catch (error) {
            console.error("Lỗi khi tải số liệu Dashboard:", error);
            // Nếu lỗi, có thể cho hiển thị chữ 'Lỗi' hoặc '---' để giao diện không bị trống
            if (document.getElementById('total-user')) document.getElementById('total-user').innerText = "Lỗi";
            if (document.getElementById('total-shop')) document.getElementById('total-shop').innerText = "Lỗi";
            if (document.getElementById('total-item')) document.getElementById('total-item').innerText = "Lỗi";
            if (document.getElementById('total-revenue')) document.getElementById('total-revenue').innerText = "Lỗi";
        }
    }

    // Tự động chạy hàm fetchDashboardMetrics ngay khi tải xong giao diện web
    document.addEventListener("DOMContentLoaded", () => {
        fetchDashboardMetrics();
        loadDashboardPendingProducts();
        
        // Gắn sự kiện duyệt/từ chối sản phẩm cho bảng Dashboard
        const dashboardProductTable = document.getElementById("dashboardPendingProducts");
        if (dashboardProductTable) {
            dashboardProductTable.addEventListener("click", async (e) => {
                const btn = e.target.closest(".btn-product-action");
                if (!btn) return;

                const productId = btn.getAttribute("data-id");
                const action = btn.getAttribute("data-action");
                const token = localStorage.getItem("jwtToken");

                if (!token) {
                    alert("Bạn chưa đăng nhập hoặc không có quyền truy cập!");
                    return;
                }

                if (action === "APPROVED") {
                    if (confirm("Bạn có chắc chắn muốn duyệt sản phẩm này lên sàn?")) {
                        await approveOrRejectDashboardProduct(productId, "APPROVED", "", token);
                    }
                } else if (action === "REJECTED") {
                    const note = prompt("Nhập lý do từ chối sản phẩm này:");
                    if (note === null) return;
                    if (!note.trim()) {
                        alert("Lý do từ chối không được để trống!");
                        return;
                    }
                    await approveOrRejectDashboardProduct(productId, "REJECTED", note, token);
                }
            });
        }
    });

    async function approveOrRejectDashboardProduct(productId, status, note, token) {
        try {
            const response = await fetch(`https://localhost:3001/api/AdminDuyetSP/approve/${productId}`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ Status: status, Note: note })
            });

            const data = await response.json();
            if (response.ok && data.success) {
                alert(data.message || "Xử lý thành công!");
                loadDashboardPendingProducts();
                fetchDashboardMetrics(); // Cập nhật lại số liệu trên cùng
            } else {
                alert(data.message || "Xử lý thất bại!");
            }
        } catch (error) {
            console.error("Lỗi khi xử lý sản phẩm:", error);
            alert("Không thể kết nối đến máy chủ!");
        }
    }

    async function loadDashboardPendingProducts() {
        const tbody = document.getElementById("dashboardPendingProducts");
        if (!tbody) return;

        const token = localStorage.getItem("jwtToken");
        if (!token) return;

        try {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center;">Đang tải dữ liệu...</td></tr>`;
            
            // Lấy 5 sản phẩm chờ duyệt mới nhất
            const response = await fetch(`https://localhost:3001/api/AdminDuyetSP/all-products?page=1&pageSize=5&status=PENDING`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            const result = await response.json();
            if (response.ok && result.success) {
                const products = result.data.items || [];
                tbody.innerHTML = "";

                if (products.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #64748B;">Không có sản phẩm nào đang chờ duyệt</td></tr>`;
                    return;
                }

                products.forEach(product => {
                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td><strong>${product.productId}</strong></td>
                        <td class="product-name-cell">${product.productName}</td>
                        <td>${product.shopName}</td>
                        <td>${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}</td>
                        <td>${product.stockQuantity}</td>
                        <td class="product-status-cell"><span class="badge-status pending">Chờ Duyệt</span></td>
                        <td>
                            <div class="btn-action-group">
                                <button class="btn-tb approve btn-product-action" data-id="${product.productId}" data-action="APPROVED">Duyệt</button>
                                <button class="btn-tb reject btn-product-action" data-id="${product.productId}" data-action="REJECTED">Từ chối</button>
                            </div>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
            } else {
                tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: red;">Lỗi tải dữ liệu</td></tr>`;
            }
        } catch (error) {
            console.error("Lỗi kết nối API lấy danh sách chờ duyệt:", error);
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: red;">Mất kết nối máy chủ</td></tr>`;
        }
    }