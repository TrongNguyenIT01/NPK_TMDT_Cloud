// Xử lý xem trước ảnh chọn từ máy tính
document.addEventListener('DOMContentLoaded', () => {
    const mainImgFileInput = document.getElementById('prodMainImgFile');
    const mainImgPreview = document.getElementById('mainImgPreview');
    const mainImgFileName = document.getElementById('mainImgFileName');

    const detailImgsFileInput = document.getElementById('prodDetailImgsFile');
    const detailImgsPreviewGallery = document.getElementById('detailImgsPreviewGallery');
    const detailImgsCount = document.getElementById('detailImgsCount');

    // 1. Xử lý ảnh đại diện
    if (mainImgFileInput) {
        mainImgFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (evt) => {
                    mainImgPreview.src = evt.target.result;
                    if (mainImgFileName) {
                        mainImgFileName.textContent = `Tệp đã chọn: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
                        mainImgFileName.style.color = '#16A34A';
                        mainImgFileName.style.fontWeight = '600';
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // 2. Xử lý bộ ảnh chi tiết (Nhiều ảnh)
    if (detailImgsFileInput) {
        detailImgsFileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            detailImgsPreviewGallery.innerHTML = '';

            if (files.length === 0) {
                detailImgsCount.textContent = '0';
                detailImgsPreviewGallery.innerHTML = '<span style="font-size: 0.82rem; color: #94A3B8; font-style: italic;">Chưa chọn tệp ảnh chi tiết nào.</span>';
                return;
            }

            detailImgsCount.textContent = files.length;

            files.forEach((file, index) => {
                const reader = new FileReader();
                reader.onload = (evt) => {
                    const imgThumb = document.createElement('div');
                    imgThumb.style.position = 'relative';
                    imgThumb.style.display = 'inline-block';
                    imgThumb.innerHTML = `
                        <img src="${evt.target.result}" style="width: 75px; height: 75px; object-fit: cover; border-radius: 8px; border: 2px solid #0B2238;" title="${file.name}" />
                        <span style="position: absolute; bottom: 2px; right: 2px; background: rgba(11,34,56,0.8); color: #fff; font-size: 0.65rem; padding: 1px 4px; border-radius: 4px;">${index + 1}</span>
                    `;
                    detailImgsPreviewGallery.appendChild(imgThumb);
                };
                reader.readAsDataURL(file);
            });
        });
    }

    // 3. Xử lý submit form gọi API
    const newProductForm = document.getElementById('newProductForm');
    if (newProductForm) {
        newProductForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Lấy token từ localStorage
            const token = localStorage.getItem('jwtToken');
            if (!token) {
                alert('Bạn cần đăng nhập bằng tài khoản Seller để thực hiện chức năng này.');
                window.location.href = '../DangNhap/index.html';
                return;
            }

            // Lấy dữ liệu từ form
            const formData = new FormData();
            formData.append('CategoryId', document.getElementById('prodCategory').value);
            formData.append('ProductName', document.getElementById('prodName').value);

            const description = document.getElementById('prodDescription').value;
            if (description) formData.append('Description', description);

            formData.append('Price', document.getElementById('prodPrice').value);
            formData.append('StockQuantity', document.getElementById('prodStock').value);

            // Lấy file ảnh đại diện
            const mainImageFile = document.getElementById('prodMainImgFile').files[0];
            if (mainImageFile) formData.append('MainImage', mainImageFile);

            // Lấy các file ảnh chi tiết
            const detailImagesFiles = document.getElementById('prodDetailImgsFile').files;
            for (let i = 0; i < detailImagesFiles.length; i++) {
                formData.append('DetailImages', detailImagesFiles[i]);
            }

            // Gọi API
            try {
                const response = await fetch('https://localhost:3001/api/SanPham/add-product', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    alert('Đăng sản phẩm thành công! ' + result.message);
                    newProductForm.reset();
                    // Reset preview
                    if (mainImgPreview) mainImgPreview.src = '../TrangChinh/images/dac_nhan_tam.jpg';
                    if (mainImgFileName) {
                        mainImgFileName.textContent = 'Chưa chọn tệp ảnh đại diện mới';
                        mainImgFileName.style.color = '#64748B';
                        mainImgFileName.style.fontWeight = 'normal';
                    }
                    if (detailImgsPreviewGallery) {
                        detailImgsPreviewGallery.innerHTML = '<span style="font-size: 0.82rem; color: #94A3B8; font-style: italic;">Chưa chọn tệp ảnh chi tiết nào.</span>';
                        detailImgsCount.textContent = '0';
                    }
                } else {
                    alert('Lỗi: ' + (result.message || 'Không thể đăng sản phẩm.'));
                }
            } catch (error) {
                console.error('Lỗi khi gọi API:', error);
                alert('Không thể kết nối đến server.');
            }
        });
    }
});
