document.addEventListener('DOMContentLoaded', () => {
    // 1. Wishlist Interactive Logic
    const wishlistBtns = document.querySelectorAll('.wishlist-btn');
    const wishlistBadge = document.querySelector('#wishlistBadge');
    let wishlistCount = parseInt(wishlistBadge ? wishlistBadge.textContent : '1') || 1;

    wishlistBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
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
            const productCard = btn.closest('.product-card');
            const productTitle = productCard ? productCard.querySelector('.product-title').textContent : 'Sản phẩm';
            
            cartCount += 1;
            if (cartBadge) cartBadge.textContent = cartCount;

            showToast(`Đã thêm "${productTitle}" vào giỏ hàng!`);
        });
    });

    // 3. Search Filter Logic
    const searchInput = document.querySelector('.search-input');
    const productCards = document.querySelectorAll('.product-card');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            productCards.forEach(card => {
                const title = card.querySelector('.product-title').textContent.toLowerCase();
                const author = card.querySelector('.product-author').textContent.toLowerCase();

                if (title.includes(query) || author.includes(query)) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }

    // Toast helper
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
