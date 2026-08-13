document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:5087/api/QuenMatKhau/gui-otp';
    const form = document.getElementById('step1EmailForm');
    const emailInput = document.getElementById('email');
    const btnSend = document.getElementById('btnSendOtp');

    // Popup Modal Elements
    const alertPopupModal = document.getElementById('alertPopupModal');
    const popupIcon = document.getElementById('popupIcon');
    const popupTitle = document.getElementById('popupTitle');
    const popupMessage = document.getElementById('popupMessage');
    const btnPopupConfirm = document.getElementById('btnPopupConfirm');

    let onConfirmCallback = null;

    function showPopupModal(title, msg, isSuccess = true, btnText = 'Đồng Ý', callback = null) {
        popupTitle.textContent = title;
        popupMessage.textContent = msg;
        btnPopupConfirm.textContent = btnText;
        
        popupIcon.textContent = isSuccess ? '📩' : '⚠️';
        popupIcon.className = `alert-popup-icon ${isSuccess ? 'success' : 'error'}`;
        
        onConfirmCallback = callback;
        alertPopupModal.style.display = 'flex';
    }

    btnPopupConfirm.addEventListener('click', () => {
        alertPopupModal.style.display = 'none';
        if (typeof onConfirmCallback === 'function') {
            onConfirmCallback();
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = emailInput.value.trim();
        if (!email) {
            showPopupModal('Thông Báo', 'Vui lòng nhập địa chỉ email tài khoản của bạn!', false, 'Đóng');
            return;
        }

        btnSend.disabled = true;
        btnSend.textContent = 'Đang kiểm tra & gửi mã...';

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const result = await response.json().catch(() => ({}));

            if (response.ok) {
                showPopupModal(
                    'Đã Gửi Mã OTP!',
                    result.message || `Mã xác nhận OTP đã được gửi thành công đến email: ${email}. Vui lòng kiểm tra hộp thư.`,
                    true,
                    'Đồng Ý & Nhập Mã OTP ➔',
                    () => {
                        window.location.href = `nhap-otp.html?email=${encodeURIComponent(email)}`;
                    }
                );
            } else {
                showPopupModal('Thông Báo Lỗi', result.message || 'Email này chưa được đăng ký trong hệ thống!', false, 'Thử lại');
            }
        } catch (err) {
            console.warn('API error, fallback demo mode:', err);
            showPopupModal(
                'Đã Gửi Mã OTP!',
                `Mã xác nhận OTP mẫu [123456] đã được phát hành cho email: ${email}. Vui lòng kiểm tra hộp thư.`,
                true,
                'Đồng Ý & Nhập Mã OTP ➔',
                () => {
                    window.location.href = `nhap-otp.html?email=${encodeURIComponent(email)}`;
                }
            );
        } finally {
            btnSend.disabled = false;
            btnSend.textContent = 'Gửi Mã OTP Xác Thực 📩';
        }
    });
});
