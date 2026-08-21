document.addEventListener('DOMContentLoaded', () => {
    const API_URL = `${window.location.origin}/api/QuenMatKhau/dat-lai-mat-khau`;
    const form = document.getElementById('resetForm');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const btnSubmit = document.getElementById('btnSubmitReset');

    // Popup Modal Elements
    const alertPopupModal = document.getElementById('alertPopupModal');
    const popupIcon = document.getElementById('popupIcon');
    const popupTitle = document.getElementById('popupTitle');
    const popupMessage = document.getElementById('popupMessage');
    const btnPopupConfirm = document.getElementById('btnPopupConfirm');

    const toggleNewPasswordBtn = document.getElementById('toggleNewPassword');
    const toggleConfirmPasswordBtn = document.getElementById('toggleConfirmPassword');

    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email') || '';
    const otp = urlParams.get('otp') || '';

    if (!email || !otp) {
        alert('Thông tin xác thực không đầy đủ. Vui lòng thực hiện lại quy trình quên mật khẩu!');
        window.location.href = 'quen-mat-khau.html';
        return;
    }

    let onConfirmCallback = null;

    function showPopupModal(title, msg, isSuccess = true, btnText = 'Đồng Ý', callback = null) {
        popupTitle.textContent = title;
        popupMessage.textContent = msg;
        btnPopupConfirm.textContent = btnText;
        
        popupIcon.textContent = isSuccess ? '🎉' : '⚠️';
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

    function setupEyeToggle(inputElem, btnElem) {
        if (!inputElem || !btnElem) return;
        btnElem.addEventListener('click', () => {
            const isPassword = inputElem.type === 'password';
            inputElem.type = isPassword ? 'text' : 'password';
            btnElem.innerHTML = isPassword
                ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                   </svg>`
                : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                   </svg>`;
        });
    }

    setupEyeToggle(newPasswordInput, toggleNewPasswordBtn);
    setupEyeToggle(confirmPasswordInput, toggleConfirmPasswordBtn);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const newPassword = newPasswordInput.value.trim();
        const confirmPassword = confirmPasswordInput.value.trim();

        if (newPassword.length < 8) {
            showPopupModal('Thông Báo Lỗi', 'Mật khẩu mới phải có tối thiểu 8 ký tự!', false, 'Nhập lại');
            return;
        }

        if (newPassword !== confirmPassword) {
            showPopupModal('Thông Báo Lỗi', 'Mật khẩu xác nhận không khớp với mật khẩu mới!', false, 'Nhập lại');
            return;
        }

        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Đang đổi mật khẩu...';

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    Email: email,
                    Otp: otp,
                    NewPassword: newPassword,
                    ConfirmPassword: confirmPassword
                })
            });

            const result = await response.json().catch(() => ({}));

            if (response.ok) {
                showPopupModal(
                    'Đổi Mật Khẩu Thành Công!',
                    result.message || result.Message || '🎉 Bạn đã đặt lại mật khẩu mới thành công! Hãy đăng nhập lại bằng mật khẩu mới vừa tạo.',
                    true,
                    'Đăng Nhập Ngay ➔',
                    () => {
                        window.location.href = 'index.html';
                    }
                );
            } else {
                showPopupModal(
                    'Thông Báo Lỗi',
                    result.message || result.Message || 'Mã OTP không chính xác hoặc đã hết hiệu lực (10 phút)!',
                    false,
                    'Thử lại'
                );
            }
        } catch (err) {
            console.error('Lỗi kết nối API đặt lại mật khẩu:', err);
            showPopupModal(
                'Lỗi Kết Nối',
                'Không thể kết nối đến máy chủ Backend. Vui lòng thử lại sau!',
                false,
                'Đóng'
            );
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.textContent = 'Hoàn Tất Đổi Mật Khẩu 🔒';
        }
    });
});
