using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TMDT_FINAL_NPKL.Entities;

namespace TMDT_FINAL_NPKL.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LaySPSellerController : ControllerBase
    {

        private readonly WebTmdtContext _context;

        public LaySPSellerController(WebTmdtContext context)
        {
            _context = context;
        }
        [HttpGet("seller-list")]
        [Authorize(Roles = "SELLER")]
        // status: "all" (mặc định) = tất cả, "visible" = đang hiển thị, "hidden" = đã ẩn
        public async Task<IActionResult> GetSellerProducts([FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] string status = "all")
        {
            try
            {
                // Bước 1: Lấy Username từ JWT Token đang đăng nhập
                string? username = User.FindFirst("Username")?.Value;

                if (string.IsNullOrEmpty(username))
                {
                    return Unauthorized(new { Success = false, Message = "Không xác định được danh tính người dùng từ Token!" });
                }

                // Bước 2: Từ Username, tra bảng Users để lấy ID của người dùng
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
                if (user == null)
                {
                    return Unauthorized(new { Success = false, Message = "Tài khoản không tồn tại trong hệ thống!" });
                }

                // Bước 3: Dùng ID người dùng ráp vào cột seller_id để tra ra thông tin Shop

                var shop = await _context.Shops.FirstOrDefaultAsync(s => s.SellerId == user.UserId.ToString());

                if (shop == null)
                {
                    return BadRequest(new { Success = false, Message = "Bạn chưa đăng ký thông tin cửa hàng!" });
                }

                // Bước 4: Lấy danh sách sản phẩm khớp với shop_id, lọc theo trạng thái ẩn/hiện (status)
                var baseQuery = _context.Products.Where(p => p.ShopId == shop.ShopId);

                baseQuery = status?.ToLower() switch
                {
                    "visible" => baseQuery.Where(p => p.IsDeleted == false),
                    "hidden" => baseQuery.Where(p => p.IsDeleted == true),
                    _ => baseQuery // "all" hoặc giá trị khác -> lấy hết, không phân biệt ẩn/hiện
                };

                var query = baseQuery.OrderByDescending(p => p.CreatedAt); // Sản phẩm mới nhất xếp trước

                // 4.1: Đếm tổng số lượng sản phẩm để làm phân trang
                int totalItems = await query.CountAsync();
                int totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);

                // 4.2: Truy vấn dữ liệu cho trang hiện tại với cú pháp Skip - Take
                var products = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(p => new
                    {
                        ProductId = p.ProductId,
                        ProductName = p.ProductName,
                        CategoryId = p.CategoryId,
                        Price = p.Price,
                        StockQuantity = p.StockQuantity,
                        Image = p.Image,
                        ApprovalStatus = p.ApprovalStatus, // "PENDING", "APPROVED", "REJECTED"...
                        IsDeleted = p.IsDeleted, // true = đang ẩn, false = đang hiển thị
                        CreatedAt = p.CreatedAt
                    })
                    .ToListAsync();

                // Bước 5: Trả dữ liệu về cho Frontend hiển thị
                return Ok(new
                {
                    Success = true,
                    Message = "Lấy danh sách sản phẩm thành công.",
                    Data = new
                    {
                        Items = products,
                        Pagination = new
                        {
                            CurrentPage = page,
                            PageSize = pageSize,
                            TotalItems = totalItems,
                            TotalPages = totalPages
                        }
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi máy chủ: " + ex.Message });
            }
        }
        [HttpPut("hide-product/{productId}")]
        [Authorize(Roles = "SELLER")]
        public async Task<IActionResult> HideProduct(string productId)
        {
            try
            {
                // 1. Lấy Username và kiểm tra Shop
                string? username = User.FindFirst("Username")?.Value;
                if (string.IsNullOrEmpty(username))
                    return Unauthorized(new { Success = false, Message = "Không xác định được danh tính!" });

                var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
                if (user == null) return Unauthorized();

                var shop = await _context.Shops.FirstOrDefaultAsync(s => s.SellerId == user.UserId.ToString());
                if (shop == null) return BadRequest(new { Success = false, Message = "Chưa có cửa hàng!" });

                // 2. Tìm sản phẩm (phải thuộc về shop này)
                var product = await _context.Products.FirstOrDefaultAsync(p => p.ProductId == productId && p.ShopId == shop.ShopId);

                if (product == null)
                {
                    return NotFound(new { Success = false, Message = "Không tìm thấy sản phẩm hoặc bạn không có quyền sửa sản phẩm này!" });
                }

                // 3. Thực hiện Ẩn (Soft Delete) bằng cách set is_deleted = true
                product.IsDeleted = true;

                await _context.SaveChangesAsync();

                return Ok(new { Success = true, Message = "Đã ẩn sản phẩm thành công!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi máy chủ: " + ex.Message });
            }
        }

        [HttpPut("show-product/{productId}")]
        [Authorize(Roles = "SELLER")]
        public async Task<IActionResult> ShowProduct(string productId)
        {
            try
            {
                // 1. Lấy Username và kiểm tra Shop
                string? username = User.FindFirst("Username")?.Value;
                if (string.IsNullOrEmpty(username))
                    return Unauthorized(new { Success = false, Message = "Không xác định được danh tính!" });

                var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
                if (user == null) return Unauthorized();

                var shop = await _context.Shops.FirstOrDefaultAsync(s => s.SellerId == user.UserId.ToString());
                if (shop == null) return BadRequest(new { Success = false, Message = "Chưa có cửa hàng!" });

                // 2. Tìm sản phẩm (phải thuộc về shop này)
                var product = await _context.Products.FirstOrDefaultAsync(p => p.ProductId == productId && p.ShopId == shop.ShopId);

                if (product == null)
                {
                    return NotFound(new { Success = false, Message = "Không tìm thấy sản phẩm hoặc bạn không có quyền sửa sản phẩm này!" });
                }

                // 3. Hiện lại sản phẩm bằng cách set is_deleted = false
                product.IsDeleted = false;

                await _context.SaveChangesAsync();

                return Ok(new { Success = true, Message = "Đã hiện lại sản phẩm thành công!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi máy chủ: " + ex.Message });
            }
        }

        [HttpGet("approval-log/{productId}")]
        [Authorize(Roles = "SELLER")]
        public async Task<IActionResult> GetApprovalLog(string productId)
        {
            try
            {
                // 1. Lấy Username và kiểm tra Shop
                string? username = User.FindFirst("Username")?.Value;
                if (string.IsNullOrEmpty(username))
                    return Unauthorized(new { Success = false, Message = "Không xác định được danh tính!" });

                var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
                if (user == null) return Unauthorized();

                var shop = await _context.Shops.FirstOrDefaultAsync(s => s.SellerId == user.UserId.ToString());
                if (shop == null) return BadRequest(new { Success = false, Message = "Chưa có cửa hàng!" });

                // 2. Tìm sản phẩm (phải thuộc về shop này)
                var product = await _context.Products.FirstOrDefaultAsync(p => p.ProductId == productId && p.ShopId == shop.ShopId);
                if (product == null)
                {
                    return NotFound(new { Success = false, Message = "Không tìm thấy sản phẩm hoặc bạn không có quyền xem sản phẩm này!" });
                }

                // 3. Lấy log duyệt, Include thông tin Admin
                var logs = await _context.ProductApprovalLogs
                    .Include(l => l.Admin)
                    .Where(l => l.ProductId == productId)
                    .OrderByDescending(l => l.CreatedAt)
                    .Select(l => new
                    {
                        l.LogId,
                        l.Action,
                        l.Note,
                        l.CreatedAt,
                        AdminId = l.AdminId,
                        AdminName = l.Admin.FullName,
                        AdminEmail = l.Admin.Email
                    })
                    .ToListAsync();

                return Ok(new
                {
                    Success = true,
                    Message = "Lấy thông tin kiểm duyệt thành công.",
                    Data = new
                    {
                        ProductId = product.ProductId,
                        ProductName = product.ProductName,
                        Logs = logs
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi máy chủ: " + ex.Message });
            }
        }
    }
}
