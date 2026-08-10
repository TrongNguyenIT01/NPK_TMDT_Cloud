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

    // 3. Category Filtering Core Logic
    const productCards = document.querySelectorAll('.product-card');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const categoryCards = document.querySelectorAll('.cat-card');
    const navCategoryLinks = document.querySelectorAll('.nav-category-trigger');
    const dropdownItems = document.querySelectorAll('.dropdown-item');
    const sectionTitle = document.querySelector('#sectionTitle');
    const productsSection = document.querySelector('#bestsellers');

    function filterCategory(categoryKey, displayName) {
        // 1. Filter product cards
        let visibleCount = 0;
        productCards.forEach(card => {
            const cardCat = card.getAttribute('data-category');
            if (categoryKey === 'ALL' || cardCat === categoryKey) {
                card.style.display = 'flex';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });

        // 2. Update Filter Tabs active state
        filterBtns.forEach(btn => {
            if (btn.getAttribute('data-filter') === categoryKey) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // 3. Update Category Cards active state
        categoryCards.forEach(card => {
            if (card.getAttribute('data-category') === categoryKey) {
                card.classList.add('active-cat');
            } else {
                card.classList.remove('active-cat');
            }
        });

        // 4. Update Header Section Title
        if (sectionTitle) {
            if (categoryKey === 'ALL') {
                sectionTitle.textContent = 'SẢN PHẨM BÁN CHẠY';
            } else {
                sectionTitle.textContent = `SẢN PHẨM: ${displayName || categoryKey}`;
            }
        }

        // 5. Scroll to Products Section smoothly
        if (productsSection) {
            productsSection.scrollIntoView({ behavior: 'smooth' });
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

    // Bind Category Cards ("MUA NGAY →")
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

    // 4. Search Filter Logic
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            productCards.forEach(card => {
                const title = card.querySelector('.product-title').textContent.toLowerCase();
                const author = card.querySelector('.product-author').textContent.toLowerCase();
                const catTag = card.querySelector('.category-tag') ? card.querySelector('.category-tag').textContent.toLowerCase() : '';

                if (title.includes(query) || author.includes(query) || catTag.includes(query)) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
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
});
