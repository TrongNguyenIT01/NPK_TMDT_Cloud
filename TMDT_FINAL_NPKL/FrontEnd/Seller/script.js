document.addEventListener('DOMContentLoaded', () => {
    // Navigation Guard: Kiểm tra quyền truy cập của Seller dựa trên trạng thái Shop
    async function checkShopAccessGuard() {
        const currentPath = window.location.pathname.toLowerCase();
        if (currentPath.includes("thong-tin-cua-hang.html")) {
            return;
        }

        const token = sessionStorage.getItem("jwtToken") || localStorage.getItem("jwtToken");
        if (!token) return; // checkUser.js sẽ tự xử lý đẩy về trang Login

        try {
            const response = await fetch("https://localhost:3001/api/Shop/my-shop", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            const result = await response.json();
            
            let status = "NONE";
            if (result.success && result.data) {
                status = result.data.status;
            }

            localStorage.setItem("myShopStatus", status);

            if (status !== "ACTIVE" && status !== "INACTIVE") {
                alert("Cửa hàng của bạn cần phải ở trạng thái HOẠT ĐỘNG (ACTIVE) để sử dụng các chức năng quản lý! Hệ thống sẽ chuyển hướng bạn về trang Thiết Lập Hồ Sơ.");
                window.location.href = "thong-tin-cua-hang.html";
            }
        } catch (error) {
            console.error("Lỗi kiểm tra quyền truy cập cửa hàng:", error);
        }
    }
    
    checkShopAccessGuard();

    // 0. Toggle Sidebar Collapse/Expand
    const toggleSidebarBtn = document.querySelector('#toggleSidebar');
    if (toggleSidebarBtn) {
        toggleSidebarBtn.addEventListener('click', () => {
            document.body.classList.toggle('sidebar-collapsed');
        });
    }

    // 0.1 Dropdown Submenu Accordion Toggle
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            const parentItem = toggle.closest('.has-dropdown');
            if (parentItem) {
                parentItem.classList.toggle('open');
            }
        });
    });

    // 1. Sidebar Navigation Tab Switching
    const menuLinks = document.querySelectorAll('.menu-link');
    const tabPanels = document.querySelectorAll('.tab-panel');
    const pageHeaderTitle = document.querySelector('#pageHeaderTitle');

    menuLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetTab = link.getAttribute('data-tab');
            if (!targetTab) return; // For external links like Log Out

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

    // 2. Product Management (Add, Toggle Visibility, Delete)
    const addProductBtn = document.querySelector('#addProductBtn');
    const productModal = document.querySelector('#productModal');
    const closeProductModalBtn = document.querySelector('#closeProductModal');
    const productForm = document.querySelector('#productForm');
    const productTableBody = document.querySelector('#productTableBody');

    if (addProductBtn && productModal) {
        addProductBtn.addEventListener('click', () => {
            productModal.classList.add('active');
        });
    }

    if (closeProductModalBtn && productModal) {
        closeProductModalBtn.addEventListener('click', () => {
            productModal.classList.remove('active');
        });
    }

    if (productForm) {
        productForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.querySelector('#prodNameInput').value.trim();
            const cat = document.querySelector('#prodCatInput').value;
            const price = document.querySelector('#prodPriceInput').value;
            const stock = document.querySelector('#prodStockInput').value;
            const desc = document.querySelector('#prodDescInput').value.trim();

            if (!name || !price) return;

            const newId = 'SP00' + Math.floor(20 + Math.random() * 80);
            const formattedPrice = parseInt(price).toLocaleString('vi-VN') + 'đ';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${newId}</strong></td>
                <td>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <img src="../TrangChinh/images/dac_nhan_tam.jpg" class="product-img-thumb" alt="${name}">
                        <div>
                            <strong>${name}</strong>
                            <p style="font-size:0.78rem; color:#64748B;">Mô tả: ${desc || 'Sản phẩm mới'}</p>
                        </div>
                    </div>
                </td>
                <td>${cat}</td>
                <td><strong>${formattedPrice}</strong></td>
                <td>${stock} SP</td>
                <td class="approval-status-cell"><span class="badge-status pending">Chờ Duyệt (PENDING)</span></td>
                <td class="display-status-cell"><span class="badge-status active">Đang Bán</span></td>
                <td>
                    <div class="btn-action-group">
                        <button class="btn-tb block btn-toggle-vis">Ẩn SP</button>
                        <button class="btn-tb reject" onclick="if(confirm('Bạn có chắc muốn xóa sản phẩm này?')) this.closest('tr').remove();">Xóa</button>
                    </div>
                </td>
            `;

            if (productTableBody) productTableBody.prepend(tr);
            alert(`Đã gửi yêu cầu đăng sản phẩm "${name}"!\nTrạng thái: Chờ Duyệt (PENDING) từ Administrator.`);

            if (productModal) productModal.classList.remove('active');
            productForm.reset();
        });
    }

    // Toggle Product Visibility (Đang Bán <-> Tạm Ẩn)
    if (productTableBody) {
        productTableBody.addEventListener('click', (e) => {
            const visBtn = e.target.closest('.btn-toggle-vis');
            if (!visBtn) return;

            const row = visBtn.closest('tr');
            const displayCell = row.querySelector('.display-status-cell');
            const productName = row.querySelector('strong').textContent;

            if (visBtn.textContent.includes('Ẩn')) {
                displayCell.innerHTML = `<span class="badge-status hidden">Tạm Ẩn</span>`;
                visBtn.textContent = 'Hiện SP';
                visBtn.className = 'btn-tb approve btn-toggle-vis';
                alert(`Đã tạm ẩn sản phẩm: ${productName}`);
            } else {
                displayCell.innerHTML = `<span class="badge-status active">Đang Bán</span>`;
                visBtn.textContent = 'Ẩn SP';
                visBtn.className = 'btn-tb block btn-toggle-vis';
                alert(`Đã hiển thị mở bán lại sản phẩm: ${productName}`);
            }
        });
    }

    // 3. Order Processing Logic
    const orderTableBody = document.querySelector('#orderTableBody');
    if (orderTableBody) {
        orderTableBody.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-order-action');
            if (!btn) return;

            const action = btn.getAttribute('data-action');
            const row = btn.closest('tr');
            const statusCell = row.querySelector('.order-status-cell');
            const orderId = row.querySelector('strong').textContent;
            const actionGroup = btn.closest('.btn-action-group');

            if (action === 'CONFIRM') {
                statusCell.innerHTML = `<span class="badge-status active">Đã Xác Nhận</span>`;
                actionGroup.innerHTML = `
                    <button class="btn-tb primary btn-order-action" data-action="SHIP">Giao Vận Chuyển</button>
                    <button class="btn-tb primary" onclick="alert('Đang in hóa đơn bán hàng cho đơn ${orderId}...')">In Hóa Đơn</button>
                `;
                alert(`Đã xác nhận đơn hàng ${orderId}!`);
            } else if (action === 'SHIP') {
                statusCell.innerHTML = `<span class="badge-status shipping">Đang Giao Hàng</span>`;
                actionGroup.innerHTML = `
                    <button class="btn-tb approve btn-order-action" data-action="DELIVER">Đã Giao Hàng</button>
                    <button class="btn-tb primary" onclick="alert('Đang in hóa đơn bán hàng cho đơn ${orderId}...')">In Hóa Đơn</button>
                `;
                alert(`Đã chuyển đơn hàng ${orderId} cho đơn vị vận chuyển!`);
            } else if (action === 'DELIVER') {
                statusCell.innerHTML = `<span class="badge-status delivered">Giao Thành Công</span>`;
                actionGroup.innerHTML = `
                    <span style="font-size:0.82rem; color:#16A34A; font-weight:700;">✓ Hoàn tất</span>
                    <button class="btn-tb primary" onclick="alert('Đang in hóa đơn bán hàng cho đơn ${orderId}...')">In Hóa Đơn</button>
                `;
                alert(`Đơn hàng ${orderId} đã giao thành công cho khách hàng!`);
            } else if (action === 'CANCEL') {
                statusCell.innerHTML = `<span class="badge-status blocked">Đã Hủy</span>`;
                actionGroup.innerHTML = `<span style="font-size:0.82rem; color:#DC2626; font-weight:700;">✕ Đã hủy đơn</span>`;
                alert(`Đã hủy đơn hàng ${orderId}.`);
            }
        });
    }

    // 4. Shop Profile Save Form & API Integration
    const shopProfileForm = document.querySelector('#shopProfileForm');

    async function loadShopProfile() {
        const token = sessionStorage.getItem("jwtToken") || localStorage.getItem("jwtToken");
        if (!token) return;

        try {
            const response = await fetch("https://localhost:3001/api/Shop/my-shop", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            const result = await response.json();

            const shopIdInput = document.querySelector('#profileShopId');
            const sellerIdInput = document.querySelector('#profileSellerId');
            const shopNameInput = document.querySelector('#profileShopName');
            const phoneInput = document.querySelector('#profilePhone');
            const emailInput = document.querySelector('#profileEmail');
            const addressInput = document.querySelector('#profileAddress');
            const descInput = document.querySelector('#profileDescription');
            const statusSelect = document.querySelector('#profileShopStatus');
            const submitBtn = document.querySelector('#btnSubmitProfile');
            const formTitle = document.querySelector('#formTitle');
            
            const banner = document.querySelector('#shopStatusBanner');
            const bannerText = document.querySelector('#shopStatusBannerText');
            const bannerIcon = document.querySelector('#shopStatusBannerIcon');

            const headerShopName = document.querySelector('#headerShopName');
            const headerShopSubtitle = document.querySelector('#headerShopSubtitle');
            const headerShopAvatar = document.querySelector('#headerShopAvatar');

            const sidebarName = document.querySelector('.seller-info .seller-name');
            const sidebarRole = document.querySelector('.seller-info .seller-role');
            const sidebarAvatar = document.querySelector('.seller-avatar');

            if (result.success && result.data) {
                const shop = result.data;
                if (shopIdInput) shopIdInput.value = shop.shopId;
                if (sellerIdInput) sellerIdInput.value = shop.sellerId;
                if (shopNameInput) shopNameInput.value = shop.shopName;
                if (phoneInput) phoneInput.value = shop.phone || '';
                if (emailInput) emailInput.value = shop.email || '';
                if (addressInput) addressInput.value = shop.address || '';
                if (descInput) descInput.value = shop.description || '';
                
                if (headerShopName) headerShopName.textContent = shop.shopName;
                if (headerShopSubtitle) headerShopSubtitle.textContent = `Mã Shop: ${shop.shopId} | Chủ: ${shop.sellerId}`;
                if (headerShopAvatar) headerShopAvatar.textContent = shop.shopName.substring(0, 2).toUpperCase();

                if (sidebarName) sidebarName.textContent = shop.shopName;
                if (sidebarRole) sidebarRole.textContent = `Mã Shop: ${shop.shopId}`;
                if (sidebarAvatar) sidebarAvatar.textContent = shop.shopName.substring(0, 2).toUpperCase();

                localStorage.setItem("myShopStatus", shop.status);

                if (shop.status === "PENDING") {
                    if (statusSelect) {
                        statusSelect.value = "PENDING";
                        statusSelect.disabled = true;
                    }
                    if (banner) {
                        banner.style.display = "flex";
                        banner.style.backgroundColor = "#FEF3C7";
                        banner.style.borderColor = "#F59E0B";
                        banner.style.color = "#D97706";
                        bannerText.textContent = "Cửa hàng đang chờ Admin phê duyệt. Bạn chưa thể đăng bán sản phẩm.";
                        bannerIcon.textContent = "⏳";
                    }
                    if (submitBtn) {
                        submitBtn.textContent = "Cập Nhật Thông Tin";
                    }
                } 
                else if (shop.status === "REJECTED") {
                    if (statusSelect) {
                        statusSelect.value = "PENDING";
                        statusSelect.disabled = true;
                    }
                    if (banner) {
                        banner.style.display = "flex";
                        banner.style.backgroundColor = "#FFEDD5";
                        banner.style.borderColor = "#F97316";
                        banner.style.color = "#EA580C";
                        bannerText.textContent = "Đơn mở gian hàng của bạn đã bị từ chối. Vui lòng chỉnh sửa lại thông tin và gửi lại yêu cầu duyệt.";
                        bannerIcon.textContent = "❌";
                    }
                    if (submitBtn) {
                        submitBtn.textContent = "Gửi Lại Yêu Cầu Duyệt";
                    }
                }
                else if (shop.status === "BANNED") {
                    if (statusSelect) {
                        statusSelect.value = "BANNED";
                        statusSelect.disabled = true;
                    }
                    if (shopNameInput) shopNameInput.disabled = true;
                    if (phoneInput) phoneInput.disabled = true;
                    if (emailInput) emailInput.disabled = true;
                    if (addressInput) addressInput.disabled = true;
                    if (descInput) descInput.disabled = true;
                    if (submitBtn) submitBtn.disabled = true;

                    if (banner) {
                        banner.style.display = "flex";
                        banner.style.backgroundColor = "#FEE2E2";
                        banner.style.borderColor = "#EF4444";
                        banner.style.color = "#DC2626";
                        bannerText.textContent = "Cửa hàng của bạn đã bị cấm hoạt động. Vui lòng liên hệ QTV để được giải quyết.";
                        bannerIcon.textContent = "🚫";
                    }
                } 
                else {
                    if (statusSelect) {
                        statusSelect.value = shop.status;
                        statusSelect.disabled = false;
                        Array.from(statusSelect.options).forEach(opt => {
                            if (opt.value === "ACTIVE" || opt.value === "INACTIVE") {
                                opt.disabled = false;
                            } else {
                                opt.disabled = true;
                            }
                        });
                    }
                    if (banner) banner.style.display = "none";
                    if (submitBtn) submitBtn.textContent = "Lưu Thay Đổi Hồ Sơ";
                }
            } 
            else if (result.code === "NO_SHOP") {
                localStorage.setItem("myShopStatus", "NONE");

                if (formTitle) formTitle.textContent = "Đăng Ký Mở Cửa Hàng Mới";
                if (shopIdInput) shopIdInput.value = "Hệ thống tự động sinh";
                if (sellerIdInput) sellerIdInput.value = "Tài khoản hiện tại";
                
                if (phoneInput) phoneInput.value = result.data?.phone || '';
                if (emailInput) emailInput.value = result.data?.email || '';
                if (addressInput) addressInput.value = result.data?.address || '';

                if (statusSelect) {
                    statusSelect.value = "PENDING";
                    statusSelect.disabled = true;
                }

                if (banner) {
                    banner.style.display = "flex";
                    banner.style.backgroundColor = "#DBEAFE";
                    banner.style.borderColor = "#3B82F6";
                    banner.style.color = "#1D4ED8";
                    bannerText.textContent = "Bạn chưa đăng ký cửa hàng. Vui lòng điền thông tin và gửi yêu cầu phê duyệt.";
                    bannerIcon.textContent = "🏪";
                }

                if (submitBtn) {
                    submitBtn.textContent = "Đăng Ký Mở Cửa Hàng";
                }

                if (headerShopName) headerShopName.textContent = "Chưa có cửa hàng";
                if (headerShopSubtitle) headerShopSubtitle.textContent = "Vui lòng đăng ký mới";
            }
        } catch (error) {
            console.error("Lỗi khi tải thông tin cửa hàng:", error);
        }
    }

    if (shopProfileForm) {
        shopProfileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const token = sessionStorage.getItem("jwtToken") || localStorage.getItem("jwtToken");
            if (!token) return;

            const shopName = document.querySelector('#profileShopName').value.trim();
            const phone = document.querySelector('#profilePhone').value.trim();
            const email = document.querySelector('#profileEmail').value.trim();
            const address = document.querySelector('#profileAddress').value.trim();
            const description = document.querySelector('#profileDescription').value.trim();
            const status = document.querySelector('#profileShopStatus').value;

            const isNewShop = localStorage.getItem("myShopStatus") === "NONE";
            const url = isNewShop ? "https://localhost:3001/api/Shop/create" : "https://localhost:3001/api/Shop/update-profile";
            const method = isNewShop ? "POST" : "PUT";

            const payload = {
                shopName,
                phone,
                email,
                address,
                description
            };

            if (!isNewShop) {
                payload.status = status;
            }

            try {
                const response = await fetch(url, {
                    method: method,
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();
                if (response.ok && result.success) {
                    alert(result.message || "Cập nhật thành công!");
                    loadShopProfile();
                } else {
                    alert("Thất bại: " + (result.message || "Có lỗi xảy ra!"));
                }
            } catch (error) {
                console.error("Lỗi gửi form:", error);
                alert("Lỗi kết nối máy chủ!");
            }
        });
    }

    // Tự động tải dữ liệu nếu đang ở trang cấu hình cửa hàng
    if (document.querySelector('#shopProfileForm')) {
        loadShopProfile();
    }
});
