document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("loginForm");
    
    // 1. Xử lý sự kiện khi bấm nút ĐĂNG NHẬP
    if (loginForm) {
        loginForm.addEventListener("submit", async function (e) {
            e.preventDefault(); // Ngăn chặn hành vi tải lại trang mặc định của form

            const usernameInput = document.getElementById("username").value.trim();
            const passwordInput = document.getElementById("password").value;

            const submitBtn = loginForm.querySelector(".btn-submit");
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerText = "ĐANG XỬ LÝ...";
            }

            try {
                const apiUrl = `${window.location.origin}/api/DangNhap/login`; 
                
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
                    alert(errorData.message || "Tài khoản hoặc mật khẩu không chính xác!");
                    return;
                }

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    alert(errorData.message || `Lỗi máy chủ (${response.status})!`);
                    return;
                }

                // Xử lý dữ liệu trả về từ Ok(...)
                const data = await response.json();

                if (data.success) {
                    // TRƯỜNG HỢP: Đăng nhập thành công
                    sessionStorage.setItem("jwtToken", data.token);
                    sessionStorage.setItem("userRole", data.role);
                    sessionStorage.setItem("userName", data.username);
                    sessionStorage.setItem("fullName", data.fullName);

                    localStorage.setItem("jwtToken", data.token);
                    localStorage.setItem("userRole", data.role);
                    localStorage.setItem("userName", data.username);
                    localStorage.setItem("fullName", data.fullName);

                    // Chuyển hướng đến Dashboard (Admin/Seller/TrangChinh)
                    let redirectTarget = data.redirectUrl;
                    if (redirectTarget.includes("Home/index.html") || redirectTarget.includes("FrontEnd/Home")) {
                        redirectTarget = "../TrangChinh/index.html";
                    }
                    window.location.href = redirectTarget;
                } else {
                    // TRƯỜNG HỢP: Đăng nhập thất bại do Status (Pending, Blocked, Rejected)
                    if (data.redirectUrl) {
                        sessionStorage.setItem("tempUsername", data.username);
                        sessionStorage.setItem("tempRole", data.role);
                        sessionStorage.setItem("tempEmail", data.email);
                        if (data.blockId) sessionStorage.setItem("tempBlockId", data.blockId);
                        if (data.blockReason) sessionStorage.setItem("tempBlockReason", data.blockReason);
                        if (data.rejectReason) sessionStorage.setItem("tempRejectReason", data.rejectReason);
                        window.location.href = data.redirectUrl;
                    } else {
                        alert(data.message || "Đăng nhập không thành công.");
                    }
                }
            } catch (error) {
                console.error("Lỗi kết nối:", error);
                alert("Không thể kết nối đến máy chủ Backend (https://localhost:3001).\nBạn hãy đảm bảo dự án C# Backend đã được Run (F5) trong Visual Studio nhé!");
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerText = "ĐĂNG NHẬP";
                }
            }
        });
    }

    // 2. Xử lý tính năng Hiện/Ẩn mật khẩu (dựa trên các class trong HTML của bạn)
    const togglePasswordBtn = document.getElementById("togglePassword");
    const passwordField = document.getElementById("password");

    togglePasswordBtn.addEventListener("click", function () {
        // Đổi type của input giữa 'password' và 'text'
        const type = passwordField.getAttribute("type") === "password" ? "text" : "password";
        passwordField.setAttribute("type", type);
    });
});