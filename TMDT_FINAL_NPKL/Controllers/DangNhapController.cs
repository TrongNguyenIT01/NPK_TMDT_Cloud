using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using NuGet.Protocol.Plugins;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using TMDT_FINAL_NPKL.Entities;

using TMDT_FINAL_NPKL.Models;
namespace TMDT_FINAL_NPKL.Controllers

{
    [Route("api/[controller]")]
    [ApiController]
    public class DangNhapController : ControllerBase
    {
        private readonly WebTmdtContext _context;
        private readonly IConfiguration _configuration;

        public DangNhapController(WebTmdtContext context, IConfiguration configuration  )
        {
            _context = context;
            _configuration = configuration;
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] DangNhapRequest request)
        {
            // Sử dụng u.Username và u.Status 
            var user = _context.Users.FirstOrDefault(u => u.Username == request.Username);

            if (user == null)
            {
                return BadRequest(new DangNhapResponse { Success = false, Message = "Tài khoản không hợp lệ!" });
            }
            if (user.Status != "ACTIVE")
            {
                string statusRedirect = "";

                if (user.Status == "PENDING")
                {
                    statusRedirect= "../Status/pending.html";
                    return Ok(new DangNhapResponse
                    {
                        Success = false,
                        Message = "Tài khoản của bạn chưa được duyệt vui lòng đợi hoặc liên hệ QTV",
                        RedirectUrl = statusRedirect
                    });
                }
                else if(user.Status == "BLOCKED")
                {
                    statusRedirect = "../Status/blocked.html";

                    // Tìm hồ sơ khóa hoạt động gần nhất
                    var activeBlock = _context.UserBlocks
                        .Where(b => b.UserId == user.UserId && b.Status == "ACTIVE")
                        .OrderByDescending(b => b.CreatedAt)
                        .FirstOrDefault();

                    return Ok(new DangNhapResponse
                    {
                        Success = false,
                        Message = "Tài khoản của bạn đã bị BLOCK liên hệ QTV để được giải quyết!",
                        RedirectUrl = statusRedirect,
                        Username = user.Username, 
                        Role = user.Role,         
                        Email = user.Email,
                        BlockId = activeBlock?.BlockId ?? "BLK-982410",
                        BlockReason = activeBlock?.Reason ?? "Vi phạm điều khoản đăng bán sản phẩm / Hoạt động có rủi ro bảo mật"
                    });

                }
                else
                {
                    statusRedirect = "../Status/rejected.html";
                    return Ok(new DangNhapResponse
                    {
                        Success = false,
                        Message = "Tài khoản của bạn đã bị từ chối liên hệ QTV để được hỗ trợ",
                        RedirectUrl = statusRedirect,
                        Username = user.Username,
                        Role = user.Role,
                        Email = user.Email
                    });
                }

            }

            string hashedInputPassword = HassPass.HashPassword(request.Password);

            // Sử dụng user.PasswordHash thay vì user.Password_hash
            if (user.PasswordHash != hashedInputPassword)
            {
                return BadRequest(new DangNhapResponse { Success = false, Message = "Mật khẩu không chính xác!" });
            }

            // Sử dụng user.UserId thay vì user.User_id hay user.user_id
            string redirectUrl = user.UserId.StartsWith("ADM") ? "/admin/dashboard" :
                                 user.UserId.StartsWith("SLR") ? "/seller/dashboard" : "/home";

            // Gọi hàm sinh Token
            string token = GenerateJwtToken(user);

            return Ok(new DangNhapResponse
            {
                Success = true,
                Message = "Đăng nhập thành công!",
                RedirectUrl = redirectUrl,
                Token = token,
                Role = user.Role // Sử dụng user.Role thay vì user.role
            });
        }

        private string GenerateJwtToken(User user)
        {
            // 1. Đọc các thông số JWT từ appsettings.json thông qua _configuration
            string key = _configuration["Jwt:Key"];
            string issuer = _configuration["Jwt:Issuer"];
            string audience = _configuration["Jwt:Audience"];
            int expireHours = int.Parse(_configuration["Jwt:ExpireHours"]);

            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                // Thay đổi thành user.Username, user.UserId, user.Role, user.FullName
                new Claim(JwtRegisteredClaimNames.Sub, user.Username),
                new Claim("UserId", user.UserId),
                new Claim(ClaimTypes.Role, user.Role),
                new Claim(ClaimTypes.Name, user.FullName)
            };

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.Now.AddHours(expireHours),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
    
}
