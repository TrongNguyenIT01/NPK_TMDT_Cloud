document.addEventListener("DOMContentLoaded", () => {

    const baseUrl = "https://localhost:3001";
    const catForm = document.getElementById("catForm");
    const catModal = document.getElementById("catModal");
    const closeCatModal = document.getElementById("closeCatModal");
    const addCatBtn = document.getElementById("addCatBtn");
    const catTableBody = document.getElementById("catTableBody");

    // ==========================================
    // 2. HÀM TẢI & HIỂN THỊ DANH SÁCH
    // ==========================================
    async function loadCategories() {
        try {
            const response = await fetch(`${baseUrl}/api/DoanhMuc/getDM`);
            if (!response.ok) throw new Error("Lỗi tải danh mục");

            const categories = await response.json();
            catTableBody.innerHTML = ''; // Xóa sạch bảng trước khi đổ dữ liệu mới

            categories.forEach(cat => {
                const date = new Date(cat.createdAt).toLocaleDateString('vi-VN');
                const desc = cat.description ? cat.description : 'Chưa có mô tả';

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${cat.categoryId}</strong></td>
                    <td><strong>${cat.categoryName}</strong></td>
                    <td>${desc}</td>
                    <td>0 SP</td> <!-- Kết nối số lượng Sản phẩm sau -->
                    <td>${date}</td>
                    <td>
                        <button class="btn-tb primary btn-edit-cat" 
                            data-id="${cat.categoryId}" 
                            data-name="${cat.categoryName}" 
                            data-desc="${desc}">
                            Sửa
                        </button>
                    </td>
                `;
                catTableBody.appendChild(tr);
            });

            // Sau khi vẽ HTML xong, gắn sự kiện click cho các nút "Sửa" vừa tạo
            attachEditEvents();
        } catch (error) {
            console.error("Lỗi:", error);
            catTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red;">Không thể tải dữ liệu danh mục</td></tr>';
        }
    }

    // ==========================================
    // 3. XỬ LÝ SỰ KIỆN NÚT "SỬA"
    // ==========================================
    function attachEditEvents() {
        const editBtns = document.querySelectorAll('.btn-edit-cat');
        
        editBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const name = btn.getAttribute('data-name');
                const desc = btn.getAttribute('data-desc');

                // Bơm dữ liệu vào form
                document.getElementById('catIdInput').value = id;
                document.getElementById('catNameInput').value = name;
                document.getElementById('catDescInput').value = desc === 'Chưa có mô tả' ? '' : desc;

                // Đổi tiêu đề Modal
                document.querySelector('#catModal h3').innerText = "Cập Nhật Danh Mục";
                catModal.style.display = 'flex'; 
            });
        });
    }

    // ==========================================
    // 4. XỬ LÝ SỰ KIỆN NÚT "THÊM DANH MỤC MỚI"
    // ==========================================
    if (addCatBtn) {
        addCatBtn.addEventListener('click', () => {
            catForm.reset();
            document.getElementById('catIdInput').value = ""; // Xóa ID để chuyển sang mode Thêm mới
            document.querySelector('#catModal h3').innerText = "Thêm Danh Mục Sản Phẩm Mới";
            catModal.style.display = 'flex'; 
        });
    }

    // ==========================================
    // 5. XỬ LÝ SỰ KIỆN ĐÓNG MODAL
    // ==========================================
    closeCatModal.addEventListener("click", (e) => {
        e.preventDefault();
        catModal.style.display = "none";
    });

    // ==========================================
    // 6. XỬ LÝ SUBMIT FORM (THÊM / CẬP NHẬT)
    // ==========================================
    catForm.addEventListener("submit", async (e) => {
        e.preventDefault(); 

        const categoryId = document.getElementById("catIdInput").value.trim();
        const categoryName = document.getElementById("catNameInput").value.trim();
        const description = document.getElementById("catDescInput").value.trim();

        if (!categoryName) {
            alert("Vui lòng nhập tên danh mục!");
            return;
        }

        const requestData = {
            categoryName: categoryName,
            description: description
        };

        let fetchUrl = "";
        let fetchMethod = "";

        if (categoryId === "") {
            fetchUrl = `${baseUrl}/api/DoanhMuc/DoanhMuc`; 
            fetchMethod = "POST";
        } else {
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
                
                catForm.reset();
                document.getElementById("catIdInput").value = ""; 
                catModal.style.display = "none";

                // 👉 GỌI LẠI HÀM NÀY ĐỂ TỰ ĐỘNG CẬP NHẬT BẢNG MÀ KHÔNG CẦN F5
                loadCategories();
            } else {
                const errorText = await response.text();
                alert(`Thất bại: ${errorText}`);
            }
        } catch (error) {
            console.error("Lỗi gọi API Doanh Mục:", error);
            alert("Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại backend!");
        }
    });

  
    loadCategories();
});