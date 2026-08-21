document.addEventListener('DOMContentLoaded', () => {
    const roleSelect = document.querySelector('#roleSelect');
    const shopGroup = document.querySelector('#shopGroup');
    const registerForm = document.querySelector('#registerForm');
    
    // Đảm bảo URL này khớp với port Backend của bạn đang chạy
    const API_URL = `${window.location.origin}/api/DangKy/register`;

  
 

    // 2. Xử lý Submit Form (Chỉ dùng 1 lần addEventListener)
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Ngăn trang tự load lại

            // Lấy dữ liệu an toàn
            const role = roleSelect.value;
            const fullName = document.querySelector('#fullName').value.trim();
            const username = document.querySelector('#username').value.trim();
            const email = document.querySelector('#email').value.trim();
            const password = document.querySelector('#password').value;
            const confirmPassword = document.querySelector('#confirmPassword').value;
     
            
            // Xử lý an toàn cho Phone (trường hợp id="phone" bị thiếu hoặc lỗi)
            const phoneInput = document.querySelector('#phone');
            const phone = phoneInput ? phoneInput.value.trim() : "";

        
            const addressInput = document.getElementById("Address");
            const address = addressInput ? addressInput.value.trim() : "";

            // Validate mật khẩu
            if (password !== confirmPassword) {
                alert('Mật khẩu xác nhận không khớp! Vui lòng kiểm tra lại.');
                return;
            }

            // Chuẩn bị Dữ liệu gửi đi (Payload)
            const requestData = {
                Role: role,
                FullName: fullName,
                Username: username,
                Phone: phone,
                Email: email,
                Password: password,
                Address: address
            };

            try {
                // Đổi trạng thái UI báo hiệu đang xử lý
                const submitBtn = document.querySelector(".btn-submit");
                if (submitBtn) {
                    submitBtn.innerText = "ĐANG XỬ LÝ...";
                    submitBtn.disabled = true;
                }

                // Gửi request POST đến API
                const response = await fetch(API_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    body: JSON.stringify(requestData)
                });

                const responseData = await response.json();

                if (response.ok) {
                    // Thành công
                    alert(responseData.message || "Đăng ký tài khoản thành công!");
                    window.location.href = "../DangNhap/index.html"; 
                } else {
                    // Lỗi từ BE (Trùng username, email...)
                    alert("Lỗi: " + (responseData.message || "Đăng ký thất bại."));
                }

            } catch (error) {
                console.error("Lỗi kết nối:", error);
                alert("Không thể kết nối đến máy chủ. Bạn nhớ kiểm tra xem Backend (cổng 30001) đã chạy chưa nhé!");
            } finally {
                // Khôi phục lại nút bấm
                const submitBtn = document.querySelector(".btn-submit");
                if (submitBtn) {
                    submitBtn.innerText = "ĐĂNG KÝ TÀI KHOẢN";
                    submitBtn.disabled = false;
                }
            }
        });
    }
});