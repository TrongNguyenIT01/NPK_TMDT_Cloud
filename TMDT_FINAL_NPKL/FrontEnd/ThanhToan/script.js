document.addEventListener('DOMContentLoaded', () => {
    // =========================================================================
    // 0. HELPER FUNCTIONS & AUTH CHECK
    // =========================================================================
    function formatVND(number) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
            .format(number)
            .replace('₫', 'đ');
    }

    function parsePrice(priceStr) {
        if (typeof priceStr === 'number') return priceStr;
        return parseInt((priceStr || '0').replace(/[^\d]/g, '')) || 0;
    }

    const token = sessionStorage.getItem('jwtToken') || localStorage.getItem('jwtToken');
    if (!token) {
        alert('Vui lòng đăng nhập để tiến hành đặt hàng & thanh toán!');
        window.location.href = '../DangNhap/index.html';
        return;
    }

    // =========================================================================
    // 1. ĐỒNG BỘ THÔNG TIN NGƯỜI DÙNG LÊN HEADER & FORM
    // =========================================================================
    const displayName = sessionStorage.getItem('fullName') || localStorage.getItem('fullName') || sessionStorage.getItem('userName') || localStorage.getItem('userName') || 'Khách Hàng';
    const userName = sessionStorage.getItem('userName') || localStorage.getItem('userName') || 'khachhang';
    const email = sessionStorage.getItem('email') || localStorage.getItem('email') || '';
    const phone = sessionStorage.getItem('phone') || localStorage.getItem('phone') || '';
    const address = sessionStorage.getItem('address') || localStorage.getItem('address') || '';
    const role = sessionStorage.getItem('userRole') || localStorage.getItem('userRole');

    const headerUserName = document.getElementById('headerUserName');
    const headerUserStatus = document.getElementById('headerUserStatus');
    const dropdownUserName = document.getElementById('dropdownUserName');
    const dropdownUserRole = document.getElementById('dropdownUserRole');

    if (headerUserName) headerUserName.textContent = displayName;
    if (headerUserStatus) headerUserStatus.textContent = role === 'CUSTOMER' ? 'Khách Hàng' : (role || '');
    if (dropdownUserName) dropdownUserName.textContent = displayName;
    if (dropdownUserRole) dropdownUserRole.textContent = role === 'CUSTOMER' ? 'Khách Hàng' : (role || '');

    // Ẩn/Hiện Kênh Người Bán & Quản Trị Admin
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

    // Tự động điền (Auto-fill) thông tin người dùng từ Local/Session Storage trước
    const inputName = document.getElementById('recipientName');
    const inputPhone = document.getElementById('recipientPhone');
    const inputEmail = document.getElementById('recipientEmail');
    const inputAddress = document.getElementById('recipientAddress');

    let userProfileAddress = sessionStorage.getItem('address') || localStorage.getItem('address') || '';
    let isAddressLocked = false;

    const btnToggleDefaultAddress = document.getElementById('btnToggleDefaultAddress');
    const btnAddressText = document.getElementById('btnAddressText');
    const btnAddressIcon = document.querySelector('.btn-address-icon');

    function updateAddressToggleUI() {
        if (!btnToggleDefaultAddress || !inputAddress) return;

        if (isAddressLocked) {
            inputAddress.readOnly = true;
            btnToggleDefaultAddress.classList.add('active');
            if (btnAddressText) btnAddressText.textContent = 'Đã khóa địa chỉ (Bấm để sửa)';
            if (btnAddressIcon) btnAddressIcon.textContent = '🔒';
            btnToggleDefaultAddress.title = 'Bấm để mở khóa và chỉnh sửa địa chỉ';
        } else {
            inputAddress.readOnly = false;
            btnToggleDefaultAddress.classList.remove('active');
            if (btnAddressText) btnAddressText.textContent = 'Dùng địa chỉ tài khoản';
            if (btnAddressIcon) btnAddressIcon.textContent = '📍';
            btnToggleDefaultAddress.title = 'Bấm để giữ nguyên địa chỉ từ tài khoản';
        }
    }

    if (btnToggleDefaultAddress && inputAddress) {
        btnToggleDefaultAddress.addEventListener('click', () => {
            isAddressLocked = !isAddressLocked;

            if (isAddressLocked) {
                if (userProfileAddress) {
                    inputAddress.value = userProfileAddress;
                } else if (!inputAddress.value.trim()) {
                    alert('Tài khoản của bạn chưa có địa chỉ lưu sẵn. Bạn có thể tự nhập địa chỉ bên dưới!');
                    isAddressLocked = false;
                    updateAddressToggleUI();
                    inputAddress.focus();
                    return;
                }
            } else {
                inputAddress.focus();
            }

            updateAddressToggleUI();
        });
    }

    if (inputName && displayName && displayName !== 'Khách Hàng') inputName.value = displayName;
    if (inputPhone && phone) inputPhone.value = phone;
    if (inputEmail && email) inputEmail.value = email;
    if (inputAddress && address) inputAddress.value = address;

    // Tự động tải thông tin người dùng mới nhất từ Backend Profile API để Autofill đầy đủ
    async function loadUserProfileAndAutofill() {
        try {
            const response = await fetch(`${window.location.origin}/api/DangNhap/profile`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const result = await response.json().catch(() => ({}));
                if (result.success || result.Success) {
                    const user = result.data || result.Data;
                    if (user) {
                        const userFullName = user.fullName || user.FullName || '';
                        const userPhone = user.phone || user.Phone || '';
                        const userEmail = user.email || user.Email || '';
                        const userAddress = user.address || user.Address || '';

                        if (inputName && userFullName) inputName.value = userFullName;
                        if (inputPhone && userPhone) inputPhone.value = userPhone;
                        if (inputEmail && userEmail) inputEmail.value = userEmail;
                        if (userAddress) {
                            userProfileAddress = userAddress;
                            if (inputAddress && (!inputAddress.value || isAddressLocked)) {
                                inputAddress.value = userAddress;
                            }
                        }

                        // Đồng bộ lại vào Storage để dùng chung toàn site
                        if (userFullName) {
                            sessionStorage.setItem('fullName', userFullName);
                            localStorage.setItem('fullName', userFullName);
                            if (headerUserName) headerUserName.textContent = userFullName;
                            if (dropdownUserName) dropdownUserName.textContent = userFullName;
                        }
                        if (userEmail) {
                            sessionStorage.setItem('email', userEmail);
                            localStorage.setItem('email', userEmail);
                        }
                        if (userPhone) {
                            sessionStorage.setItem('phone', userPhone);
                            localStorage.setItem('phone', userPhone);
                        }
                        if (userAddress) {
                            sessionStorage.setItem('address', userAddress);
                            localStorage.setItem('address', userAddress);
                        }
                    }
                }
            }
        } catch (err) {
            console.log('Chưa kết nối Backend Profile API, sử dụng dữ liệu bộ nhớ đệm:', err);
        }
    }

    loadUserProfileAndAutofill();

    // Dropdown Profile & Logout
    const userProfileBtn = document.getElementById('userProfileBtn');
    const userDropdownMenu = document.getElementById('userDropdownMenu');

    if (userProfileBtn && userDropdownMenu) {
        userProfileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const isVisible = userDropdownMenu.style.display === 'block';
            userDropdownMenu.style.display = isVisible ? 'none' : 'block';
        });

        document.addEventListener('click', (e) => {
            if (!userProfileBtn.contains(e.target) && !userDropdownMenu.contains(e.target)) {
                userDropdownMenu.style.display = 'none';
            }
        });
    }

    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
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

    // =========================================================================
    // 2. TẢI VÀ HIỂN THỊ DANH SÁCH SẢN PHẨM TỪ GIỎ HÀNG (CART ITEMS)
    // =========================================================================
    let cartItems = JSON.parse(localStorage.getItem('npkl_cart_items') || '[]');

    // Cập nhật Badge Giỏ Hàng trên Header
    const cartBadge = document.getElementById('cartBadge');
    if (cartBadge) {
        let totalCount = 0;
        cartItems.forEach(item => totalCount += (item.qty || 1));
        cartBadge.textContent = totalCount;
    }

    // Nếu giỏ hàng trống, thông báo và điều hướng về Giỏ Hàng
    if (cartItems.length === 0) {
        alert('Giỏ hàng của bạn đang trống! Vui lòng chọn sản phẩm trước khi thanh toán.');
        window.location.href = '../GioHang/index.html';
        return;
    }

    const checkoutItemsListEl = document.getElementById('checkoutItemsList');
    const checkoutTotalQtyEl = document.getElementById('checkoutTotalQty');
    const checkoutSubtotalEl = document.getElementById('checkoutSubtotal');
    const checkoutShippingEl = document.getElementById('checkoutShipping');
    const checkoutTotalAmountEl = document.getElementById('checkoutTotalAmount');

    const BASE_API_URL = window.location.origin;

    function fixImgSrc(src) {
        if (!src) return '../TrangChinh/images/dac_nhan_tam.jpg';
        if (src.includes('https://') || src.includes('http://')) {
            const httpIdx = src.indexOf('http');
            return src.substring(httpIdx);
        }
        if (src.startsWith('/images/')) return `${BASE_API_URL}${src}`;
        if (src.startsWith('../TrangChinh/')) return src;
        if (src.startsWith('images/')) return `../TrangChinh/${src}`;
        return `${BASE_API_URL}/images/${src}`;
    }

    let subtotal = 0;
    let totalQty = 0;

    // Render danh sách sản phẩm
    if (checkoutItemsListEl) {
        checkoutItemsListEl.innerHTML = cartItems.map(item => {
            const itemPrice = parsePrice(item.price);
            const itemQty = item.qty || 1;
            const itemTotal = itemPrice * itemQty;
            subtotal += itemTotal;
            totalQty += itemQty;

            const imgSrc = fixImgSrc(item.img);

            return `
                <div class="checkout-item-row">
                    <img src="${imgSrc}" alt="${item.title}" class="checkout-item-thumb" onerror="this.src='../TrangChinh/images/default.png'" />
                    <div class="checkout-item-info">
                        <span class="checkout-item-title">${item.title}</span>
                        <span class="checkout-item-qty-price">${formatVND(itemPrice)} × ${itemQty}</span>
                    </div>
                    <div class="checkout-item-total">${formatVND(itemTotal)}</div>
                </div>
            `;
        }).join('');
    }

    // Phí vận chuyển: Miễn phí nếu >= 300.000đ, ngược lại 30.000đ (đồng bộ 100% với Giỏ Hàng)
    const FREESHIP_THRESHOLD = 300000;
    const STANDARD_SHIPPING = 30000;
    const shippingFee = subtotal >= FREESHIP_THRESHOLD ? 0 : STANDARD_SHIPPING;
    const finalTotal = subtotal + shippingFee;

    if (checkoutTotalQtyEl) checkoutTotalQtyEl.textContent = totalQty;
    if (checkoutSubtotalEl) checkoutSubtotalEl.textContent = formatVND(subtotal);
    if (checkoutShippingEl) {
        checkoutShippingEl.textContent = shippingFee === 0 ? 'Miễn phí (Freeship)' : formatVND(shippingFee);
        if (shippingFee === 0) checkoutShippingEl.style.color = '#10B981';
        else checkoutShippingEl.style.color = '#64748B';
    }
    if (checkoutTotalAmountEl) checkoutTotalAmountEl.textContent = formatVND(finalTotal);

    // =========================================================================
    // 3. XỬ LÝ CHỌN PHƯƠNG THỨC THANH TOÁN (RADIO BUTTONS)
    // =========================================================================
    const paymentOptions = document.querySelectorAll('.payment-option-item');
    const payCodRadio = document.getElementById('payCod');
    const payCodItem = document.querySelector('label[for="payCod"]');

    paymentOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            const radio = option.querySelector('input[type="radio"]');
            const val = radio ? radio.value : '';

            // Nếu người dùng chọn bất kỳ phương thức nào ngoài COD
            if (val !== 'COD') {
                e.preventDefault();
                alert('Tính năng đang trong giai đoạn phát triển');

                // Luôn giữ phương thức Thanh toán khi nhận hàng (COD) được chọn
                paymentOptions.forEach(opt => opt.classList.remove('selected'));
                if (payCodItem) payCodItem.classList.add('selected');
                if (payCodRadio) payCodRadio.checked = true;
                return;
            }

            // Xử lý khi chọn COD
            paymentOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            if (radio) radio.checked = true;
        });
    });

    // =========================================================================
    // 4. XỬ LÝ XÁC NHẬN ĐẶT HÀNG (SUBMIT FORM)
    // =========================================================================
    const checkoutForm = document.getElementById('checkoutForm');
    const btnPlaceOrder = document.getElementById('btnPlaceOrder');

    const errorRecipientName = document.getElementById('errorRecipientName');
    const errorRecipientPhone = document.getElementById('errorRecipientPhone');
    const errorRecipientEmail = document.getElementById('errorRecipientEmail');
    const errorRecipientAddress = document.getElementById('errorRecipientAddress');

    function clearValidationErrors() {
        [errorRecipientName, errorRecipientPhone, errorRecipientEmail, errorRecipientAddress].forEach(el => {
            if (el) el.textContent = '';
        });
        [inputName, inputPhone, inputEmail, inputAddress].forEach(input => {
            if (input) input.classList.remove('input-error');
        });
    }

    if (checkoutForm) {
        checkoutForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearValidationErrors();

            const nameVal = inputName ? inputName.value.trim() : '';
            const phoneVal = inputPhone ? inputPhone.value.trim() : '';
            const emailVal = inputEmail ? inputEmail.value.trim() : '';
            const addressVal = inputAddress ? inputAddress.value.trim() : '';

            const selectedPaymentRadio = document.querySelector('input[name="paymentMethod"]:checked');
            const paymentMethodVal = selectedPaymentRadio ? selectedPaymentRadio.value : 'COD';

            let hasError = false;

            // Validate Tên
            if (!nameVal) {
                if (errorRecipientName) errorRecipientName.textContent = 'Vui lòng nhập họ và tên người nhận.';
                if (inputName) inputName.classList.add('input-error');
                hasError = true;
            }

            // Validate Số điện thoại (chuẩn 10 số VN)
            const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
            if (!phoneVal) {
                if (errorRecipientPhone) errorRecipientPhone.textContent = 'Vui lòng nhập số điện thoại người nhận.';
                if (inputPhone) inputPhone.classList.add('input-error');
                hasError = true;
            } else if (!phoneRegex.test(phoneVal.replace(/\s+/g, ''))) {
                if (errorRecipientPhone) errorRecipientPhone.textContent = 'Số điện thoại không đúng định dạng (10 chữ số).';
                if (inputPhone) inputPhone.classList.add('input-error');
                hasError = true;
            }

            // Validate Email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailVal) {
                if (errorRecipientEmail) errorRecipientEmail.textContent = 'Vui lòng nhập email nhận thông báo.';
                if (inputEmail) inputEmail.classList.add('input-error');
                hasError = true;
            } else if (!emailRegex.test(emailVal)) {
                if (errorRecipientEmail) errorRecipientEmail.textContent = 'Email không đúng định dạng.';
                if (inputEmail) inputEmail.classList.add('input-error');
                hasError = true;
            }

            // Validate Địa chỉ
            if (!addressVal) {
                if (errorRecipientAddress) errorRecipientAddress.textContent = 'Vui lòng nhập địa chỉ nhận hàng cụ thể.';
                if (inputAddress) inputAddress.classList.add('input-error');
                hasError = true;
            }

            if (hasError) return;

            // Hiệu ứng Loading nút Đặt hàng
            if (btnPlaceOrder) {
                btnPlaceOrder.innerHTML = '⏳ Đang xử lý đơn hàng...';
                btnPlaceOrder.disabled = true;
            }

            const orderPayload = {
                shippingAddress: addressVal,
                recipientName: nameVal,
                phone: phoneVal,
                email: emailVal,
                paymentMethod: paymentMethodVal,
                selectedProductIds: cartItems.map(item => item.productId || item.id).filter(id => !!id)
            };

            try {
                const response = await fetch(`${BASE_API_URL}/api/DonHang/dat-hang`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(orderPayload)
                });

                const result = await response.json().catch(() => ({}));

                if (!response.ok || !result.success && !result.Success) {
                    alert(result.message || result.Message || 'Đặt hàng thất bại. Vui lòng thử lại!');
                    if (btnPlaceOrder) {
                        btnPlaceOrder.innerHTML = '🚀 XÁC NHẬN ĐẶT HÀNG';
                        btnPlaceOrder.disabled = false;
                    }
                    return;
                }

                // Lấy thông tin mã đơn hàng tạo từ kết quả API
                const createdData = result.data || result.Data || [];
                let displayOrderId = 'NPKL-ORDER';
                if (Array.isArray(createdData) && createdData.length > 0) {
                    displayOrderId = createdData.map(o => o.orderId || o.OrderId).join(', ');
                }

                // Điền thông tin vào Modal Thành Công
                const receiptOrderId = document.getElementById('receiptOrderId');
                const receiptRecipient = document.getElementById('receiptRecipient');
                const receiptPayment = document.getElementById('receiptPayment');
                const receiptTotal = document.getElementById('receiptTotal');

                if (receiptOrderId) receiptOrderId.textContent = '#' + displayOrderId;
                if (receiptRecipient) receiptRecipient.textContent = `${nameVal} (${phoneVal})`;
                if (receiptPayment) {
                    const paymentNames = {
                        'COD': 'Thanh toán khi nhận hàng (COD)',
                        'MOMO': 'Ví Điện Tử MoMo',
                        'VNPAY': 'Cổng Thanh Toán VNPAY / Thẻ ATM',
                        'BANK_TRANSFER': 'Chuyển khoản Ngân Hàng'
                    };
                    receiptPayment.textContent = paymentNames[paymentMethodVal] || paymentMethodVal;
                }
                if (receiptTotal) receiptTotal.textContent = formatVND(finalTotal);

                // Xóa giỏ hàng local sau khi đặt thành công
                localStorage.removeItem('npkl_cart_items');
                localStorage.setItem('npkl_cart_count', '0');

                // Bật hiển thị Modal Đặt Hàng Thành Công
                const orderSuccessModal = document.getElementById('orderSuccessModal');
                if (orderSuccessModal) {
                    orderSuccessModal.style.display = 'flex';
                }
            } catch (err) {
                console.error('Lỗi kết nối API Đặt hàng:', err);
                alert('Có lỗi xảy ra khi kết nối tới máy chủ. Vui lòng thử lại!');
            } finally {
                if (btnPlaceOrder) {
                    btnPlaceOrder.innerHTML = '🚀 XÁC NHẬN ĐẶT HÀNG';
                    btnPlaceOrder.disabled = false;
                }
            }
        });
    }
});
