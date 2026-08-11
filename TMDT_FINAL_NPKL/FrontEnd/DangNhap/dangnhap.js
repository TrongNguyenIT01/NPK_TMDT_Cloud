document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("loginForm");
    
    // 1. Xử lý sự kiện khi bấm nút ĐĂNG NHẬP
    loginForm.addEventListener("submit", async function (e) {
        e.preventDefault(); // Ngăn chặn hành vi tải lại trang mặc định của form

        const usernameInput = document.getElementById("username").value;
        const passwordInput = document.getElementById("password").value;

        try {
      
            const apiUrl = "https://localhost:3001/api/DangNhap/login"; 
            
            const response = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    Username: usernameInput,
                    Password: passwordInput
                })
            });

            // Nếu Backend trả về lỗi 400 (Sai mật khẩu, không tìm thấy tài khoản)
            if (!response.ok && response.status === 400) {
                const errorData = await response.json();
                alert(errorData.message);
                return;
            }

            // Xử lý dữ liệu trả về từ Ok(...)
            const data = await response.json();

            if (data.success) {
                // TRƯỜNG HỢP: Đăng nhập thành công
                // Lưu Token và Role vào Local Storage để dùng cho việc gọi API sau này
                localStorage.setItem("jwtToken", data.token);
                localStorage.setItem("userRole", data.role);

                // Chuyển hướng đến Dashboard (Admin/Seller/Home)
                window.location.href = data.redirectUrl;
            } else {
                // TRƯỜNG HỢP: Đăng nhập thất bại do Status (Pending, Blocked, Rejected)
                if (data.redirectUrl) {
                    sessionStorage.setItem("tempUsername", data.username);
                    sessionStorage.setItem("tempRole", data.role);
                    sessionStorage.setItem("tempEmail", data.email);
                    if (data.blockId) {
                        sessionStorage.setItem("tempBlockId", data.blockId);
                    }
                    if (data.blockReason) {
                        sessionStorage.setItem("tempBlockReason", data.blockReason);
                    }
                    window.location.href = data.redirectUrl;
                } else {
                    alert(data.message);
                }
            }
        } catch (error) {
            console.error("Lỗi kết nối:", error);
            alert("Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại API!");
        }
    });

    // 2. Xử lý tính năng Hiện/Ẩn mật khẩu (dựa trên các class trong HTML của bạn)
    const togglePasswordBtn = document.getElementById("togglePassword");
    const passwordField = document.getElementById("password");

    togglePasswordBtn.addEventListener("click", function () {
        // Đổi type của input giữa 'password' và 'text'
        const type = passwordField.getAttribute("type") === "password" ? "text" : "password";
        passwordField.setAttribute("type", type);
    });
});