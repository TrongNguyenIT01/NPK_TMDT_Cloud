document.addEventListener('DOMContentLoaded', () => {
    // 0. Toggle Sidebar Collapse/Expand
    const toggleSidebarBtn = document.querySelector('#toggleSidebar');
    if (toggleSidebarBtn) {
        toggleSidebarBtn.addEventListener('click', () => {
            document.body.classList.toggle('sidebar-collapsed');
        });
    }

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

    // 4. Shop Profile Save Form
    const shopProfileForm = document.querySelector('#shopProfileForm');
    if (shopProfileForm) {
        shopProfileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const shopName = document.querySelector('#profileShopName').value.trim();
            const shopStatus = document.querySelector('#profileShopStatus').value;

            const headerShopTitle = document.querySelector('#headerShopTitle');
            if (headerShopTitle && shopName) {
                headerShopTitle.textContent = shopName;
            }

            const statusText = shopStatus === 'ACTIVE' ? 'Hoạt Động' : 'Tạm Nghỉ';
            alert(`Cập nhật thông tin Cửa Hàng "${shopName}" thành công!\nTrạng thái: ${statusText}`);
        });
    }
});
