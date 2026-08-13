using Microsoft.AspNetCore.Authorization; 
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading.Tasks;
using TMDT_FINAL_NPKL.Entities;
using TMDT_FINAL_NPKL.Models;

namespace TMDT_FINAL_NPKL.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "ADMIN")]
    public class CapTaiKhoanController : ControllerBase
    {
        private readonly WebTmdtContext _context;

        public CapTaiKhoanController(WebTmdtContext context)
        {
            _context = context;
        }

        [HttpPost("CapTK")]
        public async Task<IActionResult> CapTaiKhoan([FromBody] CapTaiKhoan request)
        {
            try
            {
                // 1. Validate dữ liệu Role và Status
                string roleInput = request.Role?.Trim().ToUpper();
                if (roleInput != "ADMIN" && roleInput != "SELLER" && roleInput != "CUSTOMER")
                {
                    return BadRequest(new { Message = "Vai trò (Role) không hợp lệ." });
                }

                string statusInput = request.Status?.Trim().ToUpper();
                if (statusInput != "ACTIVE" && statusInput != "PENDING")
                {
                    return BadRequest(new { Message = "Trạng thái không hợp lệ. Chỉ chấp nhận ACTIVE hoặc PENDING." });
                }

                // 2. Kiểm tra trùng lặp (Giống API đăng ký)
                if (await _context.Users.AnyAsync(u => u.Username == request.Username))
                    return BadRequest(new { Message = "Tên đăng nhập này đã tồn tại!" });

                if (await _context.Users.AnyAsync(u => u.Email == request.Email))
                    return BadRequest(new { Message = "Email này đã được sử dụng!" });

                if (!string.IsNullOrEmpty(request.Phone) && await _context.Users.AnyAsync(u => u.Phone == request.Phone))
                    return BadRequest(new { Message = "Số điện thoại này đã được đăng ký!" });

                // 3. Xử lý tạo ID và Hash Pass
                DateTime createdAt = DateTime.Now;
                string newUserId = GenID.GenerateUserId(roleInput, request.Username, request.FullName, createdAt);
                string hashedPassword = HassPass.HashPassword(request.Password);

                // 4. Map vào Entity
                var newUser = new User
                {
                    UserId = newUserId,
                    Username = request.Username,
                    PasswordHash = hashedPassword,
                    FullName = request.FullName,
                    Email = request.Email,
                    Phone = request.Phone,
                    Role = roleInput,
                    Status = statusInput, // Lấy Status trực tiếp từ Admin truyền lên
                    Address = request.Address,
                };

                // 5. Lưu vào Database
                await _context.Users.AddAsync(newUser);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    Success = true,
                    Message = $"Đã cấp tài khoản {roleInput} thành công!",
                    UserId = newUserId,
                    Status = statusInput
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Lỗi máy chủ: " + ex.Message });
            }
        }
        [HttpGet("DanhSach")]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> GetDanhSachTaiKhoan()
        {
            try
            {

                var users = await _context.Users
                    .Where(u => u.Status == "ACTIVE" || u.Status == "BLOCKED")
                    .Select(u => new
                    {
                        u.UserId,
                        u.FullName,
                        u.Username,
                        u.Email,
                        u.Phone,
                        u.Role,
                        u.Status
                    })
                    .ToListAsync();

                return Ok(new
                {
                    Success = true,
                    Data = users
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi máy chủ: " + ex.Message });
            }
        }
    }
}
