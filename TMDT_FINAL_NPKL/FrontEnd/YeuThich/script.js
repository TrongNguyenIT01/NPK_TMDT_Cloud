document.addEventListener('DOMContentLoaded', () => {
    const BASE_API_URL = window.location.origin;

    // 1. Kiểm tra Đăng nhập - Bắt buộc phải đăng nhập mới được xem danh sách yêu thích
    const token = sessionStorage.getItem('jwtToken') || localStorage.getItem('jwtToken');
    if (!token) {
        alert('Vui lòng đăng nhập để xem danh sách sản phẩm yêu thích của bạn!');
        window.location.href = '../DangNhap/index.html';
        return;
    }

    // Sync User Account Name from Storage
    const nameElem = document.getElementById('headerUserName');
    const statusElem = document.getElementById('headerUserStatus');
    const displayName = sessionStorage.getItem('fullName') || localStorage.getItem('fullName') || sessionStorage.getItem('userName') || localStorage.getItem('userName') || 'Khách Hàng';
    const role = sessionStorage.getItem('userRole') || localStorage.getItem('userRole');
    if (nameElem) nameElem.textContent = displayName;
    if (statusElem) statusElem.textContent = role === 'CUSTOMER' ? 'Khách Hàng' : (role || '');

    // Quản lý Dropdown Account
    const userProfileBtn = document.getElementById('userProfileBtn');
    const userDropdownMenu = document.getElementById('userDropdownMenu');
    if (userProfileBtn && userDropdownMenu) {
        const dropdownName = document.getElementById('dropdownUserName');
        const dropdownRole = document.getElementById('dropdownUserRole');
        if (dropdownName) dropdownName.textContent = displayName;
        if (dropdownRole) dropdownRole.textContent = role === 'CUSTOMER' ? 'Khách Hàng' : (role || '');

        userProfileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const isVisible = userDropdownMenu.style.display === 'block';
            userDropdownMenu.style.display = isVisible ? 'none' : 'block';
        });
        document.addEventListener('click', (e) => {
            if (!userProfileBtn.contains(e.target) && !userDropdownMenu.contains(e.target)) {
                userDropdownMenu.style.display = 'none';
            }
        });
        const btnLogout = document.getElementById('btnLogout');
        if (btnLogout) {
            btnLogout.addEventListener('click', () => {
                if (confirm('Bạn có chắc muốn đăng xuất?')) {
                    sessionStorage.clear();
                    localStorage.removeItem('jwtToken');
                    localStorage.removeItem('userRole');
                    localStorage.removeItem('userName');
                    localStorage.removeItem('fullName');
                    localStorage.removeItem('email');
                    localStorage.removeItem('phone');
                    localStorage.removeItem('address');
                    localStorage.removeItem('npkl_wishlist');
                    localStorage.removeItem('npkl_cart_items');
                    localStorage.removeItem('npkl_cart_count');
                    window.location.href = '../DangNhap/index.html';
                }
            });
        }
    }

    const wishlistGrid = document.getElementById('wishlistGrid');
    const emptyState = document.getElementById('emptyState');
    const wishlistCountElem = document.getElementById('wishlistCount');
    const wishlistBadge = document.getElementById('wishlistBadge');
    const cartBadge = document.getElementById('cartBadge');
    const btnClearAll = document.getElementById('btnClearAll');
    const btnMoveAllToCart = document.getElementById('btnMoveAllToCart');

    // Wishlist & Cart data from localStorage
    let wishlistItems = JSON.parse(localStorage.getItem('npkl_wishlist')) || [];
    let cartItems = JSON.parse(localStorage.getItem('npkl_cart_items')) || [];

    async function updateBadgeCounts() {
        let totalCartQty = 0;
        cartItems.forEach(item => totalCartQty += (item.qty || 1));

        if (wishlistBadge) wishlistBadge.textContent = wishlistItems.length;
        if (wishlistCountElem) wishlistCountElem.textContent = wishlistItems.length;
        if (cartBadge) cartBadge.textContent = totalCartQty;

        const token = sessionStorage.getItem('jwtToken') || localStorage.getItem('jwtToken');
        if (token) {
            try {
                const res = await fetch(`${BASE_API_URL}/api/GioHang/count`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.success) {
                        if (cartBadge) cartBadge.textContent = data.count;
                        localStorage.setItem('npkl_cart_count', data.count);
                    }
                }
            } catch (err) {
                console.warn('Lỗi lấy số lượng giỏ hàng API:', err);
            }
        }

        localStorage.setItem('npkl_wishlist', JSON.stringify(wishlistItems));
        localStorage.setItem('npkl_cart_items', JSON.stringify(cartItems));
        localStorage.setItem('npkl_cart_count', totalCartQty);
    }

    function fixImgSrc(src) {
        if (!src) return '../TrangChinh/images/dac_nhan_tam.jpg';
        if (src.includes('https://') || src.includes('http://')) {
            const httpIdx = src.indexOf('http');
            return src.substring(httpIdx);
        }
        if (src.startsWith('/images/')) return `${BASE_API_URL}${src}`;
        if (src.startsWith('../TrangChinh/')) return src;
        if (src.startsWith('images/')) return '../TrangChinh/' + src;
        if (src.startsWith('./images/')) return '../TrangChinh/' + src.substring(2);
        return '../TrangChinh/images/' + src;
    }

    function renderWishlist() {
        updateBadgeCounts();

        if (wishlistItems.length === 0) {
            if (wishlistGrid) wishlistGrid.style.display = 'none';
            if (emptyState) emptyState.classList.add('active');
            if (btnClearAll) btnClearAll.style.display = 'none';
            if (btnMoveAllToCart) btnMoveAllToCart.style.display = 'none';
            return;
        }

        if (wishlistGrid) wishlistGrid.style.display = 'grid';
        if (emptyState) emptyState.classList.remove('active');
        if (btnClearAll) btnClearAll.style.display = 'inline-flex';
        if (btnMoveAllToCart) btnMoveAllToCart.style.display = 'inline-flex';

        if (wishlistGrid) {
            wishlistGrid.innerHTML = wishlistItems.map(item => `
                <div class="wishlist-card" id="${item.id}" data-id="${item.id}" data-product-id="${item.productId || ''}">
                    <div class="card-img-box">
                        <img src="${fixImgSrc(item.img)}" alt="${item.title}" onerror="this.src='../TrangChinh/images/dac_nhan_tam.jpg'" />
                        <button type="button" class="btn-remove-wishlist" data-id="${item.id}" title="Xóa khỏi danh sách">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <div class="card-content">
                        <span class="cat-badge">${item.categoryTag || 'Sản phẩm'}</span>
                        <h3 class="card-title">${item.title}</h3>
                        <p class="card-author">${item.author || 'Gian Hàng NPKL'}</p>
                        <div class="card-price-row">
                            <span class="card-price">${item.price}</span>
                            <span class="stock-status">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="#10B981"><circle cx="12" cy="12" r="10"/></svg>
                                Còn hàng
                            </span>
                        </div>
                        <button type="button" class="btn-add-to-cart" data-id="${item.id}" data-title="${item.title}">
                            🛒 THÊM VÀO GIỎ HÀNG
                        </button>
                    </div>
                </div>
            `).join('');
        }

        // Bind Remove Single Item
        document.querySelectorAll('.btn-remove-wishlist').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                const card = document.getElementById(id);
                if (card) {
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.9)';
                    setTimeout(() => {
                        wishlistItems = wishlistItems.filter(i => i.id !== id);
                        renderWishlist();
                        showToast('Đã xóa sản phẩm khỏi danh sách yêu thích');
                    }, 250);
                }
            });
        });

        // Bind Add to Cart Single Item
        document.querySelectorAll('.btn-add-to-cart').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                const targetItem = wishlistItems.find(i => i.id === id);
                if (!targetItem) return;

                const token = sessionStorage.getItem('jwtToken') || localStorage.getItem('jwtToken');
                const prodId = targetItem.productId;

                // [Thay đổi] Gọi API Backend nếu có Token và mã sản phẩm
                if (token && prodId) {
                    try {
                        const response = await fetch(`${BASE_API_URL}/api/GioHang/add`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                productId: prodId,
                                quantity: 1
                            })
                        });

                        const data = await response.json();
                        if (response.ok && data.success) {
                            if (cartBadge) cartBadge.textContent = data.totalItemsCount;
                            localStorage.setItem('npkl_cart_count', data.totalItemsCount);
                            if (data.items) {
                                localStorage.setItem('npkl_cart_items', JSON.stringify(data.items));
                            }
                            showToast(`Đã thêm "${targetItem.title}" vào Giỏ Hàng! 🛒`);
                            return;
                        } else {
                            showToast(data.message || 'Không thể thêm vào giỏ hàng!');
                            return;
                        }
                    } catch (apiErr) {
                        console.error('Lỗi khi gọi API giỏ hàng:', apiErr);
                    }
                }

                const priceNum = parseInt(String(targetItem.price).replace(/[^\d]/g, '')) || 50000;
                const existingCartItem = cartItems.find(i => (targetItem.productId && i.productId === targetItem.productId) || i.title === targetItem.title);

                if (existingCartItem) {
                    existingCartItem.qty = (existingCartItem.qty || 1) + 1;
                } else {
                    cartItems.push({
                        id: targetItem.productId || ('cart-' + Date.now()),
                        productId: targetItem.productId || '',
                        title: targetItem.title,
                        author: targetItem.author || 'Gian Hàng NPKL',
                        price: priceNum,
                        qty: 1,
                        categoryTag: targetItem.categoryTag || 'Sản phẩm',
                        img: targetItem.img
                    });
                }

                updateBadgeCounts();
                showToast(`Đã thêm "${targetItem.title}" vào Giỏ Hàng! 🛒`);
            });
        });

        // Bind Card Click -> Mở Pop-up Modal chi tiết sản phẩm
        document.querySelectorAll('.wishlist-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.btn-remove-wishlist') || e.target.closest('.btn-add-to-cart')) {
                    return;
                }
                const id = card.getAttribute('data-id');
                const targetItem = wishlistItems.find(i => i.id === id);
                if (targetItem) {
                    openProductDetailModal(targetItem.productId, targetItem);
                }
            });
        });
    }

    // =========================================================================
    // POP-UP MODAL CHI TIẾT SẢN PHẨM & ALBUM ẢNH
    // =========================================================================
    const productDetailModal = document.getElementById('productDetailModal');
    const closeDetailModalBtn = document.getElementById('closeDetailModalBtn');
    const modalBtnAddCart = document.getElementById('modalBtnAddCart');
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

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && productDetailModal.classList.contains('active')) {
                productDetailModal.classList.remove('active');
            }
        });
    }

    async function openProductDetailModal(productId, fallbackItem) {
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

        let productDetail = {
            productId: productId || '',
            title: fallbackItem?.title || 'Sản Phẩm NPKL',
            priceText: fallbackItem?.price || '0đ',
            priceNum: parseInt(String(fallbackItem?.price || '0').replace(/[^\d]/g, '')) || 50000,
            description: `Sản phẩm "${fallbackItem?.title || 'NPKL'}" chất lượng cao được phân phối chính hãng trên hệ thống sàn TMĐT NPKL.\n\nThông số & Ưu điểm:\n• Đảm bảo 100% hàng chính hãng, nguồn gốc xuất xứ rõ ràng.\n• Bảo hành chính hãng, 1 đổi 1 nếu có lỗi từ nhà sản xuất.\n• Đóng gói cẩn thận chống sốc, giao hàng hỏa tốc 24/7 toàn quốc.`,
            images: [fallbackItem?.img || 'images/dac_nhan_tam.jpg'],
            categoryTag: fallbackItem?.categoryTag || 'Sản phẩm',
            shopName: fallbackItem?.author || 'Cửa Hàng NPKL Official Store',
            sellerName: 'Chủ Gian Hàng',
            sellerPhone: 'Chưa cập nhật',
            sellerEmail: 'seller.support@npkl.vn',
            stockQty: 'Tồn kho: Còn 100 sản phẩm'
        };

        // Nếu có productId -> Thử gọi API lấy chi tiết và album ảnh
        if (productId) {
            try {
                const response = await fetch(`${BASE_API_URL}/api/SanPham/public-detail/${productId}`);
                if (response.ok) {
                    const result = await response.json();
                    const prod = result.data || result.Data || result;
                    if (prod) {
                        const imageSet = new Set();
                        if (prod.image) imageSet.add(prod.image);
                        if (Array.isArray(prod.images)) {
                            prod.images.forEach(img => { if (img) imageSet.add(img); });
                        }
                        const imagesList = Array.from(imageSet);
                        if (imagesList.length === 0) imagesList.push(fallbackItem?.img || 'images/dac_nhan_tam.jpg');

                        productDetail = {
                            productId: prod.productId,
                            title: prod.productName || productDetail.title,
                            priceText: new Intl.NumberFormat('vi-VN').format(prod.price) + 'đ',
                            priceNum: prod.price || productDetail.priceNum,
                            description: prod.description || productDetail.description,
                            images: imagesList,
                            categoryTag: prod.categoryName || productDetail.categoryTag,
                            shopName: prod.shop?.shopName || productDetail.shopName,
                            sellerName: prod.shop?.sellerName || productDetail.sellerName,
                            sellerPhone: prod.shop?.sellerPhone || productDetail.sellerPhone,
                            sellerEmail: prod.shop?.sellerEmail || productDetail.sellerEmail,
                            stockQty: `Tồn kho: Còn ${prod.stockQuantity != null ? prod.stockQuantity : 100} sản phẩm`
                        };
                    }
                }
            } catch (err) {
                console.warn('Không thể tải chi tiết API, dùng dữ liệu fallback:', err);
            }
        }

        currentModalProductData = {
            productId: productDetail.productId,
            title: productDetail.title,
            priceText: productDetail.priceText,
            priceNum: productDetail.priceNum,
            categoryTag: productDetail.categoryTag,
            img: formatImgUrl(productDetail.images[0])
        };

        // Bật Modal
        productDetailModal.classList.add('active');

        // Render UI
        if (titleEl) titleEl.textContent = productDetail.title;
        if (priceEl) priceEl.textContent = productDetail.priceText;
        if (categoryTagEl) categoryTagEl.textContent = productDetail.categoryTag;
        if (descEl) descEl.textContent = productDetail.description;
        if (stockBadgeEl) stockBadgeEl.textContent = productDetail.stockQty;

        if (shopNameEl) shopNameEl.textContent = productDetail.shopName;
        if (sellerNameEl) sellerNameEl.textContent = productDetail.sellerName;
        if (sellerPhoneEl) sellerPhoneEl.textContent = productDetail.sellerPhone;
        if (sellerEmailEl) sellerEmailEl.textContent = productDetail.sellerEmail;

        // Render Gallery
        if (productDetail.images && productDetail.images.length > 0) {
            const firstImg = formatImgUrl(productDetail.images[0]);
            if (mainImgEl) mainImgEl.src = firstImg;

            if (subImagesListEl) {
                subImagesListEl.innerHTML = productDetail.images.map((imgSrc, idx) => `
                    <img src="${formatImgUrl(imgSrc)}" class="modal-sub-thumb ${idx === 0 ? 'active' : ''}" alt="Ảnh ${idx + 1}" data-img="${formatImgUrl(imgSrc)}" onerror="this.src='../TrangChinh/images/dac_nhan_tam.jpg'" />
                `).join('');

                subImagesListEl.querySelectorAll('.modal-sub-thumb').forEach(thumb => {
                    thumb.addEventListener('click', () => {
                        subImagesListEl.querySelectorAll('.modal-sub-thumb').forEach(t => t.classList.remove('active'));
                        thumb.classList.add('active');
                        if (mainImgEl) mainImgEl.src = thumb.getAttribute('data-img');
                    });
                });
            }
        }
    }

    function formatImgUrl(src) {
        return fixImgSrc(src);
    }

    // Modal Add To Cart Button
    if (modalBtnAddCart) {
        modalBtnAddCart.addEventListener('click', async () => {
            if (!currentModalProductData) return;

            const token = sessionStorage.getItem('jwtToken') || localStorage.getItem('jwtToken');
            const prodId = currentModalProductData.productId;

            // [Thay đổi] Gọi API Backend nếu có Token và mã sản phẩm
            if (token && prodId) {
                try {
                    const response = await fetch(`${BASE_API_URL}/api/GioHang/add`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            productId: prodId,
                            quantity: 1
                        })
                    });

                    const data = await response.json();
                    if (response.ok && data.success) {
                        if (cartBadge) cartBadge.textContent = data.totalItemsCount;
                        localStorage.setItem('npkl_cart_count', data.totalItemsCount);
                        if (data.items) {
                            localStorage.setItem('npkl_cart_items', JSON.stringify(data.items));
                        }
                        showToast(`Đã thêm "${currentModalProductData.title}" vào Giỏ Hàng! 🛒`);
                        if (productDetailModal) productDetailModal.classList.remove('active');
                        return;
                    } else {
                        showToast(data.message || 'Không thể thêm vào giỏ hàng!');
                        return;
                    }
                } catch (apiErr) {
                    console.error('Lỗi khi gọi API giỏ hàng:', apiErr);
                }
            }

            const existingCartItem = cartItems.find(i => (currentModalProductData.productId && i.productId === currentModalProductData.productId) || i.title === currentModalProductData.title);

            if (existingCartItem) {
                existingCartItem.qty = (existingCartItem.qty || 1) + 1;
            } else {
                cartItems.push({
                    id: currentModalProductData.productId || ('cart-' + Date.now()),
                    productId: currentModalProductData.productId || '',
                    title: currentModalProductData.title,
                    price: currentModalProductData.priceNum,
                    qty: 1,
                    categoryTag: currentModalProductData.categoryTag,
                    img: currentModalProductData.img
                });
            }

            updateBadgeCounts();
            showToast(`Đã thêm "${currentModalProductData.title}" vào Giỏ Hàng! 🛒`);
            if (productDetailModal) productDetailModal.classList.remove('active');
        });
    }

    // Bind Clear All
    if (btnClearAll) {
        btnClearAll.addEventListener('click', () => {
            if (confirm('Bạn có chắc chắn muốn xóa toàn bộ danh sách yêu thích?')) {
                wishlistItems = [];
                renderWishlist();
                showToast('Đã xóa tất cả sản phẩm khỏi yêu thích');
            }
        });
    }

    // Bind Move All to Cart
    if (btnMoveAllToCart) {
        btnMoveAllToCart.addEventListener('click', async () => {
            if (wishlistItems.length > 0) {
                const token = sessionStorage.getItem('jwtToken') || localStorage.getItem('jwtToken');

                if (token) {
                    for (const targetItem of wishlistItems) {
                        if (targetItem.productId) {
                            try {
                                await fetch(`${BASE_API_URL}/api/GioHang/add`, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${token}`
                                    },
                                    body: JSON.stringify({
                                        productId: targetItem.productId,
                                        quantity: 1
                                    })
                                });
                            } catch (e) {
                                console.warn('Lỗi thêm sản phẩm hàng loạt:', e);
                            }
                        }
                    }
                }

                wishlistItems.forEach(targetItem => {
                    const priceNum = parseInt(String(targetItem.price).replace(/[^\d]/g, '')) || 50000;
                    const existing = cartItems.find(i => (targetItem.productId && i.productId === targetItem.productId) || i.title === targetItem.title);
                    if (existing) {
                        existing.qty = (existing.qty || 1) + 1;
                    } else {
                        cartItems.push({
                            id: targetItem.productId || ('cart-' + Date.now() + Math.random()),
                            productId: targetItem.productId || '',
                            title: targetItem.title,
                            author: targetItem.author || 'Gian Hàng NPKL',
                            price: priceNum,
                            qty: 1,
                            categoryTag: targetItem.categoryTag || 'Sản phẩm',
                            img: targetItem.img
                        });
                    }
                });

                updateBadgeCounts();
                showToast(`Đã thêm toàn bộ ${wishlistItems.length} sản phẩm vào Giỏ Hàng!`);
            }
        });
    }

    // Initial render
    renderWishlist();

    // Toast Notification Helper
    function showToast(message) {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span>${message}</span>
        `;

        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    // 4. Đồng bộ Top Bar & Search
    const sellerLink = document.getElementById('sellerLink');
    const sellerDivider = document.getElementById('sellerDivider');
    const adminLink = document.getElementById('adminLink');
    const adminDivider = document.getElementById('adminDivider');
    if (role === 'CUSTOMER' || !role) {
        if (sellerLink) sellerLink.style.display = 'none';
        if (sellerDivider) sellerDivider.style.display = 'none';
        if (adminLink) adminLink.style.display = 'none';
        if (adminDivider) adminDivider.style.display = 'none';
    }

    const btnExecuteSearch = document.getElementById('btnExecuteSearch');
    const globalSearchInput = document.getElementById('globalSearchInput');
    if (btnExecuteSearch && globalSearchInput) {
        btnExecuteSearch.addEventListener('click', () => {
            const query = globalSearchInput.value.trim();
            if (query) {
                localStorage.setItem('npkl_pending_search', query);
            }
            window.location.href = '../TrangChinh/index.html';
        });
        globalSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') btnExecuteSearch.click();
        });
    }
});
