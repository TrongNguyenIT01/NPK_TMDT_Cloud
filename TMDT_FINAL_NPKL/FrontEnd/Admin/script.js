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
            if (!targetTab) return; // Để cho phép điều hướng bình thường đối với link Đăng Xuất

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

    // 2. User Approval & Action Buttons
    const userTableBody = document.querySelector('#userTableBody');
    if (userTableBody) {
        userTableBody.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-user-action');
            if (!btn) return;

            const action = btn.getAttribute('data-action');
            const row = btn.closest('tr');
            const statusCell = row.querySelector('.status-cell');
            const userName = row.querySelector('.user-name-cell').textContent;

            if (action === 'ACTIVE') {
                statusCell.innerHTML = `<span class="badge-status active">Hoạt Động</span>`;
                row.setAttribute('data-status', 'ACTIVE');
                alert(`Đã duyệt kích hoạt tài khoản: ${userName}`);
            } else if (action === 'BLOCKED') {
                statusCell.innerHTML = `<span class="badge-status blocked">Đã Khóa</span>`;
                row.setAttribute('data-status', 'BLOCKED');
                alert(`Đã khóa tài khoản: ${userName}`);
            } else if (action === 'REJECTED') {
                statusCell.innerHTML = `<span class="badge-status rejected">Bị Từ Chối</span>`;
                row.setAttribute('data-status', 'REJECTED');
                alert(`Đã từ chối tài khoản: ${userName}`);
            }
        });
    }

    // 3. Shop Status Action Buttons
    const shopTableBody = document.querySelector('#shopTableBody');
    if (shopTableBody) {
        shopTableBody.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-shop-action');
            if (!btn) return;

            const action = btn.getAttribute('data-action');
            const row = btn.closest('tr');
            const statusCell = row.querySelector('.shop-status-cell');
            const shopName = row.querySelector('.shop-name-cell').textContent;

            if (action === 'ACTIVE') {
                statusCell.innerHTML = `<span class="badge-status active">Hoạt Động</span>`;
                alert(`Đã kích hoạt Gian Hàng: ${shopName}`);
            } else if (action === 'INACTIVE') {
                statusCell.innerHTML = `<span class="badge-status pending">Tạm Nghỉ</span>`;
                alert(`Đã chuyển gian hàng sang Tạm Nghỉ: ${shopName}`);
            } else if (action === 'BANNED') {
                statusCell.innerHTML = `<span class="badge-status banned">Bị Cấm</span>`;
                alert(`Đã cấm hoạt động gian hàng: ${shopName}`);
            }
        });
    }

    // 4. Product Approval System
    const productApprovalBody = document.querySelector('#productApprovalBody');
    const rejectModal = document.querySelector('#rejectModal');
    const closeRejectModalBtn = document.querySelector('#closeRejectModal');
    const confirmRejectBtn = document.querySelector('#confirmRejectBtn');
    const rejectNoteInput = document.querySelector('#rejectNoteInput');
    let selectedProductRow = null;

    if (productApprovalBody) {
        productApprovalBody.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-product-action');
            if (!btn) return;

            const action = btn.getAttribute('data-action');
            const row = btn.closest('tr');
            const productName = row.querySelector('.product-name-cell').textContent;
            const statusCell = row.querySelector('.product-status-cell');

            if (action === 'APPROVED') {
                statusCell.innerHTML = `<span class="badge-status active">Đã Duyệt</span>`;
                btn.closest('.btn-action-group').innerHTML = `<span style="font-size:0.82rem; color:#16A34A; font-weight:700;">✓ Đã duyệt</span>`;
                alert(`Đã DUYỆT sản phẩm "${productName}" lên sàn!`);
                updatePendingProductBadge(-1);
            } else if (action === 'REJECTED') {
                selectedProductRow = row;
                if (rejectModal) rejectModal.classList.add('active');
            }
        });
    }

    if (closeRejectModalBtn && rejectModal) {
        closeRejectModalBtn.addEventListener('click', () => {
            rejectModal.classList.remove('active');
        });
    }

    if (confirmRejectBtn) {
        confirmRejectBtn.addEventListener('click', () => {
            const note = rejectNoteInput ? rejectNoteInput.value.trim() : '';
            if (!note) {
                alert('Vui lòng nhập lý do từ chối kiểm duyệt!');
                return;
            }

            if (selectedProductRow) {
                const statusCell = selectedProductRow.querySelector('.product-status-cell');
                const productName = selectedProductRow.querySelector('.product-name-cell').textContent;
                const actionGroup = selectedProductRow.querySelector('.btn-action-group');

                statusCell.innerHTML = `<span class="badge-status rejected">Bị Từ Chối</span>`;
                actionGroup.innerHTML = `<span style="font-size:0.82rem; color:#DC2626; font-weight:700;">✕ Bị từ chối (${note})</span>`;

                alert(`Đã TỪ CHỐI sản phẩm "${productName}". Lý do: ${note}`);
                updatePendingProductBadge(-1);
            }

            if (rejectModal) rejectModal.classList.remove('active');
            if (rejectNoteInput) rejectNoteInput.value = '';
        });
    }

    function updatePendingProductBadge(delta) {
        const badge = document.querySelector('#pendingProductBadge');
        if (badge) {
            let current = parseInt(badge.textContent) || 0;
            current = Math.max(0, current + delta);
            badge.textContent = current;
        }
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
        const roleVal = userRoleFilter ? userRoleFilter.value : 'ALL';
        const statusVal = userStatusFilter ? userStatusFilter.value : 'ALL';
        const searchVal = userSearchInput ? userSearchInput.value.toLowerCase().trim() : '';

        const rows = userTableBody ? userTableBody.querySelectorAll('tr') : [];
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

    if (userRoleFilter) userRoleFilter.addEventListener('change', filterUserTable);
    if (userStatusFilter) userStatusFilter.addEventListener('change', filterUserTable);
    if (userSearchInput) userSearchInput.addEventListener('input', filterUserTable);
});
