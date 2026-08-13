async function fetchDashboardMetrics() {
        try {
            // Gọi đến đường dẫn API trong DashboardController
            const response = await fetch('https://localhost:3001/api/dashboard/dashboard-metrics'); 
            
            // Kiểm tra nếu lỗi (ví dụ 404, 500)
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Chuyển đổi dữ liệu trả về sang JSON
            const data = await response.json(); 

            // 1. Cập nhật số liệu Người dùng
            document.getElementById('total-user').innerText = data.totalUsers;
            document.getElementById('pending-user').innerText = `chưa duyệt: ${data.pendingUsers} tài khoản`;

            // 2. Cập nhật số liệu Cửa hàng
            document.getElementById('total-shop').innerText = data.activeShops;

            // 3. Cập nhật số liệu Sản phẩm
            document.getElementById('total-item').innerText = data.totalProducts;
            document.getElementById('pending-item').innerText = `${data.pendingProducts} Chờ duyệt`;

        } catch (error) {
            console.error("Lỗi khi tải số liệu Dashboard:", error);
            // Nếu lỗi, có thể cho hiển thị chữ 'Lỗi' hoặc '---' để giao diện không bị trống
            document.getElementById('total-user').innerText = "Lỗi";
            document.getElementById('total-shop').innerText = "Lỗi";
            document.getElementById('total-item').innerText = "Lỗi";
        }
    }

    // Tự động chạy hàm fetchDashboardMetrics ngay khi tải xong giao diện web
    document.addEventListener("DOMContentLoaded", () => {
        fetchDashboardMetrics();
    });