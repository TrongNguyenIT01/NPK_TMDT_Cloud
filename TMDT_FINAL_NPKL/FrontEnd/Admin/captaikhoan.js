// Đợi cho HTML load xong toàn bộ rồi mới gán sự kiện
document.addEventListener("DOMContentLoaded", function () {
    const grantAccountForm = document.getElementById("grantAccountForm");
    const toggleGrantPasswordBtn = document.getElementById("toggleGrantPassword");
    const grantPasswordInput = document.getElementById("grantPassword");

    // Xử lý ẩn/hiện mật khẩu
    if (toggleGrantPasswordBtn && grantPasswordInput) {
        toggleGrantPasswordBtn.addEventListener("click", function () {
            const type = grantPasswordInput.getAttribute("type") === "password" ? "text" : "password";
            grantPasswordInput.setAttribute("type", type);
        });
    }

    // Kiểm tra xem form có tồn tại trên trang không
    if (grantAccountForm) {
        grantAccountForm.addEventListener("submit", async function (event) {
            // 1. Chặn hành vi reload trang mặc định khi bấm submit của Form HTML
            event.preventDefault(); 

        
            const requestData = {
                fullName: document.getElementById("grantFullName").value.trim(),
                username: document.getElementById("grantUsername").value.trim(),
                email: document.getElementById("grantEmail").value.trim(),
                phone: document.getElementById("grantPhone").value.trim(),
                address: document.getElementById("grantAddress") ? document.getElementById("grantAddress").value.trim() : "",
                role: document.getElementById("grantRole").value,
                status: document.getElementById("grantStatus").value,
                password: grantPasswordInput.value
            };

            // 3. Lấy Token đã lưu trong bộ nhớ (Nhớ dùng đúng tên key của anh nhé)
            const token = localStorage.getItem("jwtToken"); 

            // Nếu không có token thì chặn luôn từ Frontend
            if (!token) {
                alert("Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn!");
                window.location.href = "../DangNhap/index.html"; 
                return;
            }

            try {
                // 4. Gọi API bằng fetch
                // Lưu ý: Thay đổi domain và cổng (localhost:xxxx) cho đúng với Backend của anh
                const apiUrl = "https://localhost:3001/api/CapTaiKhoan/CapTK"; 

                const response = await fetch(apiUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        // Đây là dòng quan trọng nhất để vượt qua [Authorize(Roles = "ADMIN")]
                        "Authorization": `Bearer ${token}` 
                    },
                    body: JSON.stringify(requestData)
                });

                // 5. Đọc kết quả từ Backend trả về
                const data = await response.json();

                // 6. Xử lý logic hiển thị thông báo
                if (response.ok) {
                    // Trạng thái 200 OK -> Thành công
                    alert(data.message || "Cấp tài khoản thành công!");
                    grantAccountForm.reset(); // Xóa trắng form để chuẩn bị nhập người tiếp theo
                } else {
                    // Xử lý các mã lỗi cụ thể
                    if (response.status === 403) {
                        alert("Lỗi 403: Tài khoản của bạn không có quyền Admin để thực hiện việc này!");
                    } else if (response.status === 401) {
                        alert("Lỗi 401: Token không hợp lệ hoặc đã hết hạn, vui lòng đăng nhập lại!");
                    } else {
                        // Lỗi 400 (Trùng username, email...) hoặc 500 (Lỗi server)
                        alert("Thất bại: " + (data.message || "Đã xảy ra lỗi, vui lòng kiểm tra lại."));
                    }
                }
            } catch (error) {
                console.error("Lỗi kết nối API:", error);
                alert("Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại mạng hoặc Backend đang tắt.");
            }
        });
    }
});