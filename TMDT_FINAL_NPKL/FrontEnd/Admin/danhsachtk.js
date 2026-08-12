document.addEventListener("DOMContentLoaded", function () {
    // Gọi hàm load dữ liệu ngay khi trang web vừa tải xong
    loadGrantedUsers();
});

async function loadGrantedUsers() {
    // Lấy Token của Admin (Nhớ khớp tên key anh đang lưu nhé)
    const token = localStorage.getItem("jwtToken"); 
    
    if (!token) {
        alert("Bạn chưa đăng nhập hoặc không có quyền truy cập!");
        return;
    }

    try {
        // Đường dẫn API (Nhớ kiểm tra lại cổng localhost của anh)
        const apiUrl = "https://localhost:3001/api/CapTaiKhoan/DanhSach";
        
        const response = await fetch(apiUrl, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`, // Vé vào cửa cho API [Authorize]
                "Content-Type": "application/json"
            }
        });

        const result = await response.json();

        if (response.ok && result.success) {
            // Nếu gọi thành công, chuyển dữ liệu qua hàm vẽ bảng
            renderUserTable(result.data);
        } else {
            console.error("Lỗi từ server:", result.message);
        }
    } catch (error) {
        console.error("Lỗi kết nối API:", error);
    }
}

// Hàm nhận danh sách Users và vẽ ra giao diện
function renderUserTable(users) {
    const tbody = document.getElementById("grantedUserTableBody");
    tbody.innerHTML = ""; // Xóa sạch dữ liệu mẫu tĩnh (HTML cứng) cũ đi

    users.forEach(user => {
        // 1. Map dữ liệu Vai trò thành tiếng Việt và Class màu sắc
        let roleName = "";
        let roleClass = "";
        if (user.role === "ADMIN") {
            roleName = "Quản Trị Viên";
            roleClass = "banned"; 
        } else if (user.role === "SELLER") {
            roleName = "Người Bán";
            roleClass = "shipping";
        } else {
            roleName = "Khách Hàng";
            roleClass = "shipping";
        }

        // 2. Map dữ liệu Trạng thái
        let statusName = user.status === "ACTIVE" ? "Hoạt Động" : "Đã Khóa";
        let statusClass = user.status === "ACTIVE" ? "active" : "banned"; 

        // 3. Xử lý logic nút Thao tác (Khóa / Mở Khóa)
        let actionHtml = "";
        const currentUsername = localStorage.getItem("userName"); // Tên tài khoản đang dùng

        // Tránh việc Admin tự khóa chính mình hoặc khóa tài khoản gốc hệ thống
        if (user.username === currentUsername || user.userId === "AD0001") {
            actionHtml = `<span style="color:#64748B; font-size:0.8rem;">Hệ thống</span>`;
        } else if (user.status === "ACTIVE") {
            // Nhúng ID của user vào data-id để sau này làm chức năng click Khóa
            actionHtml = `<div class="btn-action-group">
                              <button class="btn-tb block btn-user-action" data-id="${user.userId}" data-action="BLOCKED">Khóa</button>
                          </div>`;
        } else if (user.status === "BLOCKED") {
            // Nhúng ID của user vào data-id để sau này làm chức năng click Mở Khóa
            actionHtml = `<div class="btn-action-group">
                              <button class="btn-tb primary btn-user-action" data-id="${user.userId}" data-action="ACTIVE" style="background-color: #10B981;">Mở Khóa</button>
                          </div>`;
        }

        // 4. Tạo dòng (row) và nhét vào bảng
        const tr = document.createElement("tr");
        tr.setAttribute("data-role", user.role);
        tr.setAttribute("data-status", user.status);

        tr.innerHTML = `
            <td><strong>${user.userId}</strong></td>
            <td class="user-name-cell">${user.fullName}</td>
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td>${user.phone || "Đang cập nhật"}</td>
            <td><span class="badge-status ${roleClass}">${roleName}</span></td>
            <td class="status-cell"><span class="badge-status ${statusClass}">${statusName}</span></td>
            <td>${actionHtml}</td>
        `;

        tbody.appendChild(tr);
    });
}