document.addEventListener('DOMContentLoaded', () => {
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

    function syncBadgesFromStorage() {
        const token = sessionStorage.getItem('jwtToken') || localStorage.getItem('jwtToken');
        if (!token) {
            if (wishlistBadge) wishlistBadge.textContent = '0';
            if (cartBadge) cartBadge.textContent = '0';
            return;
        }

        const wishlist = getStoredWishlist();
        const cart = getStoredCart();

        let totalCartQty = 0;
        cart.forEach(item => totalCartQty += item.qty);

        if (wishlistBadge) wishlistBadge.textContent = wishlist.length;
        if (cartBadge) cartBadge.textContent = totalCartQty;

        localStorage.setItem('npkl_wishlist', JSON.stringify(wishlist));
        localStorage.setItem('npkl_cart_items', JSON.stringify(cart));
        localStorage.setItem('npkl_cart_count', totalCartQty);
    }

    // Initial Badge Sync & Highlight active wishlist hearts
    function paintActiveWishlistButtons() {
        const wishlist = getStoredWishlist();
        document.querySelectorAll('.product-card').forEach(card => {
            const title = card.querySelector('.product-title')?.textContent.trim();
            const btn = card.querySelector('.wishlist-btn');
            const svgIcon = btn ? btn.querySelector('svg') : null;

            if (btn && title) {
                const isLiked = wishlist.some(item => item.title === title);
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

            const svgIcon = wishBtn.querySelector('svg');
            const title = card.querySelector('.product-title')?.textContent.trim() || 'Sản phẩm';
            const author = card.querySelector('.product-author')?.textContent.trim() || '';
            const price = card.querySelector('.product-price')?.textContent.trim() || '0đ';
            const categoryTag = card.querySelector('.category-tag')?.textContent.trim() || 'Sản phẩm';
            const rawImg = card.querySelector('img')?.getAttribute('src') || '';
            const img = rawImg.startsWith('../TrangChinh/') ? rawImg : ('../TrangChinh/' + rawImg.replace(/^\.\//, ''));

            let wishlist = getStoredWishlist();
            const existingIndex = wishlist.findIndex(item => item.title === title);

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

            const title = card.querySelector('.product-title')?.textContent.trim() || 'Sản phẩm';
            const author = card.querySelector('.product-author')?.textContent.trim() || '';
            const priceText = card.querySelector('.product-price')?.textContent.trim() || '0đ';
            const priceNum = parseInt(priceText.replace(/[^\d]/g, '')) || 50000;
            const categoryTag = card.querySelector('.category-tag')?.textContent.trim() || 'Sản phẩm';
            const rawImg = card.querySelector('img')?.getAttribute('src') || '';
            const img = rawImg.startsWith('../TrangChinh/') ? rawImg : ('../TrangChinh/' + rawImg.replace(/^\.\//, ''));

            let cart = getStoredCart();
            const existingItem = cart.find(item => item.title === title);

            if (existingItem) {
                existingItem.qty += 1;
            } else {
                cart.push({
                    id: 'cart-' + Date.now(),
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
    const productCards = document.querySelectorAll('.product-card');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const categoryCards = document.querySelectorAll('.cat-card');
    const navCategoryLinks = document.querySelectorAll('.nav-category-trigger');
    const dropdownItems = document.querySelectorAll('.dropdown-item');
    const viewMoreBtns = document.querySelectorAll('.btn-view-more');
    const sectionTitle = document.querySelector('#sectionTitle');
    const productsSection = document.querySelector('#bestsellers');

    function filterCategory(categoryKey, displayName) {
        // Toggle Category Block Sections (Vertical Layout)
        categoryBlockSections.forEach(section => {
            const blockCat = section.getAttribute('data-category-block');
            if (categoryKey === 'ALL' || blockCat === categoryKey) {
                section.style.display = 'block';
                section.querySelectorAll('.product-card').forEach(card => card.style.display = 'flex');
            } else {
                section.style.display = 'none';
            }
        });

        // Update Filter Tabs active state
        filterBtns.forEach(btn => {
            if (btn.getAttribute('data-filter') === categoryKey) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Update Category Cards active state
        categoryCards.forEach(card => {
            if (card.getAttribute('data-category') === categoryKey) {
                card.classList.add('active-cat');
            } else {
                card.classList.remove('active-cat');
            }
        });

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
            const targetSection = document.querySelector(`#section-${categoryKey.toLowerCase()}`);
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else if (productsSection) {
                productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        } else if (productsSection) {
            productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

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
        const selectedCat = searchCategorySelect ? searchCategorySelect.value.toUpperCase() : 'ALL';

        if (btnClearSearch) {
            btnClearSearch.style.display = cleanQuery.length > 0 ? 'block' : 'none';
        }

        if (!cleanQuery) {
            renderHotSearches();
            return;
        }

        const allProducts = getProductsData();
        const matches = allProducts.filter(p => {
            const matchQuery = p.title.toLowerCase().includes(cleanQuery) ||
                              p.author.toLowerCase().includes(cleanQuery) ||
                              p.categoryTag.toLowerCase().includes(cleanQuery);
            const matchCat = (selectedCat === 'ALL' || selectedCat === 'ALL') || 
                             (selectedCat === 'SACH' && p.category === 'SACH') ||
                             (selectedCat === 'VPP' && p.category === 'VPP') ||
                             (selectedCat === 'COMBO' && p.category === 'COMBO');
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
                        <div class="search-result-item" data-target-id="${p.elementId}">
                            <img src="${p.img}" alt="${p.title}" class="search-item-img" />
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
                const targetCard = document.getElementById(targetId);
                
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
                }
            });
        });

        // Also filter the visible product cards on page in real-time
        filterProductsOnPage(cleanQuery, selectedCat);
    }

    // Filter products visible on the page
    function filterProductsOnPage(query, selectedCat) {
        categoryBlockSections.forEach(section => {
            let sectionHasMatch = false;
            const blockCat = section.getAttribute('data-category-block');
            
            const matchSectionCat = (selectedCat === 'ALL' || selectedCat === 'ALL') || (selectedCat.toUpperCase() === blockCat);

            section.querySelectorAll('.product-card').forEach(card => {
                const title = card.querySelector('.product-title')?.textContent.toLowerCase() || '';
                const author = card.querySelector('.product-author')?.textContent.toLowerCase() || '';
                const catTag = card.querySelector('.category-tag')?.textContent.toLowerCase() || '';

                const matchQuery = !query || title.includes(query) || author.includes(query) || catTag.includes(query);

                if (matchQuery && matchSectionCat) {
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
    }

    // Event 3: Clear button click
    if (btnClearSearch) {
        btnClearSearch.addEventListener('click', (e) => {
            e.stopPropagation();
            if (searchInput) searchInput.value = '';
            btnClearSearch.style.display = 'none';
            if (searchDropdown) searchDropdown.classList.remove('active');
            filterCategory('ALL', 'TẤT CẢ');
        });
    }

    // Event 4: Category Select Dropdown change
    if (searchCategorySelect) {
        searchCategorySelect.addEventListener('change', () => {
            const query = searchInput ? searchInput.value : '';
            triggerLiveSearch(query);
        });
    }

    // Event 5: Search Button Click (MAGNIFYING GLASS CLICK)
    // Perform search & SMOOTH SCROLL DOWN TO SHOPPING SECTION (#bestsellers)
    if (btnExecuteSearch) {
        btnExecuteSearch.addEventListener('click', (e) => {
            e.preventDefault();
            const query = searchInput ? searchInput.value.trim() : '';
            const selectedCat = searchCategorySelect ? searchCategorySelect.value.toUpperCase() : 'ALL';

            // Close live dropdown dropdown
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

    // Event 6: Close dropdown when clicking outside search wrapper
    document.addEventListener('click', (e) => {
        if (searchWrapper && !searchWrapper.contains(e.target)) {
            if (searchDropdown) searchDropdown.classList.remove('active');
        }
    });

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

    // Khởi chạy đồng bộ trạng thái đăng nhập
    initUserAuthState();
});

