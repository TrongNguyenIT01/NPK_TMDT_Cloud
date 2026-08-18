using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using TMDT_FINAL_NPKL.Entities;
using TMDT_FINAL_NPKL.Models;

namespace TMDT_FINAL_NPKL.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class DonHangController : ControllerBase
    {
        private readonly WebTmdtContext _context;

        public DonHangController(WebTmdtContext context)
        {
            _context = context;
        }

        // Helper: Lấy userId từ Claims Token
        private string? GetCurrentUserId()
        {
            return User.FindFirst("UserId")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        }

        // Helper: Lấy User Role
        private string? GetCurrentUserRole()
        {
            return User.FindFirst("Role")?.Value ?? User.FindFirst(ClaimTypes.Role)?.Value;
        }

        // Helper Map Order Entity sang Response DTO
        private DonHangResponseDto MapToDonHangResponse(Order order)
        {
            var payment = order.Payments.FirstOrDefault();
            return new DonHangResponseDto
            {
                OrderId = order.OrderId,
                CustomerId = order.CustomerId,
                CustomerName = order.Customer?.FullName ?? order.Customer?.Username,
                ShopId = order.ShopId,
                ShopName = order.Shop?.ShopName,
                OrderDate = order.OrderDate,
                TotalAmount = order.TotalAmount,
                ShippingAddress = order.ShippingAddress,
                Status = order.Status,
                Payment = payment == null ? null : new ThanhToanDonHangDto
                {
                    PaymentId = payment.PaymentId,
                    OrderId = payment.OrderId,
                    Amount = payment.Amount,
                    PaymentMethod = payment.PaymentMethod,
                    PaymentStatus = payment.PaymentStatus,
                    PaidAt = payment.PaidAt
                },
                OrderDetails = order.OrderDetails.Select(od => new ChiTietSanPhamDonHangDto
                {
                    DetailId = od.DetailId,
                    ProductId = od.ProductId,
                    ProductName = od.Product?.ProductName ?? "Sản phẩm",
                    ProductImage = od.Product?.Image,
                    Quantity = od.Quantity,
                    Price = od.Price
                }).ToList()
            };
        }

        // 1. POST: API Đặt hàng (Đặt các sản phẩm từ giỏ hàng)
        [HttpPost("dat-hang")]
        public async Task<IActionResult> DatHang([FromBody] TaoDonHangRequest request)
        {
            try
            {
                if (request == null || string.IsNullOrWhiteSpace(request.ShippingAddress))
                {
                    return BadRequest(new { Success = false, Message = "Vui lòng nhập địa chỉ giao hàng hợp lệ!" });
                }

                string? userId = GetCurrentUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { Success = false, Message = "Vui lòng đăng nhập để thực hiện đặt hàng!" });
                }

                // Truy vấn giỏ hàng của người dùng kèm sản phẩm, shop & chủ shop
                var cart = await _context.Carts
                    .Include(c => c.CartItems)
                        .ThenInclude(ci => ci.Product)
                            .ThenInclude(p => p.Shop)
                                .ThenInclude(s => s.Seller)
                    .FirstOrDefaultAsync(c => c.CustomerId == userId);

                if (cart == null || !cart.CartItems.Any())
                {
                    return BadRequest(new { Success = false, Message = "Giỏ hàng của bạn đang trống!" });
                }

                // Lọc danh sách mặt hàng chọn đặt hàng
                var itemsToOrder = cart.CartItems.AsEnumerable();
                if (request.SelectedProductIds != null && request.SelectedProductIds.Any())
                {
                    itemsToOrder = itemsToOrder.Where(ci => request.SelectedProductIds.Contains(ci.ProductId));
                }

                var activeItems = itemsToOrder.ToList();
                if (!activeItems.Any())
                {
                    return BadRequest(new { Success = false, Message = "Không tìm thấy sản phẩm hợp lệ trong giỏ hàng để đặt hàng!" });
                }

                // Kiểm tra trạng thái sản phẩm, gian hàng, chủ gian hàng & số lượng tồn kho
                foreach (var item in activeItems)
                {
                    if (item.Product == null || item.Product.IsDeleted || item.Product.ApprovalStatus != "APPROVED"
                        || item.Product.Shop == null || item.Product.Shop.Status != "ACTIVE"
                        || item.Product.Shop.Seller == null || item.Product.Shop.Seller.Status != "ACTIVE")
                    {
                        return BadRequest(new { Success = false, Message = $"Sản phẩm '{item.Product?.ProductName ?? item.ProductId}' thuộc gian hàng đang bị tạm khóa hoặc ngừng kinh doanh, không thể đặt hàng!" });
                    }

                    if (item.Product.StockQuantity < item.Quantity)
                    {
                        return BadRequest(new
                        {
                            Success = false,
                            Message = $"Sản phẩm '{item.Product.ProductName}' không đủ tồn kho (Còn lại: {item.Product.StockQuantity}, Yêu cầu: {item.Quantity})!"
                        });
                    }
                }

                // Phân nhóm sản phẩm theo ShopId (Mỗi shop sẽ có 1 đơn hàng độc lập)
                var itemsByShop = activeItems.GroupBy(ci => ci.Product.ShopId).ToList();
                var createdOrderIds = new List<string>();

                // Sử dụng Transaction CSDL để đảm bảo tính toàn vẹn dữ liệu
                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    foreach (var shopGroup in itemsByShop)
                    {
                        string shopId = shopGroup.Key;
                        var shopCartItems = shopGroup.ToList();
                        decimal orderTotal = shopCartItems.Sum(ci => ci.Quantity * ci.Product.Price);

                        // 1. Tạo bản ghi Đơn hàng (Order)
                        string orderId = GenID.GenerateOrderId();
                        createdOrderIds.Add(orderId);

                        var order = new Order
                        {
                            OrderId = orderId,
                            CustomerId = userId,
                            ShopId = shopId,
                            OrderDate = DateTime.Now,
                            TotalAmount = orderTotal,
                            ShippingAddress = request.ShippingAddress.Trim(),
                            Status = "PENDING" // Trạng thái mặc định là PENDING theo yêu cầu
                        };

                        await _context.Orders.AddAsync(order);

                        // 2. Tạo bản ghi Chi tiết đơn hàng (OrderDetail) & Trừ tồn kho sản phẩm
                        foreach (var ci in shopCartItems)
                        {
                            var orderDetail = new OrderDetail
                            {
                                DetailId = GenID.GenerateOrderDetailId(),
                                OrderId = orderId,
                                ProductId = ci.ProductId,
                                Quantity = ci.Quantity,
                                Price = ci.Product.Price
                            };

                            await _context.OrderDetails.AddAsync(orderDetail);

                            // Trừ số lượng tồn kho sản phẩm
                            ci.Product.StockQuantity -= ci.Quantity;
                        }

                        // 3. Tạo bản ghi Thanh toán (Payment) với trạng thái PENDING (Chờ thanh toán / Chưa thanh toán) hợp lệ với CK_payments_status
                        var payment = new Payment
                        {
                            PaymentId = GenID.GeneratePaymentId(),
                            OrderId = orderId,
                            Amount = orderTotal,
                            PaymentMethod = string.IsNullOrWhiteSpace(request.PaymentMethod) ? "COD" : request.PaymentMethod.Trim(),
                            PaymentStatus = "PENDING", // Trạng thái hợp lệ với CK_payments_status ('PENDING', 'PAID', 'FAILED')
                            PaidAt = null
                        };

                        await _context.Payments.AddAsync(payment);

                        // 4. Xóa các mục đã đặt khỏi giỏ hàng người dùng
                        _context.CartItems.RemoveRange(shopCartItems);
                    }

                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();
                }
                catch (DbUpdateException dbEx)
                {
                    await transaction.RollbackAsync();
                    string detailError = dbEx.InnerException?.Message ?? dbEx.Message;
                    return StatusCode(500, new { Success = false, Message = "Lỗi CSDL khi đặt hàng: " + detailError });
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    string detailError = ex.InnerException?.Message ?? ex.Message;
                    return StatusCode(500, new { Success = false, Message = "Lỗi khi xử lý đặt hàng: " + detailError });
                }

                // Truy vấn lại thông tin đơn hàng vừa tạo để trả về đầy đủ cho Frontend
                var fullOrders = await _context.Orders
                    .Include(o => o.Customer)
                    .Include(o => o.Shop)
                    .Include(o => o.Payments)
                    .Include(o => o.OrderDetails)
                        .ThenInclude(od => od.Product)
                    .Where(o => o.CustomerId == userId && createdOrderIds.Contains(o.OrderId))
                    .OrderByDescending(o => o.OrderDate)
                    .ToListAsync();

                var responseList = fullOrders.Select(MapToDonHangResponse).ToList();

                return Ok(new
                {
                    Success = true,
                    Message = "Đặt hàng thành công!",
                    TotalOrdersCreated = responseList.Count,
                    Data = responseList
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi khi xử lý đặt hàng: " + ex.Message });
            }
        }

        // 2. GET: Danh sách đơn hàng của tôi (Dành cho Khách hàng - có hỗ trợ lọc status & search)
        [HttpGet("my-orders")]
        public async Task<IActionResult> GetMyOrders([FromQuery] string? status, [FromQuery] string? search)
        {
            try
            {
                string? userId = GetCurrentUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { Success = false, Message = "Vui lòng đăng nhập!" });
                }

                var query = _context.Orders
                    .Include(o => o.Customer)
                    .Include(o => o.Shop)
                    .Include(o => o.Payments)
                    .Include(o => o.OrderDetails)
                        .ThenInclude(od => od.Product)
                    .Where(o => o.CustomerId == userId)
                    .AsQueryable();

                if (!string.IsNullOrWhiteSpace(status) && status.Trim().ToUpper() != "ALL")
                {
                    string cleanStatus = status.Trim().ToUpper();
                    query = query.Where(o => o.Status.ToUpper() == cleanStatus);
                }

                if (!string.IsNullOrWhiteSpace(search))
                {
                    string keyword = search.Trim().ToLower();
                    query = query.Where(o => o.OrderId.ToLower().Contains(keyword) ||
                                             o.OrderDetails.Any(od => od.Product != null && od.Product.ProductName.ToLower().Contains(keyword)));
                }

                var orders = await query.OrderByDescending(o => o.OrderDate).ToListAsync();
                var result = orders.Select(MapToDonHangResponse).ToList();

                return Ok(new
                {
                    Success = true,
                    Message = "Lấy danh sách đơn hàng thành công.",
                    TotalCount = result.Count,
                    Data = result
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi máy chủ: " + ex.Message });
            }
        }

        // 3. GET: Danh sách đơn hàng gửi tới Shop (Dành cho Người bán - Seller - có hỗ trợ lọc status & search)
        [HttpGet("shop-orders")]
        public async Task<IActionResult> GetShopOrders([FromQuery] string? status, [FromQuery] string? search)
        {
            try
            {
                string? userId = GetCurrentUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { Success = false, Message = "Vui lòng đăng nhập!" });
                }

                // Tìm gian hàng của Seller
                var shop = await _context.Shops.FirstOrDefaultAsync(s => s.SellerId == userId);
                if (shop == null)
                {
                    return NotFound(new { Success = false, Message = "Tài khoản của bạn chưa đăng ký cửa hàng!" });
                }

                var query = _context.Orders
                    .Include(o => o.Customer)
                    .Include(o => o.Shop)
                    .Include(o => o.Payments)
                    .Include(o => o.OrderDetails)
                        .ThenInclude(od => od.Product)
                    .Where(o => o.ShopId == shop.ShopId)
                    .AsQueryable();

                if (!string.IsNullOrWhiteSpace(status) && status.Trim().ToUpper() != "ALL")
                {
                    string cleanStatus = status.Trim().ToUpper();
                    query = query.Where(o => o.Status.ToUpper() == cleanStatus);
                }

                if (!string.IsNullOrWhiteSpace(search))
                {
                    string keyword = search.Trim().ToLower();
                    query = query.Where(o => o.OrderId.ToLower().Contains(keyword) ||
                                             (o.Customer != null && (o.Customer.FullName.ToLower().Contains(keyword) || o.Customer.Username.ToLower().Contains(keyword) || (o.Customer.Phone != null && o.Customer.Phone.Contains(keyword)))) ||
                                             o.OrderDetails.Any(od => od.Product != null && od.Product.ProductName.ToLower().Contains(keyword)));
                }

                var orders = await query.OrderByDescending(o => o.OrderDate).ToListAsync();
                var result = orders.Select(MapToDonHangResponse).ToList();

                return Ok(new
                {
                    Success = true,
                    Message = "Lấy danh sách đơn hàng của Shop thành công.",
                    TotalCount = result.Count,
                    Data = result
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi máy chủ: " + ex.Message });
            }
        }

        // 3.5. GET: Tất cả đơn hàng toàn sàn (Dành cho Quản trị viên - Admin - Lọc nâng cao & Thống kê)
        [HttpGet("admin/all-orders")]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> GetAdminAllOrders([FromQuery] TimKiemDonHangFilter filter)
        {
            try
            {
                var query = _context.Orders
                    .Include(o => o.Customer)
                    .Include(o => o.Shop)
                    .Include(o => o.Payments)
                    .Include(o => o.OrderDetails)
                        .ThenInclude(od => od.Product)
                    .AsQueryable();

                // 1. Lọc theo trạng thái đơn hàng
                if (!string.IsNullOrWhiteSpace(filter?.Status) && filter.Status.Trim().ToUpper() != "ALL")
                {
                    string cleanStatus = filter.Status.Trim().ToUpper();
                    query = query.Where(o => o.Status.ToUpper() == cleanStatus);
                }

                // 2. Lọc theo ShopId
                if (!string.IsNullOrWhiteSpace(filter?.ShopId) && filter.ShopId.Trim().ToUpper() != "ALL")
                {
                    string shopId = filter.ShopId.Trim();
                    query = query.Where(o => o.ShopId == shopId);
                }

                // 3. Lọc từ ngày
                if (filter?.FromDate.HasValue == true)
                {
                    query = query.Where(o => o.OrderDate >= filter.FromDate.Value);
                }

                // 4. Lọc đến ngày (tính đến cuối ngày 23:59:59)
                if (filter?.ToDate.HasValue == true)
                {
                    DateTime toDateEnd = filter.ToDate.Value.Date.AddDays(1).AddTicks(-1);
                    query = query.Where(o => o.OrderDate <= toDateEnd);
                }

                // 5. Tìm kiếm từ khóa (Mã đơn, Tên người mua, SĐT người mua, Tên Shop, Tên Sản phẩm)
                if (!string.IsNullOrWhiteSpace(filter?.SearchKeyword))
                {
                    string kw = filter.SearchKeyword.Trim().ToLower();
                    query = query.Where(o => o.OrderId.ToLower().Contains(kw) ||
                                             (o.Customer != null && (o.Customer.FullName.ToLower().Contains(kw) || o.Customer.Username.ToLower().Contains(kw) || (o.Customer.Phone != null && o.Customer.Phone.Contains(kw)))) ||
                                             (o.Shop != null && o.Shop.ShopName.ToLower().Contains(kw)) ||
                                             o.OrderDetails.Any(od => od.Product != null && od.Product.ProductName.ToLower().Contains(kw)));
                }

                var orders = await query.OrderByDescending(o => o.OrderDate).ToListAsync();
                var mappedOrders = orders.Select(MapToDonHangResponse).ToList();

                // Thống kê dữ liệu toàn sàn
                var allOrdersList = await _context.Orders.ToListAsync();
                var stats = new ThongKeDonHangAdminDto
                {
                    TongSoDonHang = allOrdersList.Count,
                    TongDoanhThu = allOrdersList.Where(o => o.Status == "DELIVERED").Sum(o => o.TotalAmount),
                    SoDonPending = allOrdersList.Count(o => o.Status == "PENDING"),
                    SoDonConfirmed = allOrdersList.Count(o => o.Status == "CONFIRMED"),
                    SoDonShipping = allOrdersList.Count(o => o.Status == "SHIPPING"),
                    SoDonDelivered = allOrdersList.Count(o => o.Status == "DELIVERED"),
                    SoDonCancelled = allOrdersList.Count(o => o.Status == "CANCELLED")
                };

                return Ok(new
                {
                    Success = true,
                    Message = "Lấy toàn bộ danh sách đơn hàng toàn sàn thành công.",
                    TotalFilteredCount = mappedOrders.Count,
                    Statistics = stats,
                    Data = mappedOrders
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi khi lấy danh sách đơn hàng Admin: " + ex.Message });
            }
        }

        // 4. GET: Xem chi tiết một đơn hàng theo OrderId
        [HttpGet("{orderId}")]
        public async Task<IActionResult> GetOrderDetail(string orderId)
        {
            try
            {
                string? userId = GetCurrentUserId();
                string? userRole = GetCurrentUserRole();

                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { Success = false, Message = "Vui lòng đăng nhập!" });
                }

                var order = await _context.Orders
                    .Include(o => o.Customer)
                    .Include(o => o.Shop)
                    .Include(o => o.Payments)
                    .Include(o => o.OrderDetails)
                        .ThenInclude(od => od.Product)
                    .FirstOrDefaultAsync(o => o.OrderId == orderId);

                if (order == null)
                {
                    return NotFound(new { Success = false, Message = "Không tìm thấy đơn hàng!" });
                }

                // Phân quyền: Khách sở hữu đơn, Seller sở hữu shop của đơn đó, hoặc Admin mới có quyền xem
                bool isCustomer = (order.CustomerId == userId);
                bool isSeller = (order.Shop != null && order.Shop.SellerId == userId);
                bool isAdmin = (userRole == "ADMIN");

                if (!isCustomer && !isSeller && !isAdmin)
                {
                    return Forbid();
                }

                return Ok(new
                {
                    Success = true,
                    Data = MapToDonHangResponse(order)
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi máy chủ: " + ex.Message });
            }
        }

        // 5. PUT: Khách hàng Hủy đơn hàng (Chỉ khi Status = PENDING)
        [HttpPut("{orderId}/cancel")]
        public async Task<IActionResult> HuyDonHang(string orderId)
        {
            try
            {
                string? userId = GetCurrentUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { Success = false, Message = "Vui lòng đăng nhập!" });
                }

                var order = await _context.Orders
                    .Include(o => o.Payments)
                    .Include(o => o.OrderDetails)
                        .ThenInclude(od => od.Product)
                    .FirstOrDefaultAsync(o => o.OrderId == orderId);

                if (order == null)
                {
                    return NotFound(new { Success = false, Message = "Không tìm thấy đơn hàng!" });
                }

                // Chỉ người đặt mới được quyền hủy đơn qua API này
                if (order.CustomerId != userId)
                {
                    return BadRequest(new { Success = false, Message = "Bạn không có quyền hủy đơn hàng này!" });
                }

                if (order.Status != "PENDING")
                {
                    return BadRequest(new { Success = false, Message = $"Đơn hàng đang ở trạng thái '{order.Status}', không thể hủy!" });
                }

                // Cập nhật trạng thái CANCELLED & Hoàn lại số lượng tồn kho
                order.Status = "CANCELLED";
                foreach (var detail in order.OrderDetails)
                {
                    if (detail.Product != null)
                    {
                        detail.Product.StockQuantity += detail.Quantity;
                    }
                }

                // Cập nhật trạng thái thanh toán thành FAILED khi hủy đơn
                var payment = order.Payments.FirstOrDefault();
                if (payment != null)
                {
                    payment.PaymentStatus = "FAILED";
                }

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    Success = true,
                    Message = "Đã hủy đơn hàng thành công!",
                    OrderId = order.OrderId,
                    Status = order.Status
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi khi hủy đơn hàng: " + ex.Message });
            }
        }

        // 6. PUT: Seller cập nhật trạng thái đơn hàng (Chủ động cập nhật theo tình hình thực tế)
        [HttpPut("{orderId}/status")]
        public async Task<IActionResult> CapNhatTrangThaiDonHang(string orderId, [FromBody] CapNhatTrangThaiDonHangRequest request)
        {
            try
            {
                if (request == null || string.IsNullOrWhiteSpace(request.Status))
                {
                    return BadRequest(new { Success = false, Message = "Vui lòng cung cấp trạng thái mới!" });
                }

                string? userId = GetCurrentUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { Success = false, Message = "Vui lòng đăng nhập!" });
                }

                string newStatus = request.Status.Trim().ToUpper();
                string[] validStatuses = { "CANCELLED", "DELIVERED", "SHIPPING", "CONFIRMED", "PENDING" };
                if (!validStatuses.Contains(newStatus))
                {
                    return BadRequest(new { Success = false, Message = "Trạng thái không hợp lệ! Các trạng thái cho phép: PENDING, CONFIRMED, SHIPPING, DELIVERED, CANCELLED." });
                }

                var order = await _context.Orders
                    .Include(o => o.Shop)
                    .Include(o => o.Payments)
                    .Include(o => o.OrderDetails)
                        .ThenInclude(od => od.Product)
                    .FirstOrDefaultAsync(o => o.OrderId == orderId);

                if (order == null)
                {
                    return NotFound(new { Success = false, Message = "Không tìm thấy đơn hàng!" });
                }

                // Kiểm tra xem user có phải Seller sở hữu Shop của đơn hàng này không
                bool isSellerOfShop = (order.Shop != null && order.Shop.SellerId == userId);
                if (!isSellerOfShop)
                {
                    return BadRequest(new { Success = false, Message = "Chỉ Người bán (Seller) sở hữu đơn hàng mới có quyền chủ động cập nhật trạng thái!" });
                }

                if (order.Shop != null && order.Shop.Status != "ACTIVE")
                {
                    return BadRequest(new { Success = false, Message = "Gian hàng của bạn hiện đang bị khóa hoặc tạm nghỉ, không thể cập nhật trạng thái đơn hàng!" });
                }

                string oldStatus = order.Status;

                // KHÓA TRẠNG THÁI: Nếu đơn đã ở CANCELLED -> Không cho phép đổi sang bất kỳ trạng thái nào khác!
                if (oldStatus == "CANCELLED")
                {
                    return BadRequest(new { Success = false, Message = "Đơn hàng này đã bị hủy, không thể thay đổi trạng thái nữa!" });
                }

                // Nếu chuyển sang CANCELLED mà trước đó chưa CANCELLED -> Hoàn tồn kho sản phẩm & Đánh dấu PaymentStatus = FAILED
                if (newStatus == "CANCELLED" && oldStatus != "CANCELLED")
                {
                    foreach (var detail in order.OrderDetails)
                    {
                        if (detail.Product != null)
                        {
                            detail.Product.StockQuantity += detail.Quantity;
                        }
                    }

                    var payment = order.Payments.FirstOrDefault();
                    if (payment != null)
                    {
                        payment.PaymentStatus = "FAILED";
                    }
                }

                // Nếu chuyển sang DELIVERED -> Tự động cập nhật PaymentStatus thành PAID (đã thanh toán) hợp lệ với CK_payments_status
                if (newStatus == "DELIVERED")
                {
                    var payment = order.Payments.FirstOrDefault();
                    if (payment != null && (payment.PaymentStatus == "PENDING" || payment.PaymentStatus == "NotPay"))
                    {
                        payment.PaymentStatus = "PAID";
                        payment.PaidAt = DateTime.Now;
                    }
                }

                order.Status = newStatus;
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    Success = true,
                    Message = $"Đã cập nhật trạng thái đơn hàng thành '{newStatus}' thành công!",
                    Data = MapToDonHangResponse(order)
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi khi cập nhật trạng thái đơn hàng: " + ex.Message });
            }
        }
    }
}
