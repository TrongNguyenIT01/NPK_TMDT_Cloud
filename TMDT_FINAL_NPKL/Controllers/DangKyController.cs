using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;
using TMDT_FINAL_NPKL.Entities;
using TMDT_FINAL_NPKL.Models;
using Microsoft.EntityFrameworkCore;

namespace TMDT_FINAL_NPKL.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DangKyController : ControllerBase
    {
        private readonly WebTmdtContext _context;

        public DangKyController(WebTmdtContext context)
        {
            _context = context;
        }
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] DangKy request)
        {
            try
            {
                // 1. Kiểm tra Validate Role thủ công (vì Role có giới hạn cụ thể)
                string roleInput = request.Role?.Trim().ToUpper();
                if (roleInput != "ADMIN" && roleInput != "SELLER" && roleInput != "CUSTOMER")
                {
                    return BadRequest(new { Message = "Quyền (Role) không hợp lệ. Chỉ chấp nhận: ADMIN, SELLER, CUSTOMER." });
                }

                // 2. Kiểm tra trùng lặp Username, Email, Phone bằng LINQ (EF Core)
                bool isUsernameExist = await _context.Users.AnyAsync(u => u.Username == request.Username);
                if (isUsernameExist) return BadRequest(new { Message = "Tên đăng nhập này đã tồn tại!" });

                bool isEmailExist = await _context.Users.AnyAsync(u => u.Email == request.Email);
                if (isEmailExist) return BadRequest(new { Message = "Email này đã được sử dụng!" });

                if (!string.IsNullOrEmpty(request.Phone))
                {
                    bool isPhoneExist = await _context.Users.AnyAsync(u => u.Phone == request.Phone);
                    if (isPhoneExist) return BadRequest(new { Message = "Số điện thoại này đã được đăng ký!" });
                }

                // 3. Chuẩn bị dữ liệu: Sinh ID và Mã hóa Pass (dùng 2 hàm bạn đã có)
                DateTime createdAt = DateTime.Now;
                string newUserId = GenID.GenerateUserId(roleInput, request.Username, request.FullName, createdAt);
                string hashedPassword = HassPass.HashPassword(request.Password);
                string defaultStatus = "PENDING"; // Trạng thái mặc định

                // 4. Map dữ liệu vào Entity model (Class này do Scaffold tự sinh ra, thường tên là User hoặc Users)
                var newUser = new User
                {
                    UserId = newUserId,
                    Username = request.Username,
                    PasswordHash = hashedPassword,
                    FullName = request.FullName,
                    Email = request.Email,
                    Phone = request.Phone,
                    Address = request.Address,
                    Role = roleInput,
                    Status = defaultStatus
                };

                // 5. Thêm vào context và lưu xuống CSDL
                await _context.Users.AddAsync(newUser);
                await _context.SaveChangesAsync();

                // 6. Trả về kết quả thành công
                return Ok(new
                {
                    Message = "Đăng ký tài khoản thành công!",
                    UserId = newUserId,
                    Status = defaultStatus
                });
            }
            catch (Exception ex)
            {
                // Log lỗi hệ thống ở đây nếu cần
                return StatusCode(500, new { Message = "Đã xảy ra lỗi máy chủ: " + ex.Message });
            }
        }
    }
}
