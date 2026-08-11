document.addEventListener('DOMContentLoaded', () => {
    // 1. Wishlist Interactive Logic
    const wishlistBtns = document.querySelectorAll('.wishlist-btn');
    const wishlistBadge = document.querySelector('#wishlistBadge');
    let wishlistCount = parseInt(wishlistBadge ? wishlistBadge.textContent : '1') || 1;

    wishlistBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const svgIcon = btn.querySelector('svg');
            
            if (btn.classList.contains('active')) {
                btn.classList.remove('active');
                if (svgIcon) svgIcon.setAttribute('fill', 'none');
                wishlistCount = Math.max(0, wishlistCount - 1);
                showToast('Đã xóa khỏi danh sách yêu thích');
            } else {
                btn.classList.add('active');
                if (svgIcon) svgIcon.setAttribute('fill', '#EF4444');
                wishlistCount += 1;
                showToast('Đã thêm vào danh sách yêu thích');
            }

            if (wishlistBadge) wishlistBadge.textContent = wishlistCount;
        });
    });

    // 2. Add to Cart Interactive Logic
    const addCartBtns = document.querySelectorAll('.btn-add-cart');
    const cartBadge = document.querySelector('#cartBadge');
    let cartCount = parseInt(cartBadge ? cartBadge.textContent : '1') || 1;

    addCartBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const productCard = btn.closest('.product-card');
            const productTitle = productCard ? productCard.querySelector('.product-title').textContent : 'Sản phẩm';
            
            cartCount += 1;
            if (cartBadge) cartBadge.textContent = cartCount;

            showToast(`Đã thêm "${productTitle}" vào giỏ hàng!`);
        });
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
});
