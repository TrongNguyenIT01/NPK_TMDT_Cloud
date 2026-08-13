document.addEventListener("DOMContentLoaded", () => {
    const catForm = document.getElementById("catForm");
    const catModal = document.getElementById("catModal");
    const closeCatModal = document.getElementById("closeCatModal");

    // Khai báo đường dẫn gốc của Backend (chạy HTTPS port 3001)
    const baseUrl = "https://localhost:3001";

    // 1. Đóng Modal
    closeCatModal.addEventListener("click", (e) => {
        e.preventDefault();
        catModal.style.display = "none";
    });

    // 2. Xử lý Submit (Thêm mới hoặc Cập nhật)
    catForm.addEventListener("submit", async (e) => {
        e.preventDefault(); 

        // Lấy dữ liệu từ các input (bao gồm cả ID ẩn)
        const categoryId = document.getElementById("catIdInput").value.trim();
        const categoryName = document.getElementById("catNameInput").value.trim();
        const description = document.getElementById("catDescInput").value.trim();

        if (!categoryName) {
            alert("Vui lòng nhập tên danh mục!");
            return;
        }

        // Tạo cục dữ liệu gửi đi
        const requestData = {
            categoryName: categoryName,
            description: description
        };


        let fetchUrl = "";
        let fetchMethod = "";

        if (categoryId === "") {
            // TRƯỜNG HỢP 1: THÊM MỚI (ID rỗng)
            // Khớp với [Route("api/[controller]")] và [HttpPost("DoanhMuc")]
            fetchUrl = `${baseUrl}/api/DoanhMuc/DoanhMuc`; 
            fetchMethod = "POST";
        } else {
            // TRƯỜNG HỢP 2: CẬP NHẬT (Có ID)
            // Khớp với [Route("api/[controller]")] và [HttpPut("{id}")]
            fetchUrl = `${baseUrl}/api/DoanhMuc/${categoryId}`;
            fetchMethod = "PUT";
        }

        try {
            const response = await fetch(fetchUrl, {
                method: fetchMethod,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(requestData)
            });

            if (response.ok) {
                const result = await response.json();
                alert(result.message || "Thao tác thành công!");
                
                // Reset form và xóa trắng luôn cả thẻ hidden ID
                catForm.reset();
                document.getElementById("catIdInput").value = ""; 
                catModal.style.display = "none";
            } else {
                const errorText = await response.text();
                alert(`Thất bại: ${errorText}`);
            }
        } catch (error) {
            console.error("Lỗi gọi API Doanh Mục:", error);
            alert("Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại backend!");
        }
    });
});