document.addEventListener("DOMContentLoaded", function () {
    loadProducts();
});


async function loadProducts() {
    const tableBody = document.getElementById("productTableBody");
    const token = localStorage.getItem("jwtToken"); // Lấy token

    if (!token) {
        alert("Bạn chưa đăng nhập!");
        window.location.href = "../DangNhap/index.html";
        return;
    }

    try {
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Đang tải dữ liệu...</td></tr>`;


        const response = await fetch("https://localhost:3001/api/LaySPSeller/seller-list?page=1&pageSize=50", {
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
                const status = (item.approvalStatus || item.ApprovalStatus || "").toUpperCase();
                
                if (status === "APPROVED") {
                    approvalStatusHtml = `<span class="badge-status active">Đã Duyệt</span>`;
                } else if (status === "PENDING") {
                    approvalStatusHtml = `<span class="badge-status pending">Chờ Duyệt</span>`;
                } else {
                    approvalStatusHtml = `<span class="badge-status reject">Từ Chối</span>`;
                }

                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td><strong>${item.productId || item.ProductId}</strong></td>
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
                    <td class="display-status-cell"><span class="badge-status active">Đang Bán</span></td>
                    <td>
                        <div class="btn-action-group">
                            <button class="btn-tb block btn-toggle-vis" onclick="hideProduct('${item.productId || item.ProductId}')">Ẩn SP</button>
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