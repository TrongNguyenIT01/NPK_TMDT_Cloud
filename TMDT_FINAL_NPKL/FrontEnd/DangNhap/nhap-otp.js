document.addEventListener('DOMContentLoaded', () => {
    const API_RESEND_URL = 'https://localhost:3001/api/QuenMatKhau/gui-otp';
    const form = document.getElementById('otpForm');
    const otpInput = document.getElementById('otp');
    const displayEmail = document.getElementById('displayEmail');
    const btnResend = document.getElementById('btnResend');
    const countdownText = document.getElementById('countdownText');

    // Popup Modal Elements
    const alertPopupModal = document.getElementById('alertPopupModal');
    const popupIcon = document.getElementById('popupIcon');
    const popupTitle = document.getElementById('popupTitle');
    const popupMessage = document.getElementById('popupMessage');
    const btnPopupConfirm = document.getElementById('btnPopupConfirm');

    let onConfirmCallback = null;

    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email') || '';
    
    if (email) {
        displayEmail.textContent = email;
    } else {
        alert('Không tìm thấy thông tin email. Vui lòng thực hiện lại từ bước 1!');
        window.location.href = 'quen-mat-khau.html';
        return;
    }

    function showPopupModal(title, msg, isSuccess = true, btnText = 'Đồng Ý', callback = null) {
        popupTitle.textContent = title;
        popupMessage.textContent = msg;
        btnPopupConfirm.textContent = btnText;
        
        popupIcon.textContent = isSuccess ? '🔑' : '⚠️';
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

    // Countdown 60s
    let timerInterval = null;
    function startCountdown(seconds = 60) {
        let remaining = seconds;
        btnResend.disabled = true;
        countdownText.textContent = `(${remaining}s)`;

        if (timerInterval) clearInterval(timerInterval);

        timerInterval = setInterval(() => {
            remaining--;
            if (remaining > 0) {
                countdownText.textContent = `(${remaining}s)`;
            } else {
                clearInterval(timerInterval);
                btnResend.disabled = false;
                countdownText.textContent = '';
            }
        }, 1000);
    }

    startCountdown(60);

    btnResend.addEventListener('click', async () => {
        if (!email) return;

        try {
            btnResend.disabled = true;
            const res = await fetch(API_RESEND_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ Email: email })
            });

            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                showPopupModal('Đã Gửi Lại Mã!', data.message || data.Message || 'Mã OTP mới đã được gửi thành công đến email của bạn.', true, 'Đóng');
                startCountdown(60);
            } else {
                showPopupModal('Thông Báo Lỗi', data.message || data.Message || 'Lỗi gửi lại mã OTP!', false, 'Thử lại');
                btnResend.disabled = false;
            }
        } catch (err) {
            console.error('Lỗi gửi lại OTP:', err);
            showPopupModal('Lỗi Kết Nối', 'Không thể kết nối đến máy chủ Backend (https://localhost:3001)!', false, 'Đóng');
            btnResend.disabled = false;
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const otpVal = otpInput.value.trim();
        if (!otpVal || otpVal.length !== 6) {
            showPopupModal('Thông Báo Lỗi', 'Mã OTP phải gồm đúng 6 chữ số!', false, 'Nhập lại');
            return;
        }

        showPopupModal(
            'Xác Nhận Thành Công!',
            'Mã OTP hợp lệ. Vui lòng bấm Tiếp Tục để thiết lập mật khẩu mới.',
            true,
            'Tiếp Tục Đặt Mật Khẩu Mới ➔',
            () => {
                window.location.href = `dat-lai-mat-khau.html?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otpVal)}`;
            }
        );
    });
});
