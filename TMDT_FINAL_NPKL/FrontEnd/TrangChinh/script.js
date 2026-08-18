document.addEventListener('DOMContentLoaded', () => {
    const BASE_API_URL = 'https://localhost:3001';
    const API_CATEGORIES = `${BASE_API_URL}/api/DoanhMuc/getDM`;
    const API_PRODUCTS = `${BASE_API_URL}/api/SanPham/public-products`;

    // Global state
    let allCategories = [];
    let allProducts = [];

    // Helper format giá tiền & ảnh
    function formatPrice(price) {
        if (!price && price !== 0) return '0đ';
        return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
    }

    function formatImgUrl(src) {
        if (!src) return 'images/dac_nhan_tam.jpg';
        if (src.startsWith('http://') || src.startsWith('https://')) return src;
        if (src.startsWith('/images/')) return `${BASE_API_URL}${src}`;
        if (src.startsWith('images/')) return src;
        return `images/${src}`;
    }

    // ---------------- Real-time localStorage Sync Helper ----------------
    function getStoredWishlist() {
        const token = sessionStorage.getItem('jwtToken') || localStorage.getItem('jwtToken');
        if (!token) return []; // Chưa đăng nhập -> 0 sản phẩm yêu thích
        return JSON.parse(localStorage.getItem('npkl_wishlist')) || [];
    }

    function getStoredCart() {
        const token = sessionStorage.getItem('jwtToken') || localStorage.getItem('jwtToken');
        if (!token) return []; // Chưa đăng nhập -> 0 sản phẩm trong giỏ hàng
        return JSON.parse(localStorage.getItem('npkl_cart_items')) || [];
    }

    const wishlistBadge = document.querySelector('#wishlistBadge');
    const cartBadge = document.querySelector('#cartBadge');

    async function syncBadgesFromStorage() {
        const token = sessionStorage.getItem('jwtToken') || localStorage.getItem('jwtToken');
        if (!token) {
            if (wishlistBadge) wishlistBadge.textContent = '0';
            if (cartBadge) cartBadge.textContent = '0';
            return;
        }

        const wishlist = getStoredWishlist();
        if (wishlistBadge) wishlistBadge.textContent = wishlist.length;

        // [Mới] Đồng bộ số lượng giỏ hàng từ Database qua API Backend
        try {
            const res = await fetch(`${BASE_API_URL}/api/GioHang/count`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data && data.success) {
                    if (cartBadge) cartBadge.textContent = data.count;
                    localStorage.setItem('npkl_cart_count', data.count);
                    return;
                }
            }
        } catch (err) {
            console.warn('Không thể lấy số lượng giỏ hàng từ server, dùng cache local:', err);
        }

        // Fallback từ LocalStorage nếu API chưa phản hồi
        const cart = getStoredCart();
        let totalCartQty = 0;
        cart.forEach(item => totalCartQty += (item.qty || 1));

        if (cartBadge) cartBadge.textContent = totalCartQty;

        localStorage.setItem('npkl_wishlist', JSON.stringify(wishlist));
        localStorage.setItem('npkl_cart_items', JSON.stringify(cart));
        localStorage.setItem('npkl_cart_count', totalCartQty);
    }

    // Initial Badge Sync & Highlight active wishlist hearts
    function paintActiveWishlistButtons() {
        const wishlist = getStoredWishlist();
        document.querySelectorAll('.product-card').forEach(card => {
            const prodId = card.getAttribute('data-id');
            const title = card.querySelector('.product-title')?.textContent.trim();
            const btn = card.querySelector('.wishlist-btn');
            const svgIcon = btn ? btn.querySelector('svg') : null;

            if (btn) {
                const isLiked = wishlist.some(item => (prodId && item.productId === prodId) || (title && item.title === title));
                if (isLiked) {
                    btn.classList.add('active');
                    if (svgIcon) svgIcon.setAttribute('fill', '#EF4444');
                } else {
                    btn.classList.remove('active');
                    if (svgIcon) svgIcon.setAttribute('fill', 'none');
                }
            }
        });
    }

    syncBadgesFromStorage();
    paintActiveWishlistButtons();

    // 1 & 2. Interactive Logic with Event Delegation
    document.addEventListener('click', (e) => {
        // Kiểm tra Đăng nhập khi bấm nút Yêu thích hoặc Giỏ hàng trên Header
        const headerWishlistLink = e.target.closest('a[href*="YeuThich"]');
        if (headerWishlistLink) {
            const token = sessionStorage.getItem('jwtToken') || localStorage.getItem('jwtToken');
            if (!token) {
                e.preventDefault();
                alert('Vui lòng đăng nhập để xem danh sách sản phẩm yêu thích!');
                window.location.href = '../DangNhap/index.html';
                return;
            }
        }

        const headerCartLink = e.target.closest('a[href*="GioHang"]');
        if (headerCartLink) {
            const token = sessionStorage.getItem('jwtToken') || localStorage.getItem('jwtToken');
            if (!token) {
                e.preventDefault();
                alert('Vui lòng đăng nhập để xem giỏ hàng của bạn!');
                window.location.href = '../DangNhap/index.html';
                return;
            }
        }

        const wishBtn = e.target.closest('.wishlist-btn');
        if (wishBtn) {
            e.preventDefault();
            e.stopPropagation();

            const token = sessionStorage.getItem('jwtToken') || localStorage.getItem('jwtToken');
            if (!token) {
                alert('Vui lòng đăng nhập để lưu sản phẩm yêu thích!');
                window.location.href = '../DangNhap/index.html';
                return;
            }

            const card = wishBtn.closest('.product-card');
            if (!card) return;

            const prodId = card.getAttribute('data-id');
            const svgIcon = wishBtn.querySelector('svg');
            const title = card.querySelector('.product-title')?.textContent.trim() || 'Sản phẩm';
            const author = card.querySelector('.product-author')?.textContent.trim() || '';
            const price = card.querySelector('.product-price')?.textContent.trim() || '0đ';
            const categoryTag = card.querySelector('.category-tag')?.textContent.trim() || 'Sản phẩm';
            const rawImg = card.querySelector('img')?.getAttribute('src') || '';
            let img = rawImg;
            if (rawImg.includes('https://') || rawImg.includes('http://')) {
                img = rawImg.substring(rawImg.indexOf('http'));
            } else if (rawImg.startsWith('/images/')) {
                img = `${BASE_API_URL}${rawImg}`;
            }

            let wishlist = getStoredWishlist();
            const existingIndex = wishlist.findIndex(item => (prodId && item.productId === prodId) || item.title === title);

            if (wishBtn.classList.contains('active') || existingIndex >= 0) {
                wishBtn.classList.remove('active');
                if (svgIcon) svgIcon.setAttribute('fill', 'none');
                if (existingIndex >= 0) wishlist.splice(existingIndex, 1);
                showToast(`Đã xóa "${title}" khỏi danh sách yêu thích`);
            } else {
                wishBtn.classList.add('active');
                if (svgIcon) svgIcon.setAttribute('fill', '#EF4444');
                wishlist.push({
                    id: 'wish-' + Date.now(),
                    productId: prodId,
                    title,
                    author,
                    price,
                    categoryTag,
                    img
                });
                showToast(`Đã lưu "${title}" vào trang Yêu Thích! ❤️`);
            }

            localStorage.setItem('npkl_wishlist', JSON.stringify(wishlist));
            syncBadgesFromStorage();
            paintActiveWishlistButtons();
            return;
        }

        const addCartBtn = e.target.closest('.btn-add-cart');
        if (addCartBtn) {
            e.preventDefault();
            e.stopPropagation();

            const token = sessionStorage.getItem('jwtToken') || localStorage.getItem('jwtToken');
            if (!token) {
                alert('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!');
                window.location.href = '../DangNhap/index.html';
                return;
            }

            const card = addCartBtn.closest('.product-card');
            if (!card) return;

            const prodId = card.getAttribute('data-id');
            const title = card.querySelector('.product-title')?.textContent.trim() || 'Sản phẩm';
            const author = card.querySelector('.product-author')?.textContent.trim() || '';
            const priceText = card.querySelector('.product-price')?.textContent.trim() || '0đ';
            const priceNum = parseInt(priceText.replace(/[^\d]/g, '')) || 50000;
            const categoryTag = card.querySelector('.category-tag')?.textContent.trim() || 'Sản phẩm';
            const rawImg = card.querySelector('img')?.getAttribute('src') || '';
            let img = rawImg;
            if (rawImg.includes('https://') || rawImg.includes('http://')) {
                img = rawImg.substring(rawImg.indexOf('http'));
            } else if (rawImg.startsWith('/images/')) {
                img = `${BASE_API_URL}${rawImg}`;
            }

            // [Thay đổi] Gọi API Backend lưu vào CSDL thay vì chỉ lưu LocalStorage
            if (prodId) {
                (async () => {
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
                            showToast(`Đã thêm "${title}" vào Giỏ Hàng! 🛒`);
                            return;
                        } else {
                            showToast(data.message || 'Không thể thêm vào giỏ hàng!');
                            return;
                        }
                    } catch (apiErr) {
                        console.error('Lỗi API khi thêm vào giỏ hàng:', apiErr);
                    }

                    // Fallback LocalStorage nếu API gặp sự cố
                    let cart = getStoredCart();
                    const existingItem = cart.find(item => (prodId && item.productId === prodId) || item.title === title);

                    if (existingItem) {
                        existingItem.qty = (existingItem.qty || 1) + 1;
                    } else {
                        cart.push({
                            id: prodId || ('cart-' + Date.now()),
                            productId: prodId,
                            title,
                            author,
                            price: priceNum,
                            qty: 1,
                            categoryTag,
                            img
                        });
                    }

                    localStorage.setItem('npkl_cart_items', JSON.stringify(cart));
                    syncBadgesFromStorage();
                    showToast(`Đã thêm "${title}" vào Giỏ Hàng! 🛒`);
                })();
                return;
            }

            let cart = getStoredCart();
            const existingItem = cart.find(item => (prodId && item.productId === prodId) || item.title === title);

            if (existingItem) {
                existingItem.qty = (existingItem.qty || 1) + 1;
            } else {
                cart.push({
                    id: 'cart-' + Date.now(),
                    productId: prodId,
                    title,
                    author,
                    price: priceNum,
                    qty: 1,
                    categoryTag,
                    img
                });
            }

            localStorage.setItem('npkl_cart_items', JSON.stringify(cart));
            syncBadgesFromStorage();
            showToast(`Đã thêm "${title}" vào Giỏ Hàng! 🛒`);
        }
    });

    // 3. Category Block Sections Filtering & Smooth Scroll Logic
    const categoryBlockSections = document.querySelectorAll('.category-block-section');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const categoryCards = document.querySelectorAll('.cat-card');
    const navCategoryLinks = document.querySelectorAll('.nav-category-trigger');
    const dropdownItems = document.querySelectorAll('.nav-menu .dropdown-item');
    const viewMoreBtns = document.querySelectorAll('.btn-view-more');
    const sectionTitle = document.querySelector('#sectionTitle');
    const productsSection = document.querySelector('#bestsellers');

    function filterCategory(categoryKey, displayName) {
        // Toggle Category Block Sections (Vertical Layout)
        const currentSections = document.querySelectorAll('.category-block-section');
        currentSections.forEach(section => {
            const blockCat = section.getAttribute('data-category-block');
            if (categoryKey === 'ALL' || blockCat === categoryKey) {
                section.style.display = 'block';
                section.querySelectorAll('.product-card').forEach(card => card.style.display = 'flex');
            } else {
                section.style.display = 'none';
            }
        });

        // Update Filter Tabs active state
        document.querySelectorAll('.filter-btn').forEach(btn => {
            if (btn.getAttribute('data-filter') === categoryKey) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Update Category Cards active state
        document.querySelectorAll('.cat-card').forEach(card => {
            if (card.getAttribute('data-category') === categoryKey) {
                card.classList.add('active-cat');
            } else {
                card.classList.remove('active-cat');
            }
        });

        // Đồng bộ Select Dropdown trên Header
        const searchCategorySelect = document.getElementById('globalCategorySelect');
        if (searchCategorySelect) {
            searchCategorySelect.value = categoryKey;
        }

        // Update Header Section Title
        if (sectionTitle) {
            if (categoryKey === 'ALL') {
                sectionTitle.textContent = 'DANH MỤC SẢN PHẨM NỔI BẬT';
            } else {
                sectionTitle.textContent = `DANH MỤC: ${displayName || categoryKey}`;
            }
        }

        // Scroll smoothly to target section or products section
        if (categoryKey !== 'ALL') {
            const targetSection = document.querySelector(`#section-${categoryKey.toLowerCase()}`) || document.querySelector(`#section-${categoryKey}`);
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else if (productsSection) {
                productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        } else if (productsSection) {
            productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    window.filterCategory = filterCategory;

    // Bind Filter Tabs
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const cat = btn.getAttribute('data-filter');
            const name = btn.getAttribute('data-name');
            filterCategory(cat, name);
        });
    });

    // Bind Hero Category Cards ("MUA NGAY →")
    categoryCards.forEach(card => {
        card.addEventListener('click', (e) => {
            e.preventDefault();
            const cat = card.getAttribute('data-category');
            const title = card.querySelector('.cat-title') ? card.querySelector('.cat-title').textContent : cat;
            filterCategory(cat, title);
        });
    });

    // Bind Top Nav Category Links
    navCategoryLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const cat = link.getAttribute('data-category');
            const name = link.getAttribute('data-name');
            filterCategory(cat, name);
        });
    });

    // Bind Dropdown Sub-Items
    dropdownItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const cat = item.getAttribute('data-category');
            const name = item.getAttribute('data-name');
            filterCategory(cat, name);
        });
    });

    // Bind Banner "Xem tất cả" Buttons
    viewMoreBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const cat = btn.getAttribute('data-category');
            const name = btn.getAttribute('data-name');
            filterCategory(cat, name);
        });
    });

    // =========================================================================
    // 4. SMART FRONTEND SEARCH BAR ENGINE WITH LIVE DROPDOWN & MAGNIFYING GLASS SCROLL
    // =========================================================================
    const searchInput = document.getElementById('globalSearchInput');
    const searchCategorySelect = document.getElementById('globalCategorySelect');
    const btnExecuteSearch = document.getElementById('btnExecuteSearch');
    const btnClearSearch = document.getElementById('btnClearSearch');
    const searchDropdown = document.getElementById('searchDropdownResults');
    const searchWrapper = document.querySelector('.search-box-wrapper');

    // Hot trending keywords list
    const hotKeywords = [
        '🔥 Đắc Nhân Tâm',
        '📘 Nhà Giả Kim',
        '📓 Sổ tay Moleskine',
        '🖊️ Bút máy Lamy',
        '🎁 Combo Tựu Trường',
        '☕ Combo Đọc Sách'
    ];

    // Collect product database from DOM
    function getProductsData() {
        const products = [];
        document.querySelectorAll('.product-card').forEach((card, index) => {
            const prodId = card.getAttribute('data-id') || '';
            const title = card.querySelector('.product-title')?.textContent.trim() || '';
            const author = card.querySelector('.product-author')?.textContent.trim() || '';
            const price = card.querySelector('.product-price')?.textContent.trim() || '';
            const img = card.querySelector('img')?.getAttribute('src') || '';
            const category = card.getAttribute('data-category') || '';
            const categoryTag = card.querySelector('.category-tag')?.textContent.trim() || category;

            // Ensure card has a unique ID for scrolling
            if (!card.id) {
                card.id = `product-item-${index}`;
            }

            products.push({
                elementId: card.id,
                productId: prodId,
                title,
                author,
                price,
                img,
                category,
                categoryTag,
                cardRef: card
            });
        });
        return products;
    }

    // Render Hot Search Chips Dropdown
    function renderHotSearches() {
        if (!searchDropdown) return;
        searchDropdown.innerHTML = `
            <div class="hot-searches-box">
                <div class="hot-searches-title">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E05A2B" stroke-width="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                    Từ Khóa Tìm Kiếm Nổi Bật:
                </div>
                <div class="hot-tags-list">
                    ${hotKeywords.map(kw => `<span class="hot-tag" data-keyword="${kw.replace(/^[^\w\s\u00C0-\u1EF9]/, '').trim()}">${kw}</span>`).join('')}
                </div>
            </div>
        `;
        searchDropdown.classList.add('active');

        // Bind hot tag clicks
        searchDropdown.querySelectorAll('.hot-tag').forEach(tag => {
            tag.addEventListener('click', (e) => {
                e.stopPropagation();
                const kw = tag.getAttribute('data-keyword');
                if (searchInput) {
                    searchInput.value = kw;
                    triggerLiveSearch(kw);
                }
            });
        });
    }

    // Render Live Product Search Results Panel
    function triggerLiveSearch(query) {
        if (!searchDropdown || !searchInput) return;

        const cleanQuery = query.toLowerCase().trim();
        const selectedCat = searchCategorySelect ? searchCategorySelect.value : 'ALL';

        if (btnClearSearch) {
            btnClearSearch.style.display = cleanQuery.length > 0 ? 'block' : 'none';
        }

        if (!cleanQuery) {
            renderHotSearches();
            filterProductsOnPage('', selectedCat);
            return;
        }

        const allDOMProducts = getProductsData();
        const matches = allDOMProducts.filter(p => {
            const matchQuery = p.title.toLowerCase().includes(cleanQuery) ||
                              p.author.toLowerCase().includes(cleanQuery) ||
                              p.categoryTag.toLowerCase().includes(cleanQuery);
            const matchCat = (selectedCat === 'ALL') || 
                             (p.category === selectedCat) ||
                             (p.category.toUpperCase() === selectedCat.toUpperCase());
            return matchQuery && matchCat;
        });

        if (matches.length === 0) {
            searchDropdown.innerHTML = `
                <div class="search-empty-state">
                    <p style="font-weight: 700; color: #0F172A; margin-bottom: 4px;">🔍 Không tìm thấy sản phẩm nào</p>
                    <p style="font-size: 0.8rem; color: #64748B;">Thử tìm với từ khóa "Sách", "Bút", "Moleskine", "Combo"...</p>
                </div>
            `;
        } else {
            searchDropdown.innerHTML = `
                <div class="search-results-list">
                    <div style="padding: 10px 16px 6px 16px; font-size: 0.78rem; font-weight: 700; color: #64748B; border-bottom: 1px solid #F1F5F9; text-transform: uppercase;">
                        Kết quả gợi ý (${matches.length}):
                    </div>
                    ${matches.map(p => `
                        <div class="search-result-item" data-target-id="${p.elementId}" data-product-id="${p.productId}">
                            <img src="${p.img}" alt="${p.title}" class="search-item-img" onerror="this.src='images/dac_nhan_tam.jpg'" />
                            <div class="search-item-info">
                                <div class="search-item-title">${p.title}</div>
                                <div class="search-item-meta">
                                    <span>${p.author}</span> • <span style="color: #64748B; font-weight: 600;">${p.categoryTag}</span>
                                </div>
                            </div>
                            <div class="search-item-price">${p.price}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        searchDropdown.classList.add('active');

        // Bind clicks on individual search result items
        searchDropdown.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const targetId = item.getAttribute('data-target-id');
                const prodId = item.getAttribute('data-product-id');
                const targetCard = document.getElementById(targetId) || document.querySelector(`.product-card[data-id="${prodId}"]`);
                
                searchDropdown.classList.remove('active');

                if (targetCard) {
                    // Ensure the parent category block is visible
                    const parentBlock = targetCard.closest('.category-block-section');
                    if (parentBlock) parentBlock.style.display = 'block';

                    // Smooth scroll down to target product card
                    targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });

                    // Add pulse highlight animation
                    targetCard.classList.remove('highlight-target');
                    void targetCard.offsetWidth; // trigger reflow
                    targetCard.classList.add('highlight-target');
                    
                    showToast(`Đã tìm thấy: "${targetCard.querySelector('.product-title')?.textContent}"`);
                } else if (prodId && window.openProductDetailModal) {
                    window.openProductDetailModal(prodId);
                }
            });
        });

        // Also filter the visible product cards on page in real-time
        filterProductsOnPage(cleanQuery, selectedCat);
    }

    // Filter products visible on the page
    function filterProductsOnPage(query, selectedCat) {
        const sections = document.querySelectorAll('.category-block-section');
        sections.forEach(section => {
            let sectionHasMatch = false;
            const blockCat = section.getAttribute('data-category-block');
            
            const matchSectionCat = (selectedCat === 'ALL') || (selectedCat === blockCat) || (selectedCat.toUpperCase() === blockCat.toUpperCase());

            if (!matchSectionCat) {
                section.style.display = 'none';
                return;
            }

            section.querySelectorAll('.product-card').forEach(card => {
                const title = card.querySelector('.product-title')?.textContent.toLowerCase() || '';
                const author = card.querySelector('.product-author')?.textContent.toLowerCase() || '';
                const catTag = card.querySelector('.category-tag')?.textContent.toLowerCase() || '';

                const matchQuery = !query || title.includes(query) || author.includes(query) || catTag.includes(query);

                if (matchQuery) {
                    card.style.display = 'flex';
                    sectionHasMatch = true;
                } else {
                    card.style.display = 'none';
                }
            });

            section.style.display = sectionHasMatch ? 'block' : 'none';
        });
    }

    // Event 1: Focus on input -> show hot searches
    if (searchInput) {
        searchInput.addEventListener('focus', () => {
            if (!searchInput.value.trim()) {
                renderHotSearches();
            } else {
                triggerLiveSearch(searchInput.value);
            }
        });

        // Event 2: Type in input -> live search
        searchInput.addEventListener('input', (e) => {
            triggerLiveSearch(e.target.value);
        });

        // Event 3: Enter key
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (btnExecuteSearch) btnExecuteSearch.click();
            }
        });
    }

    // Event 4: Clear button click
    if (btnClearSearch) {
        btnClearSearch.addEventListener('click', (e) => {
            e.stopPropagation();
            if (searchInput) searchInput.value = '';
            btnClearSearch.style.display = 'none';
            if (searchDropdown) searchDropdown.classList.remove('active');
            const selectedCat = searchCategorySelect ? searchCategorySelect.value : 'ALL';
            filterCategory(selectedCat, 'TẤT CẢ');
        });
    }

    // Event 5: Category Select Dropdown change
    if (searchCategorySelect) {
        searchCategorySelect.addEventListener('change', () => {
            const query = searchInput ? searchInput.value : '';
            const selectedVal = searchCategorySelect.value;
            const selectedName = searchCategorySelect.options[searchCategorySelect.selectedIndex].text;

            document.querySelectorAll('.filter-btn').forEach(btn => {
                if (btn.getAttribute('data-filter') === selectedVal) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });

            if (query.trim()) {
                triggerLiveSearch(query);
            } else {
                filterCategory(selectedVal, selectedName);
            }
        });
    }

    // Event 6: Search Button Click (MAGNIFYING GLASS CLICK)
    // Perform search & SMOOTH SCROLL DOWN TO SHOPPING SECTION (#bestsellers)
    if (btnExecuteSearch) {
        btnExecuteSearch.addEventListener('click', (e) => {
            e.preventDefault();
            const query = searchInput ? searchInput.value.trim() : '';
            const selectedCat = searchCategorySelect ? searchCategorySelect.value : 'ALL';

            // Close live dropdown
            if (searchDropdown) searchDropdown.classList.remove('active');

            // Apply filter
            filterProductsOnPage(query.toLowerCase(), selectedCat);

            // SMOOTH SCROLL DOWN TO PRODUCTS / SHOP SECTION
            if (productsSection) {
                productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }

            if (query) {
                showToast(`Đang hiển thị kết quả tìm kiếm cho: "${query}"`);
            } else {
                showToast('Đang chuyển tới danh mục sản phẩm!');
            }
        });
    }

    // Event 7: Close dropdown when clicking outside search wrapper
    document.addEventListener('click', (e) => {
        if (searchWrapper && !searchWrapper.contains(e.target)) {
            if (searchDropdown) searchDropdown.classList.remove('active');
        }
    });

    // ---------------- Execute Pending Search from Other Pages ----------------
    const pendingSearch = localStorage.getItem('npkl_pending_search');
    if (pendingSearch) {
        localStorage.removeItem('npkl_pending_search');
        if (searchInput) {
            searchInput.value = pendingSearch;
            setTimeout(() => {
                if (btnExecuteSearch) btnExecuteSearch.click();
            }, 300); // Allow DOM to fully settle
        }
    }

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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span>${message}</span>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    // ---------------- User Auth State & Header Sync ----------------
    function initUserAuthState() {
        const token = sessionStorage.getItem('jwtToken') || localStorage.getItem('jwtToken');
        const role = sessionStorage.getItem('userRole') || localStorage.getItem('userRole');
        const userName = sessionStorage.getItem('userName') || localStorage.getItem('userName');
        const fullName = sessionStorage.getItem('fullName') || localStorage.getItem('fullName');

        const sellerLink = document.getElementById('sellerLink');
        const sellerDivider = document.getElementById('sellerDivider');
        const adminLink = document.getElementById('adminLink');
        const adminDivider = document.getElementById('adminDivider');

        const userProfileBtn = document.getElementById('userProfileBtn');
        const headerUserName = document.getElementById('headerUserName');
        const headerUserStatus = document.getElementById('headerUserStatus');
        const userDropdownMenu = document.getElementById('userDropdownMenu');
        const dropdownUserName = document.getElementById('dropdownUserName');
        const dropdownUserRole = document.getElementById('dropdownUserRole');
        const btnLogout = document.getElementById('btnLogout');

        const navLoginItem = document.getElementById('navLoginItem');
        const navRegisterItem = document.getElementById('navRegisterItem');

        if (token) {
            // Tên hiển thị người dùng
            const displayName = fullName || userName || 'Khách Hàng';

            // Ẩn Kênh Người Bán & Quản trị Admin khi khách hàng đăng nhập
            if (role === 'CUSTOMER' || !role) {
                if (sellerLink) sellerLink.style.display = 'none';
                if (sellerDivider) sellerDivider.style.display = 'none';
                if (adminLink) adminLink.style.display = 'none';
                if (adminDivider) adminDivider.style.display = 'none';
            }

            // Ẩn nút Đăng Nhập & Đăng Ký trên thanh menu điều hướng
            if (navLoginItem) navLoginItem.style.display = 'none';
            if (navRegisterItem) navRegisterItem.style.display = 'none';

            // Thay đổi chữ "Đăng Nhập" trên góc phải thành tên người dùng mới đăng nhập
            if (headerUserName) headerUserName.textContent = displayName;
            if (headerUserStatus) headerUserStatus.textContent = role === 'CUSTOMER' ? 'Khách Hàng' : (role || 'Thành viên');

            if (dropdownUserName) dropdownUserName.textContent = displayName;
            if (dropdownUserRole) dropdownUserRole.textContent = role === 'CUSTOMER' ? 'Tài Khoản Khách Hàng' : (role || 'Thành viên');

            // Bấm vào tên account -> Hiển thị/Ẩn menu chứa nút Đăng xuất
            if (userProfileBtn) {
                userProfileBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (userDropdownMenu) {
                        const isVisible = userDropdownMenu.style.display === 'block';
                        userDropdownMenu.style.display = isVisible ? 'none' : 'block';
                    }
                });
            }

            // Đóng dropdown menu khi bấm ra ngoài
            document.addEventListener('click', (e) => {
                if (userDropdownMenu && !e.target.closest('.user-profile-container')) {
                    userDropdownMenu.style.display = 'none';
                }
            });

            // Xử lý sự kiện bấm nút Đăng Xuất
            if (btnLogout) {
                btnLogout.addEventListener('click', () => {
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
                    // Clear dữ liệu nhạy cảm của Seller (Fix bảo mật)
                    localStorage.removeItem('myShopStatus');
                    localStorage.removeItem('myShopId');
                    localStorage.removeItem('myShopName');
                    localStorage.removeItem('mySellerId');
                    // Clear các dữ liệu nhạy cảm khác nếu có
                    Object.keys(localStorage).forEach(key => {
                        if (key.startsWith('myShop') || key.startsWith('seller') || key.startsWith('shop_')) {
                            localStorage.removeItem(key);
                        }
                    });

                    showToast('Đã đăng xuất tài khoản thành công!');
                    setTimeout(() => {
                        window.location.reload();
                    }, 800);
                });
            }
        } else {
            // Chưa đăng nhập: Hiển thị đầy đủ giao diện mặc định
            if (sellerLink) sellerLink.style.display = '';
            if (sellerDivider) sellerDivider.style.display = '';
            if (adminLink) adminLink.style.display = '';
            if (adminDivider) adminDivider.style.display = '';

            if (navLoginItem) navLoginItem.style.display = '';
            if (navRegisterItem) navRegisterItem.style.display = '';

            if (headerUserName) headerUserName.textContent = 'Đăng Nhập';
            if (headerUserStatus) headerUserStatus.textContent = '';
            if (userDropdownMenu) userDropdownMenu.style.display = 'none';
        }
    }

    // =========================================================================
    // 5. GỌI API DANH MỤC VÀ SẢN PHẨM & NẠP VÀO GIAO DIỆN
    // =========================================================================
    const categoryThemes = [
        { color: 'green', banner: 'green-banner', tag: 'green-tag', emoji: '📗' },
        { color: 'orange', banner: 'orange-banner', tag: 'orange-tag', emoji: '📙' },
        { color: 'purple', banner: 'purple-banner', tag: 'purple-tag', emoji: '📚' },
        { color: 'blue', banner: 'green-banner', tag: 'green-tag', emoji: '💡' },
        { color: 'rose', banner: 'orange-banner', tag: 'orange-tag', emoji: '✨' }
    ];

    function getCategoryTheme(index) {
        return categoryThemes[index % categoryThemes.length];
    }

    async function loadCategories() {
        const selectElement = document.getElementById('globalCategorySelect');
        const filterTabsBar = document.getElementById('filterTabsBar');
        const categoryHighlightGrid = document.getElementById('categoryHighlightGrid');

        try {
            const response = await fetch(API_CATEGORIES);
            if (!response.ok) return;

            const data = await response.json();
            if (Array.isArray(data) && data.length > 0) {
                allCategories = data;

                // 1. Nạp vào dropdown select trên header
                if (selectElement) {
                    selectElement.innerHTML = `<option value="ALL">Tất cả danh mục</option>`;
                    allCategories.forEach(cat => {
                        const opt = document.createElement('option');
                        opt.value = cat.categoryId;
                        opt.textContent = cat.categoryName;
                        selectElement.appendChild(opt);
                    });
                }

                // 2. Nạp vào Filter Tabs Bar
                if (filterTabsBar) {
                    filterTabsBar.innerHTML = `
                        <button class="filter-btn active" data-filter="ALL" data-name="TẤT CẢ">
                            ✨ Tất cả danh mục
                        </button>
                    `;

                    allCategories.forEach((cat, idx) => {
                        const theme = getCategoryTheme(idx);
                        const btn = document.createElement('button');
                        btn.className = 'filter-btn';
                        btn.setAttribute('data-filter', cat.categoryId);
                        btn.setAttribute('data-name', cat.categoryName.toUpperCase());
                        btn.innerHTML = `${theme.emoji} ${cat.categoryName}`;
                        filterTabsBar.appendChild(btn);
                    });

                    // Gắn lại sự kiện cho các nút tab mới nạp
                    filterTabsBar.querySelectorAll('.filter-btn').forEach(btn => {
                        btn.addEventListener('click', () => {
                            const cat = btn.getAttribute('data-filter');
                            const name = btn.getAttribute('data-name');
                            filterCategory(cat, name);
                        });
                    });
                }

                // 3. Nạp vào 3 Card danh mục nổi bật
                if (categoryHighlightGrid) {
                    categoryHighlightGrid.innerHTML = allCategories.slice(0, 3).map((cat, idx) => {
                        const theme = getCategoryTheme(idx);
                        return `
                            <div class="cat-card" data-category="${cat.categoryId}">
                                <div class="cat-icon-box ${theme.color}">
                                    ${theme.emoji}
                                </div>
                                <div class="cat-info">
                                    <h3 class="cat-title">${cat.categoryName.toUpperCase()}</h3>
                                    <p class="cat-desc">${cat.description || 'Khám phá sản phẩm chất lượng cao.'}</p>
                                    <span class="cat-link">MUA NGAY →</span>
                                </div>
                            </div>
                        `;
                    }).join('');

                    categoryHighlightGrid.querySelectorAll('.cat-card').forEach(card => {
                        card.addEventListener('click', (e) => {
                            e.preventDefault();
                            const cat = card.getAttribute('data-category');
                            const title = card.querySelector('.cat-title')?.textContent || cat;
                            filterCategory(cat, title);
                        });
                    });
                }
            }
        } catch (error) {
            console.error('Lỗi khi nạp danh mục:', error);
        }
    }

    async function loadProducts() {
        const blocksContainer = document.getElementById('categoryBlocksContainer');
        if (!blocksContainer) return;

        try {
            const response = await fetch(API_PRODUCTS);
            if (!response.ok) return;

            const result = await response.json();
            const productsList = result.data || result.Data || [];

            if (Array.isArray(productsList) && productsList.length > 0) {
                allProducts = productsList;
                window.allProductsData = productsList;

                // Nhóm sản phẩm theo categoryId
                const productsByCategory = {};
                productsList.forEach(p => {
                    const catId = p.categoryId || 'OTHER';
                    if (!productsByCategory[catId]) {
                        productsByCategory[catId] = {
                            categoryId: catId,
                            categoryName: p.categoryName || 'Sản Phẩm Khác',
                            items: []
                        };
                    }
                    productsByCategory[catId].items.push(p);
                });

                const categoryKeys = Object.keys(productsByCategory);
                let blocksHtml = '';

                categoryKeys.forEach((catKey, index) => {
                    const group = productsByCategory[catKey];
                    const theme = getCategoryTheme(index);
                    const catInfo = allCategories.find(c => c.categoryId === catKey);
                    const catDesc = catInfo?.description || `Các sản phẩm nổi bật thuộc danh mục ${group.categoryName}`;

                    const productsCardsHtml = group.items.map((prod, pIdx) => {
                        const imgUrl = formatImgUrl(prod.image);
                        const priceFormatted = formatPrice(prod.price);
                        const sellerName = prod.shop?.shopName || 'Gian Hàng NPKL';
                        const prodElementId = `product-item-${prod.productId || `${catKey}-${pIdx}`}`;

                        return `
                            <div class="product-card" id="${prodElementId}" data-id="${prod.productId}" data-category="${catKey}">
                                <div class="product-image-box">
                                    <span class="category-tag ${theme.tag}">${group.categoryName}</span>
                                    <img src="${imgUrl}" alt="${prod.productName}" onerror="this.src='images/dac_nhan_tam.jpg'" />
                                    <button class="wishlist-btn" title="Yêu thích">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                        </svg>
                                    </button>
                                </div>
                                <h3 class="product-title" title="${prod.productName}">${prod.productName}</h3>
                                <p class="product-author">${sellerName}</p>
                                <div class="rating-box">
                                    <span class="stars">★★★★★</span>
                                    <span class="reviews-count">(5.0)</span>
                                </div>
                                <div class="product-price">${priceFormatted}</div>
                                <button class="btn-add-cart">
                                    🛒 THÊM VÀO GIỎ
                                </button>
                            </div>
                        `;
                    }).join('');

                    blocksHtml += `
                        <div class="category-block-section" id="section-${catKey}" data-category-block="${catKey}">
                            <div class="category-banner-header ${theme.banner}">
                                <div class="banner-title-group">
                                    <span class="category-emoji">${theme.emoji}</span>
                                    <div>
                                        <h3 class="category-block-title">${group.categoryName.toUpperCase()}</h3>
                                        <p class="category-block-desc">${catDesc}</p>
                                    </div>
                                </div>
                                <button class="btn-view-more" data-category="${catKey}" data-name="${group.categoryName.toUpperCase()}">
                                    Xem tất cả ${group.categoryName} →
                                </button>
                            </div>

                            <div class="products-grid">
                                ${productsCardsHtml}
                            </div>
                        </div>
                    `;
                });

                blocksContainer.innerHTML = blocksHtml;

                // Gắn sự kiện cho các nút "Xem tất cả"
                blocksContainer.querySelectorAll('.btn-view-more').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const cat = btn.getAttribute('data-category');
                        const name = btn.getAttribute('data-name');
                        filterCategory(cat, name);
                    });
                });

                paintActiveWishlistButtons();
            } else {
                allProducts = [];
                window.allProductsData = [];
                blocksContainer.innerHTML = `
                    <div style="text-align: center; padding: 48px 16px; color: #64748B;">
                        <div style="font-size: 2.5rem; margin-bottom: 8px;">📦</div>
                        <p style="font-size: 1.05rem; font-weight: 600;">Hiện tại chưa có sản phẩm nào đang mở bán trên sàn.</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Lỗi khi nạp sản phẩm:', error);
            blocksContainer.innerHTML = `
                <div style="text-align: center; padding: 48px 16px; color: #EF4444;">
                    <p style="font-size: 0.95rem; font-weight: 600;">⚠️ Không thể kết nối tới máy chủ để tải sản phẩm.</p>
                </div>
            `;
        }
    }

    // ---------------- Khởi Chạy Ban Đầu ----------------
    initUserAuthState();
    loadCategories().then(() => {
        loadProducts();
    });
});
