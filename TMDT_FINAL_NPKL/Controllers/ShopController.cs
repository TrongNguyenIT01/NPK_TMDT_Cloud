using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using TMDT_FINAL_NPKL.Entities;
using TMDT_FINAL_NPKL.Models;

namespace TMDT_FINAL_NPKL.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "SELLER")]
    public class ShopController : ControllerBase
    {
        private readonly WebTmdtContext _context;

        public ShopController(WebTmdtContext context)
        {
            _context = context;
        }

        [HttpGet("my-shop")]
        public async Task<IActionResult> GetMyShop()
        {
            try
            {
                string? userId = User.FindFirst("UserId")?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { Success = false, Message = "Không tìm thấy thông tin định danh người dùng!" });
                }

                var shop = await _context.Shops
                    .Include(s => s.Seller)
                    .FirstOrDefaultAsync(s => s.SellerId == userId);

                if (shop != null)
                {
                    return Ok(new
                    {
                        Success = true,
                        Data = new
                        {
                            shop.ShopId,
                            shop.ShopName,
                            shop.Description,
                            shop.Logo,
                            shop.Status,
                            shop.CreatedAt,
                            Phone = shop.Seller?.Phone,
                            Email = shop.Seller?.Email,
                            Address = shop.Seller?.Address
                        }
                    });
                }

                // Nếu chưa có shop, vẫn trả về thông tin cá nhân của User để điền sẵn vào Form
                var user = await _context.Users.FindAsync(userId);
                return Ok(new
                {
                    Success = false,
                    Code = "NO_SHOP",
                    Message = "Tài khoản của bạn chưa đăng ký mở cửa hàng!",
                    Data = new
                    {
                        Phone = user?.Phone,
                        Email = user?.Email,
                        Address = user?.Address
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi máy chủ: " + ex.Message });
            }
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreateShop([FromBody] CreateShopRequest request)
        {
            try
            {
                string? userId = User.FindFirst("UserId")?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { Success = false, Message = "Không tìm thấy thông tin định danh người dùng!" });
                }

                // 1. Kiểm tra xem user đã có shop chưa
                var existingShop = await _context.Shops.AnyAsync(s => s.SellerId == userId);
                if (existingShop)
                {
                    return BadRequest(new { Success = false, Message = "Tài khoản này đã đăng ký cửa hàng trước đó!" });
                }

                // 2. Kiểm tra trùng tên shop (nếu cần thiết)
                var nameExists = await _context.Shops.AnyAsync(s => s.ShopName.ToLower() == request.ShopName.ToLower().Trim());
                if (nameExists)
                {
                    return BadRequest(new { Success = false, Message = "Tên cửa hàng này đã tồn tại trên hệ thống!" });
                }

                // 3. Tạo shop mới ở trạng thái PENDING (chờ duyệt)
                string newShopId = "SH" + Guid.NewGuid().ToString("N").Substring(0, 10).ToUpper();
                var shop = new Shop
                {
                    ShopId = newShopId,
                    SellerId = userId,
                    ShopName = request.ShopName.Trim(),
                    Description = request.Description?.Trim(),
                    Logo = null,
                    Status = "PENDING", // Bắt buộc lưu trạng thái PENDING chờ admin duyệt
                    CreatedAt = DateTime.Now
                };

                // 4. Đồng bộ cập nhật thông tin liên hệ của user
                var user = await _context.Users.FindAsync(userId);
                if (user != null)
                {
                    user.Phone = request.Phone.Trim();
                    user.Email = request.Email.Trim();
                    user.Address = request.Address.Trim();
                }

                await _context.Shops.AddAsync(shop);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    Success = true,
                    Message = "Đăng ký mở gian hàng thành công! Vui lòng chờ Admin phê duyệt.",
                    Data = new
                    {
                        shop.ShopId,
                        shop.ShopName,
                        shop.Status,
                        shop.CreatedAt
                    }
                });
            }
            catch (DbUpdateException dbEx)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi CSDL: " + (dbEx.InnerException?.Message ?? dbEx.Message) });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi máy chủ: " + ex.Message });
            }
        }

        [HttpPut("update-profile")]
        public async Task<IActionResult> UpdateShopProfile([FromBody] UpdateShopProfileRequest request)
        {
            try
            {
                string? userId = User.FindFirst("UserId")?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { Success = false, Message = "Không tìm thấy thông tin định danh người dùng!" });
                }

                var shop = await _context.Shops.FirstOrDefaultAsync(s => s.SellerId == userId);
                if (shop == null)
                {
                    return NotFound(new { Success = false, Message = "Không tìm thấy thông tin cửa hàng của tài khoản này!" });
                }

                bool isResubmitting = (shop.Status == "REJECTED");

                if (shop.Status == "BANNED")
                {
                    return BadRequest(new { Success = false, Message = "Cửa hàng đang bị cấm hoạt động, không thể cập nhật thông tin!" });
                }

                // Kiểm tra trùng tên với shop khác
                var nameExists = await _context.Shops.AnyAsync(s => s.ShopName.ToLower() == request.ShopName.ToLower().Trim() && s.ShopId != shop.ShopId);
                if (nameExists)
                {
                    return BadRequest(new { Success = false, Message = "Tên cửa hàng này đã được đăng ký bởi shop khác!" });
                }

                // Cập nhật thông tin cửa hàng
                shop.ShopName = request.ShopName.Trim();
                shop.Description = request.Description?.Trim();

                // Cập nhật thông tin liên hệ của user
                var user = await _context.Users.FindAsync(userId);
                if (user != null)
                {
                    user.Phone = request.Phone.Trim();
                    user.Email = request.Email.Trim();
                    user.Address = request.Address.Trim();
                }

                if (isResubmitting)
                {
                    shop.Status = "PENDING";
                }
                else
                {
                    // Xử lý thay đổi trạng thái hoạt động (chỉ cho phép đổi giữa ACTIVE và INACTIVE nếu shop đã được phê duyệt)
                    if (!string.IsNullOrEmpty(request.Status))
                    {
                        string statusInput = request.Status.ToUpper().Trim();
                        if (shop.Status == "ACTIVE" || shop.Status == "INACTIVE")
                        {
                            if (statusInput == "ACTIVE" || statusInput == "INACTIVE")
                            {
                                shop.Status = statusInput;
                            }
                            else
                            {
                                return BadRequest(new { Success = false, Message = "Trạng thái không hợp lệ. Chỉ chấp nhận ACTIVE hoặc INACTIVE!" });
                            }
                        }
                    }
                }

                await _context.SaveChangesAsync();

                string successMessage = isResubmitting 
                    ? "Gửi lại hồ sơ mở cửa hàng thành công! Đang chờ Admin phê duyệt lại." 
                    : "Cập nhật hồ sơ cửa hàng thành công!";

                return Ok(new { Success = true, Message = successMessage });
            }
            catch (DbUpdateException dbEx)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi CSDL: " + (dbEx.InnerException?.Message ?? dbEx.Message) });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi máy chủ: " + ex.Message });
            }
        }
    }
}
