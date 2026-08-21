// cap-nhat-gia-kho.js - Xử lý tải danh sách sản phẩm ĐÃ DUYỆT và cập nhật giá / tồn kho tức thì

document.addEventListener("DOMContentLoaded", function () {
    loadApprovedProducts();
});

// Hàm 1: Tải danh sách sản phẩm đã được Admin duyệt (APPROVED) của gian hàng
async function loadApprovedProducts() {
    const tableBody = document.getElementById("inventoryTableBody");
    if (!tableBody) return;

    const token = sessionStorage.getItem("jwtToken") || localStorage.getItem("jwtToken");

    if (!token) {
        alert("Bạn chưa đăng nhập! Vui lòng đăng nhập tài khoản Seller.");
        window.location.href = "../DangNhap/index.html";
        return;
    }

    try {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 24px; color: #64748B;">⏳ Đang tải danh sách sản phẩm đã duyệt...</td></tr>`;

        const response = await fetch(`${window.location.origin}/api/LaySPSeller/approved-products`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const result = await response.json();
        const isSuccess = result.Success || result.success;

        if (response.ok && isSuccess) {
            const items = result.data || result.Data || [];
            tableBody.innerHTML = "";

            if (items.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="5" style="text-align:center; padding: 32px; color: #64748B;">
                            📦 Hiện tại gian hàng chưa có sản phẩm nào ở trạng thái <strong>ĐÃ DUYỆT (APPROVED)</strong>.<br/>
                            <a href="dang-san-pham.html" style="color:#2563EB; font-weight:600; text-decoration:underline; display:inline-block; margin-top:8px;">+ Đăng sản phẩm mới</a>
                        </td>
                    </tr>`;
                return;
            }

            items.forEach(item => {
                const productId = item.productId || item.ProductId;
                const productName = item.productName || item.ProductName;
                const price = item.price !== undefined ? item.price : item.Price;
                const stockQuantity = item.stockQuantity !== undefined ? item.stockQuantity : item.StockQuantity;
                const categoryName = item.categoryName || item.CategoryName || item.categoryId || item.CategoryId || "Chưa phân loại";
                const imagePath = item.image || item.Image;
                const fullImageUrl = imagePath ? `https://localhost:3001${imagePath}` : '../TrangChinh/images/default.jpg';

                const tr = document.createElement("tr");
                tr.id = `row_${productId}`;
                tr.innerHTML = `
                    <td><strong>${productId}</strong></td>
                    <td>
                        <div style="display:flex; align-items:center; gap:12px;">
                            <img src="${fullImageUrl}" class="product-img-thumb" alt="${productName}" onerror="this.onerror=null;this.src='../TrangChinh/images/default.jpg';" style="width:48px; height:48px; object-fit:cover; border-radius:6px; border:1px solid #E2E8F0;">
                            <div>
                                <strong style="color:#1E293B;">${productName}</strong>
                                <p style="font-size:0.78rem; color:#64748B; margin: 2px 0 0 0;">Danh mục: ${categoryName}</p>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div style="display:flex; align-items:center; gap:6px;">
                            <input type="number" id="price_${productId}" class="form-input-seller" value="${price}" min="0" step="1000" style="width:160px; font-weight:600;" />
                            <span style="font-size:0.85rem; color:#64748B; font-weight:600;">đ</span>
                        </div>
                    </td>
                    <td>
                        <div style="display:flex; align-items:center; gap:6px;">
                            <input type="number" id="stock_${productId}" class="form-input-seller" value="${stockQuantity}" min="0" step="1" style="width:120px; font-weight:600;" />
                            <span style="font-size:0.85rem; color:#64748B;">SP</span>
                        </div>
                    </td>
                    <td>
                        <button class="btn-tb approve" id="btn_save_${productId}" onclick="savePriceAndStock('${productId}')">
                            💾 Lưu Giá & Kho
                        </button>
                    </td>
                `;
                tableBody.appendChild(tr);
            });
        } else {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red; padding: 24px;">❌ Lỗi: ${result.Message || result.message || "Không thể lấy danh sách sản phẩm!"}</td></tr>`;
        }
    } catch (error) {
        console.error("Lỗi khi tải sản phẩm đã duyệt:", error);
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red; padding: 24px;">⚠️ Lỗi kết nối đến máy chủ! Vui lòng kiểm tra lại backend.</td></tr>`;
    }
}

// Hàm 2: Gọi API cập nhật giá và tồn kho cho 1 sản phẩm
async function savePriceAndStock(productId) {
    const token = sessionStorage.getItem("jwtToken") || localStorage.getItem("jwtToken");
    if (!token) {
        alert("Bạn chưa đăng nhập! Vui lòng đăng nhập lại.");
        window.location.href = "../DangNhap/index.html";
        return;
    }

    const priceInput = document.getElementById(`price_${productId}`);
    const stockInput = document.getElementById(`stock_${productId}`);
    const saveBtn = document.getElementById(`btn_save_${productId}`);

    if (!priceInput || !stockInput) return;

    const priceValue = parseFloat(priceInput.value);
    const stockValue = parseInt(stockInput.value);

    // Validate phía Client
    if (isNaN(priceValue) || priceValue < 0) {
        alert("❌ Giá bán không hợp lệ! Vui lòng nhập số lớn hơn hoặc bằng 0.");
        priceInput.focus();
        return;
    }

    if (isNaN(stockValue) || stockValue < 0) {
        alert("❌ Số lượng tồn kho không hợp lệ! Vui lòng nhập số nguyên lớn hơn hoặc bằng 0.");
        stockInput.focus();
        return;
    }

    // Hiển thị trạng thái đang xử lý trên nút bấm
    const originalBtnText = saveBtn ? saveBtn.innerHTML : "💾 Lưu Giá & Kho";
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = "⏳ Đang lưu...";
    }

    try {
        const response = await fetch(`https://localhost:3001/api/LaySPSeller/update-price-stock/${productId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                price: priceValue,
                stockQuantity: stockValue
            })
        });

        const result = await response.json();
        const isSuccess = result.Success || result.success;

        if (response.ok && isSuccess) {
            alert("✅ " + (result.Message || result.message || `Đã cập nhật giá và tồn kho cho SP [${productId}] thành công!`));
            
            // Highlight nhẹ dòng vừa sửa để phản hồi trực quan
            const row = document.getElementById(`row_${productId}`);
            if (row) {
                row.style.transition = "background-color 0.4s ease";
                row.style.backgroundColor = "#ECFDF5";
                setTimeout(() => {
                    row.style.backgroundColor = "";
                }, 1500);
            }
        } else {
            alert("❌ Thất bại: " + (result.Message || result.message || "Không thể cập nhật giá và tồn kho!"));
        }
    } catch (error) {
        console.error("Lỗi khi cập nhật giá và kho:", error);
        alert("⚠️ Lỗi kết nối đến máy chủ khi cập nhật dữ liệu!");
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalBtnText;
        }
    }
}
