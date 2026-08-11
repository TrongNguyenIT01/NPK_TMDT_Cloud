document.addEventListener('DOMContentLoaded', () => {
    
    const savedUsername = sessionStorage.getItem('tempUsername');
    const savedEmail = sessionStorage.getItem('tempEmail');
    const savedBlockId = sessionStorage.getItem('tempBlockId');
    const savedBlockReason = sessionStorage.getItem('tempBlockReason');
    const savedRole = sessionStorage.getItem('tempRole');
    
    // 2. Gắn dữ liệu vào HTML nếu tồn tại
    if (savedUsername) {
        const usernameElem = document.getElementById('userUsername');
        if (usernameElem) usernameElem.textContent = savedUsername;
    }
    
    if (savedEmail) {
        const emailElem = document.getElementById('userEmail');
        if (emailElem) emailElem.textContent = savedEmail;
    }

    if (savedBlockId) {
        const blockIdElem = document.getElementById('blockId');
        if (blockIdElem) blockIdElem.textContent = "#" + savedBlockId;

        // Điền sẵn tiêu đề khiếu nại mặc định kèm mã hồ sơ
        const subjectElem = document.getElementById('supportSubject');
        if (subjectElem) {
            subjectElem.value = `Khiếu nại mở khóa tài khoản #${savedBlockId}`;
        }
    }

    if (savedBlockReason) {
        const reasonElem = document.getElementById('blockReason');
        if (reasonElem) reasonElem.textContent = savedBlockReason;
    }
    
    if (savedRole) {
        const roleElem = document.getElementById('userRole');
        // Vì blocked.html không có userRole, lệnh if này giúp code không bị lỗi crash
        if (roleElem) roleElem.textContent = savedRole.toUpperCase(); 
    }

    // Handle Refresh Status Button
    const refreshBtn = document.getElementById('btnRefreshStatus');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            refreshBtn.classList.add('loading');
            const originalText = refreshBtn.innerHTML;
            refreshBtn.disabled = true;
            refreshBtn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;">
                    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path>
                    <path d="M21 3v5h-5"></path>
                </svg>
                Đang kiểm tra...
            `;

            setTimeout(() => {
                refreshBtn.disabled = false;
                refreshBtn.innerHTML = originalText;
                showToast('Hệ thống chưa ghi nhận thay đổi trạng thái. Vui lòng kiểm tra lại sau!');
            }, 1200);
        });
    }

    // Modal Appeal Handlers
    const openModalBtn = document.getElementById('btnOpenModal');
    const modalOverlay = document.getElementById('supportModal');
    const closeModalBtn = document.getElementById('btnCloseModal');
    const supportForm = document.getElementById('supportForm');

    if (openModalBtn && modalOverlay) {
        openModalBtn.addEventListener('click', () => {
            modalOverlay.classList.add('active');
        });
    }

    if (closeModalBtn && modalOverlay) {
        closeModalBtn.addEventListener('click', () => {
            modalOverlay.classList.remove('active');
        });

        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.classList.remove('active');
            }
        });
    }

    if (supportForm) {
        supportForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('supportSubject')?.value.trim();
            const message = document.getElementById('supportMessage')?.value.trim();
            if (!title || !message) return;

            try {
                const response = await fetch("https://localhost:3001/api/KhieuNai/create", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        BlockId: savedBlockId || "BLK-982410",
                        Title: title,
                        Content: message
                    })
                });

                const data = await response.json();
                if (response.ok && data.success) {
                    modalOverlay.classList.remove('active');
                    showToast('Đơn khiếu nại của bạn đã được gửi thành công! Mã khiếu nại: ' + data.appealId);
                    supportForm.reset();

                    // Cập nhật lại tiêu đề mặc định sau khi reset form
                    if (savedBlockId) {
                        const subjectElem = document.getElementById('supportSubject');
                        if (subjectElem) {
                            subjectElem.value = `Khiếu nại mở khóa tài khoản #${savedBlockId}`;
                        }
                    }
                } else {
                    alert(data.message || "Không thể gửi đơn khiếu nại!");
                }
            } catch (error) {
                console.error("Lỗi khi gửi khiếu nại:", error);
                alert("Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại API!");
            }
        });
    }
});

// Toast Helper Function
function showToast(message) {
    let toast = document.querySelector('.toast-notification');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span class="toast-message"></span>
        `;
        document.body.appendChild(toast);
    }

    toast.querySelector('.toast-message').textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

// Keyframe CSS for spin animation
const styleSheet = document.createElement("style");
styleSheet.innerText = `
@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}
`;
document.head.appendChild(styleSheet);
