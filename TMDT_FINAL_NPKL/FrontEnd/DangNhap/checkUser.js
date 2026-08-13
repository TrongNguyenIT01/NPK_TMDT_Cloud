document.addEventListener("DOMContentLoaded", function(){
    const fullName = sessionStorage.getItem('fullName') || 'Unknown';
    const role = sessionStorage.getItem("userRole") || localStorage.getItem("userRole"); 
    document.getElementById('fullname').textContent = fullName;
    document.getElementById('role').textContent = role;
});

function checkAccessRight() {
    // 1. Lấy thông tin từ sessionStorage hoặc localStorage
    const token = sessionStorage.getItem("jwtToken") || localStorage.getItem("jwtToken");
    const role = sessionStorage.getItem("userRole") || localStorage.getItem("userRole"); 


    // Lấy đường dẫn hiện tại của trình duyệt để biết người dùng đang ở trang nào
    const currentPath = window.location.pathname.toLowerCase();

    // 2. KIỂM TRA ĐĂNG NHẬP: Nếu chưa có token thì đẩy hết về trang đăng nhập
    if (!token || !role) {
        // Tùy chỉnh đường dẫn này trỏ đúng về trang Login của anh
        window.location.href = "../DangNhap/index.html"; 
        return; 
    }

    // 3. KIỂM TRA PHÂN QUYỀN (Dựa vào Role)
    // Giả sử Role của anh lưu là "ADMIN", "SELLER", "USER" (Anh nhớ đổi lại cho khớp với database nhé)

    if (role.toUpperCase() === "ADMIN") {
        // Nếu là Admin, nhưng lại đang đi lạc vào thư mục Seller hoặc FrontEnd/User
        if (currentPath.includes("/seller/") || currentPath.includes("/frontend/user/")) {
   
            window.location.href = "/Admin/index.html";
        }
    } 
    else if (role.toUpperCase() === "SELLER") {
        // Nếu là Seller, nhưng lại cố tình mò vào thư mục Admin
        if (currentPath.includes("/admin/")) {
            // Ép quay xe về nhà của Seller
            window.location.href = "../Seller/index.html";
        }
    }
    else {
        // Trờng hợp còn lại (Khách hàng/User thường)
        // Nếu mò vào Admin hoặc Seller thì đẩy ra trang chủ
        if (currentPath.includes("/admin/") || currentPath.includes("/seller/")) {
            window.location.href = "/FrontEnd/index.html";
        }
    }
}

// Gọi hàm ngay lập tức
checkAccessRight();