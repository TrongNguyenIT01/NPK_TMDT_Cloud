document.addEventListener('DOMContentLoaded', function() {
    // Gọi hàm load danh mục ngay khi trang HTML load xong
    loadCategories();
});

async function loadCategories() {
    try {

        const apiUrl = 'https://localhost:3001/api/DoanhMuc/getDM'; 
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error('Lỗi khi gọi API lấy danh mục');
        }

        const categories = await response.json();
        const selectElement = document.getElementById('prodCatInput');

        // Lặp qua mảng danh mục trả về từ API
        categories.forEach(category => {
            // Tạo một thẻ <option> mới
            const option = document.createElement('option');
            
      

            option.value = category.categoryId; 
            
            // Đặt text hiển thị là Tên danh mục
            option.textContent = category.categoryName; 
            
            // Thêm option vào thẻ select
            selectElement.appendChild(option);
        });

    } catch (error) {
        console.error("Lỗi:", error);
        alert("Không thể tải danh sách danh mục lúc này!");
    }
}