document.addEventListener('DOMContentLoaded', () => {
    // =========================================================================
    // POP-UP MODAL CHI TIẾT SẢN PHẨM & THÔNG TIN SHOP / NGUỜI BÁN & ẢNH CON
    // =========================================================================
    const productDetailModal = document.getElementById('productDetailModal');
    const closeDetailModalBtn = document.getElementById('closeDetailModalBtn');
    let currentModalProductData = null;

    if (closeDetailModalBtn && productDetailModal) {
        closeDetailModalBtn.addEventListener('click', () => {
            productDetailModal.classList.remove('active');
        });

        productDetailModal.addEventListener('click', (e) => {
            if (e.target === productDetailModal) {
                productDetailModal.classList.remove('active');
            }
        });

        // Đóng Modal khi nhấn phím ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && productDetailModal.classList.contains('active')) {
                productDetailModal.classList.remove('active');
            }
        });
    }

    function formatImgUrl(src) {
        if (!src) return 'images/default.png';
        if (src.startsWith('http://') || src.startsWith('https://')) return src;
        if (src.startsWith('/images/')) return `https://localhost:3001${src}`;
        if (src.startsWith('images/')) return src;
        return `images/${src}`;
    }

    function getStoredCart() {
        const token = sessionStorage.getItem('jwtToken') || localStorage.getItem('jwtToken');
        if (!token) return [];
        return JSON.parse(localStorage.getItem('npkl_cart_items')) || [];
    }

    function getStoredWishlist() {
        const token = sessionStorage.getItem('jwtToken') || localStorage.getItem('jwtToken');
        if (!token) return [];
        return JSON.parse(localStorage.getItem('npkl_wishlist')) || [];
    }

    function showToastMsg(msg) {
        const existingToast = document.querySelector('.toast-notification');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.textContent = msg;
        toast.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: #0B2238;
            color: #FFFFFF;
            padding: 12px 24px;
            border-radius: 10px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            font-size: 0.9rem;
            font-weight: 700;
            z-index: 99999;
            transition: all 0.3s ease;
        `;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }

    function openProductDetailModal(productId, fallbackCardData) {
        if (!productDetailModal) return;

        const titleEl = document.getElementById('modalProductTitle');
        const priceEl = document.getElementById('modalProductPrice');
        const categoryTagEl = document.getElementById('modalCategoryTag');
        const mainImgEl = document.getElementById('modalMainImage');
        const descEl = document.getElementById('modalProductDescription');
        const stockBadgeEl = document.getElementById('modalStockBadge');

        const shopNameEl = document.getElementById('modalShopName');
        const sellerNameEl = document.getElementById('modalSellerName');
        const sellerPhoneEl = document.getElementById('modalSellerPhone');
        const sellerEmailEl = document.getElementById('modalSellerEmail');
        const subImagesListEl = document.getElementById('modalSubImagesList');

        // Bật hiển thị Pop-up Modal
        productDetailModal.classList.add('active');

        // Dữ liệu mẫu chi tiết sản phẩm thuần Front-End
        let productDetail = {
            title: fallbackCardData?.title || 'Sản Phẩm NPKL',
            price: fallbackCardData?.price || '75.000đ',
            description: `Sản phẩm "${fallbackCardData?.title || 'NPKL'}" chất lượng cao được phân phối chính hãng trên hệ thống sàn TMĐT NPKL.\n\nThông số & Ưu điểm:\n• Đảm bảo 100% hàng chính hãng, nguồn gốc xuất xứ rõ ràng.\n• Bảo hành chính hãng 12 tháng, 1 đổi 1 trong 7 ngày nếu có lỗi từ nhà sản xuất.\n• Đóng gói cẩn thận chống sốc, giao hàng hỏa tốc 24/7 toàn quốc.`,
            images: [
                fallbackCardData?.img || 'images/dac_nhan_tam.jpg',
                'images/hero_book_banner.jpg',
                'images/default.png'
            ],
            categoryTag: fallbackCardData?.categoryTag || 'Sản Phẩm Nổi Bật',
            shopName: 'Cửa Hàng NPKL Official Store',
            sellerName: 'Nguyễn Văn Chủ Shop',
            sellerPhone: '0987.654.321',
            sellerEmail: 'seller.support@npkl.vn',
            stockQty: 'Tồn kho: Còn 150 sản phẩm'
        };

        currentModalProductData = {
            title: fallbackCardData?.title || 'Sản phẩm',
            priceText: fallbackCardData?.price || '0đ',
            priceNum: parseInt((fallbackCardData?.price || '0').replace(/[^\d]/g, '')) || 50000,
            categoryTag: fallbackCardData?.categoryTag || 'Sản Phẩm',
            img: formatImgUrl(fallbackCardData?.img)
        };

        // Render thông tin lên Pop-up Modal UI
        if (titleEl) titleEl.textContent = productDetail.title;
        if (priceEl) priceEl.textContent = productDetail.price;
        if (categoryTagEl) categoryTagEl.textContent = productDetail.categoryTag;
        if (descEl) descEl.textContent = productDetail.description;
        if (stockBadgeEl) stockBadgeEl.textContent = productDetail.stockQty;

        if (shopNameEl) shopNameEl.textContent = productDetail.shopName;
        if (sellerNameEl) sellerNameEl.textContent = productDetail.sellerName;
        if (sellerPhoneEl) sellerPhoneEl.textContent = productDetail.sellerPhone;
        if (sellerEmailEl) sellerEmailEl.textContent = productDetail.sellerEmail;

        // Render Ảnh Chính & Danh Sách Ảnh Con (Gallery Thumbnails)
        if (productDetail.images && productDetail.images.length > 0) {
            const firstImg = formatImgUrl(productDetail.images[0]);
            if (mainImgEl) mainImgEl.src = firstImg;

            if (subImagesListEl) {
                subImagesListEl.innerHTML = productDetail.images.map((imgSrc, idx) => `
                    <img src="${formatImgUrl(imgSrc)}" class="modal-sub-thumb ${idx === 0 ? 'active' : ''}" alt="Ảnh con ${idx + 1}" data-img="${formatImgUrl(imgSrc)}" />
                `).join('');

                subImagesListEl.querySelectorAll('.modal-sub-thumb').forEach(thumb => {
                    thumb.addEventListener('click', () => {
                        subImagesListEl.querySelectorAll('.modal-sub-thumb').forEach(t => t.classList.remove('active'));
                        thumb.classList.add('active');
                        if (mainImgEl) mainImgEl.src = thumb.getAttribute('data-img');
                    });
                });
            }
        } else {
            if (mainImgEl) mainImgEl.src = formatImgUrl(fallbackCardData?.img);
            if (subImagesListEl) subImagesListEl.innerHTML = '';
        }
    }

    // Xử lý nút Thêm Vào Giỏ Hàng trên Modal Pop-up
    const modalBtnAddCart = document.getElementById('modalBtnAddCart');
    if (modalBtnAddCart) {
        modalBtnAddCart.addEventListener('click', () => {
            const token = sessionStorage.getItem('jwtToken') || localStorage.getItem('jwtToken');
            if (!token) {
                alert('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!');
                window.location.href = '../DangNhap/index.html';
                return;
            }

            if (!currentModalProductData) return;

            let cart = getStoredCart();
            const existingItem = cart.find(item => item.title === currentModalProductData.title);

            if (existingItem) {
                existingItem.qty += 1;
            } else {
                cart.push({
                    id: 'cart-' + Date.now(),
                    title: currentModalProductData.title,
                    price: currentModalProductData.priceNum,
                    qty: 1,
                    categoryTag: currentModalProductData.categoryTag,
                    img: currentModalProductData.img
                });
            }

            localStorage.setItem('npkl_cart_items', JSON.stringify(cart));

            const cartBadge = document.querySelector('#cartBadge');
            if (cartBadge) {
                let totalCartQty = 0;
                cart.forEach(item => totalCartQty += item.qty);
                cartBadge.textContent = totalCartQty;
            }

            showToastMsg(`Đã thêm "${currentModalProductData.title}" vào Giỏ Hàng! 🛒`);
            if (productDetailModal) productDetailModal.classList.remove('active');
        });
    }

    // Xử lý nút Yêu Thích trên Modal Pop-up
    const modalBtnWishlist = document.getElementById('modalBtnWishlist');
    if (modalBtnWishlist) {
        modalBtnWishlist.addEventListener('click', () => {
            const token = sessionStorage.getItem('jwtToken') || localStorage.getItem('jwtToken');
            if (!token) {
                alert('Vui lòng đăng nhập để lưu sản phẩm yêu thích!');
                window.location.href = '../DangNhap/index.html';
                return;
            }

            if (!currentModalProductData) return;

            let wishlist = getStoredWishlist();
            const existingIndex = wishlist.findIndex(item => item.title === currentModalProductData.title);

            if (existingIndex >= 0) {
                wishlist.splice(existingIndex, 1);
                showToastMsg(`Đã xóa "${currentModalProductData.title}" khỏi danh sách yêu thích`);
            } else {
                wishlist.push({
                    id: 'wish-' + Date.now(),
                    title: currentModalProductData.title,
                    price: currentModalProductData.priceText,
                    categoryTag: currentModalProductData.categoryTag,
                    img: currentModalProductData.img
                });
                showToastMsg(`Đã lưu "${currentModalProductData.title}" vào trang Yêu Thích! ❤️`);
            }

            localStorage.setItem('npkl_wishlist', JSON.stringify(wishlist));

            const wishlistBadge = document.querySelector('#wishlistBadge');
            if (wishlistBadge) wishlistBadge.textContent = wishlist.length;
        });
    }

    // Sự kiện Click thẻ sản phẩm trên index.html -> Mở Pop-up Modal Chi tiết
    document.addEventListener('click', (e) => {
        const card = e.target.closest('.product-card');
        if (card) {
            // Không mở Modal nếu bấm nút Yêu Thích hoặc Thêm Vào Giỏ
            if (e.target.closest('.wishlist-btn') || e.target.closest('.btn-add-cart')) {
                return;
            }

            const productId = card.getAttribute('data-id') || 'PRD-DEMO';
            const title = card.querySelector('.product-title')?.textContent.trim() || 'Sản phẩm';
            const price = card.querySelector('.product-price')?.textContent.trim() || '0đ';
            const categoryTag = card.querySelector('.category-tag')?.textContent.trim() || 'Sản Phẩm';
            const rawImg = card.querySelector('img')?.getAttribute('src') || '';

            openProductDetailModal(productId, {
                title,
                price,
                categoryTag,
                img: rawImg
            });
        }
    });

    window.openProductDetailModal = openProductDetailModal;
});
