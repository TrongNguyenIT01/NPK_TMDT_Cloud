using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
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
    public class GioHangController : ControllerBase
    {
        private readonly WebTmdtContext _context;

        public GioHangController(WebTmdtContext context)
        {
            _context = context;
        }

        // Helper: Lấy userId từ JWT Claim
        private string? GetCurrentUserId()
        {
            return User.FindFirst("UserId")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        }

        // Helper: Lấy hoặc tạo mới Giỏ hàng cho User
        private async Task<Cart> GetOrCreateCartAsync(string userId)
        {
            var cart = await _context.Carts
                .Include(c => c.CartItems)
                    .ThenInclude(ci => ci.Product)
                        .ThenInclude(p => p.Category)
                .Include(c => c.CartItems)
                    .ThenInclude(ci => ci.Product)
                        .ThenInclude(p => p.Shop)
                .FirstOrDefaultAsync(c => c.CustomerId == userId);

            if (cart == null)
            {
                cart = new Cart
                {
                    CartId = GenID.GenerateCartId(),
                    CustomerId = userId,
                    CreatedAt = DateTime.Now
                };
                await _context.Carts.AddAsync(cart);
                await _context.SaveChangesAsync();
            }

            return cart;
        }

        // Helper: Format CartResponse
        private CartResponse BuildCartResponse(Cart cart, string message = "Thành công")
        {
            var activeItems = cart.CartItems
                .Where(ci => ci.Product != null && ci.Product.IsDeleted != true)
                .Select(ci => new CartItemDto
                {
                    CartItemId = ci.CartItemId,
                    ProductId = ci.ProductId,
                    Title = ci.Product.ProductName,
                    Price = ci.Product.Price,
                    Img = ci.Product.Image,
                    Qty = ci.Quantity,
                    StockQuantity = ci.Product.StockQuantity,
                    CategoryTag = ci.Product.Category?.CategoryName ?? "Sản phẩm",
                    Author = ci.Product.Shop?.ShopName ?? "Cửa hàng"
                })
                .ToList();

            return new CartResponse
            {
                Success = true,
                Message = message,
                CartId = cart.CartId,
                TotalItemsCount = activeItems.Sum(i => i.Qty),
                SubtotalAmount = activeItems.Sum(i => i.Subtotal),
                Items = activeItems
            };
        }

        // 1. GET: Lấy danh sách sản phẩm trong giỏ hàng
        [HttpGet]
        public async Task<IActionResult> GetCart()
        {
            try
            {
                string? userId = GetCurrentUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { Success = false, Message = "Vui lòng đăng nhập để xem giỏ hàng!" });
                }

                var cart = await GetOrCreateCartAsync(userId);
                return Ok(BuildCartResponse(cart, "Lấy dữ liệu giỏ hàng thành công."));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi khi lấy giỏ hàng: " + ex.Message });
            }
        }

        // 2. GET: Lấy nhanh số lượng sản phẩm trong giỏ (phục vụ Header Badge)
        [HttpGet("count")]
        public async Task<IActionResult> GetCartCount()
        {
            try
            {
                string? userId = GetCurrentUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    return Ok(new { Success = true, Count = 0 });
                }

                var cart = await _context.Carts
                    .Include(c => c.CartItems)
                    .FirstOrDefaultAsync(c => c.CustomerId == userId);

                int count = cart?.CartItems.Sum(ci => ci.Quantity) ?? 0;
                return Ok(new { Success = true, Count = count });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi khi lấy số lượng giỏ hàng: " + ex.Message });
            }
        }

        // 3. POST: Thêm sản phẩm vào giỏ hàng
        [HttpPost("add")]
        public async Task<IActionResult> AddToCart([FromBody] AddToCartRequest request)
        {
            try
            {
                if (request == null || string.IsNullOrWhiteSpace(request.ProductId) || request.Quantity <= 0)
                {
                    return BadRequest(new { Success = false, Message = "Thông tin sản phẩm hoặc số lượng không hợp lệ!" });
                }

                string? userId = GetCurrentUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { Success = false, Message = "Vui lòng đăng nhập để thêm vào giỏ hàng!" });
                }

                // Kiểm tra sản phẩm có tồn tại và đang hoạt động không
                var product = await _context.Products.FirstOrDefaultAsync(p => p.ProductId == request.ProductId && p.IsDeleted != true && p.ApprovalStatus == "APPROVED");
                if (product == null)
                {
                    return NotFound(new { Success = false, Message = "Sản phẩm không tồn tại hoặc đã ngừng kinh doanh!" });
                }

                var cart = await GetOrCreateCartAsync(userId);

                // Tìm sản phẩm trong giỏ
                var existingItem = cart.CartItems.FirstOrDefault(ci => ci.ProductId == request.ProductId);
                int desiredQty = (existingItem?.Quantity ?? 0) + request.Quantity;

                if (desiredQty > product.StockQuantity)
                {
                    return BadRequest(new
                    {
                        Success = false,
                        Message = $"Số lượng yêu cầu ({desiredQty}) vượt quá số lượng tồn kho còn lại ({product.StockQuantity})!"
                    });
                }

                if (existingItem != null)
                {
                    existingItem.Quantity = desiredQty;
                }
                else
                {
                    var newItem = new CartItem
                    {
                        CartItemId = GenID.GenerateCartItemId(),
                        CartId = cart.CartId,
                        ProductId = request.ProductId,
                        Quantity = request.Quantity
                    };
                    await _context.CartItems.AddAsync(newItem);
                    cart.CartItems.Add(newItem);
                }

                await _context.SaveChangesAsync();

                // Nạp lại chi tiết để trả về response đầy đủ
                var updatedCart = await GetOrCreateCartAsync(userId);
                return Ok(BuildCartResponse(updatedCart, "Đã thêm sản phẩm vào giỏ hàng thành công!"));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi khi thêm vào giỏ hàng: " + ex.Message });
            }
        }

        // 4. PUT: Cập nhật số lượng của một sản phẩm trong giỏ
        [HttpPut("update-quantity")]
        public async Task<IActionResult> UpdateQuantity([FromBody] UpdateCartQuantityRequest request)
        {
            try
            {
                if (request == null || string.IsNullOrWhiteSpace(request.ProductId))
                {
                    return BadRequest(new { Success = false, Message = "Dữ liệu cập nhật không hợp lệ!" });
                }

                string? userId = GetCurrentUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { Success = false, Message = "Vui lòng đăng nhập!" });
                }

                var cart = await GetOrCreateCartAsync(userId);
                var item = cart.CartItems.FirstOrDefault(ci => ci.ProductId == request.ProductId);
                if (item == null)
                {
                    return NotFound(new { Success = false, Message = "Sản phẩm không có trong giỏ hàng!" });
                }

                if (request.Quantity <= 0)
                {
                    // Nếu số lượng <= 0, thực hiện xóa khỏi giỏ
                    _context.CartItems.Remove(item);
                    cart.CartItems.Remove(item);
                }
                else
                {
                    // Kiểm tra tồn kho
                    var product = await _context.Products.FindAsync(request.ProductId);
                    if (product != null && request.Quantity > product.StockQuantity)
                    {
                        return BadRequest(new
                        {
                            Success = false,
                            Message = $"Số lượng yêu cầu ({request.Quantity}) vượt quá tồn kho hiện có ({product.StockQuantity})!"
                        });
                    }
                    item.Quantity = request.Quantity;
                }

                await _context.SaveChangesAsync();

                var updatedCart = await GetOrCreateCartAsync(userId);
                return Ok(BuildCartResponse(updatedCart, "Đã cập nhật số lượng thành công!"));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi khi cập nhật giỏ hàng: " + ex.Message });
            }
        }

        // 5. DELETE: Xóa một sản phẩm khỏi giỏ
        [HttpDelete("remove/{productId}")]
        public async Task<IActionResult> RemoveFromCart(string productId)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(productId))
                {
                    return BadRequest(new { Success = false, Message = "Mã sản phẩm không hợp lệ!" });
                }

                string? userId = GetCurrentUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { Success = false, Message = "Vui lòng đăng nhập!" });
                }

                var cart = await GetOrCreateCartAsync(userId);
                var item = cart.CartItems.FirstOrDefault(ci => ci.ProductId == productId);
                if (item != null)
                {
                    _context.CartItems.Remove(item);
                    cart.CartItems.Remove(item);
                    await _context.SaveChangesAsync();
                }

                var updatedCart = await GetOrCreateCartAsync(userId);
                return Ok(BuildCartResponse(updatedCart, "Đã xóa sản phẩm khỏi giỏ hàng!"));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi khi xóa sản phẩm: " + ex.Message });
            }
        }

        // 6. DELETE: Xóa toàn bộ giỏ hàng
        [HttpDelete("clear")]
        public async Task<IActionResult> ClearCart()
        {
            try
            {
                string? userId = GetCurrentUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { Success = false, Message = "Vui lòng đăng nhập!" });
                }

                var cart = await GetOrCreateCartAsync(userId);
                if (cart.CartItems.Any())
                {
                    _context.CartItems.RemoveRange(cart.CartItems);
                    cart.CartItems.Clear();
                    await _context.SaveChangesAsync();
                }

                var updatedCart = await GetOrCreateCartAsync(userId);
                return Ok(BuildCartResponse(updatedCart, "Đã làm trống giỏ hàng thành công!"));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi khi xóa giỏ hàng: " + ex.Message });
            }
        }
    }
}
