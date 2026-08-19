using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.EntityFrameworkCore;
using System;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using TMDT_FINAL_NPKL.Entities;
using TMDT_FINAL_NPKL.Models;

namespace TMDT_FINAL_NPKL.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class QuenMatKhauController : ControllerBase
    {
        private readonly WebTmdtContext _context;
        private readonly IMemoryCache _cache;
        private readonly IConfiguration _configuration;

        public QuenMatKhauController(WebTmdtContext context, IMemoryCache cache, IConfiguration configuration)
        {
            _context = context;
            _cache = cache;
            _configuration = configuration;
        }

        [HttpPost("gui-otp")]
        public async Task<IActionResult> GuiOtp([FromBody] YeuCauGuiOtp request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // 1. Kiểm tra email có tồn tại trong CSDL không
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
                if (user == null)
                {
                    return BadRequest(new { Message = "Email này chưa được đăng ký trong hệ thống!" });
                }

                // 2. Sinh mã OTP gồm 6 chữ số ngẫu nhiên
                Random random = new Random();
                string otp = random.Next(100000, 999999).ToString();

                // 3. Lưu OTP vào MemoryCache với thời gian sống là 10 phút
                var cacheKey = $"OTP_{request.Email}";
                _cache.Set(cacheKey, otp, TimeSpan.FromMinutes(10));

                // 4. Gửi email qua SMTP Gmail
                var smtpServer = _configuration["EmailSettings:SmtpServer"] ?? "smtp.gmail.com";
                var portVal = _configuration["EmailSettings:Port"];
                int port = string.IsNullOrEmpty(portVal) ? 587 : int.Parse(portVal);
                var senderName = _configuration["EmailSettings:SenderName"] ?? "Web TMDT Support";
                var senderEmail = _configuration["EmailSettings:SenderEmail"] ?? "hoangphu24122005@gmail.com";
                var username = _configuration["EmailSettings:Username"] ?? "hoangphu24122005@gmail.com";
                var password = _configuration["EmailSettings:Password"] ?? "ezzs ylht glna ljkb";

                string subject = "Ma OTP xac thuc quen mat khau";
                string body = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;'>
                    <h2 style='color: #2D3748; text-align: center;'>Yêu cầu lấy lại mật khẩu</h2>
                    <p>Chào bạn,</p>
                    <p>Chúng tôi nhận được yêu cầu thiết lập lại mật khẩu từ tài khoản của bạn. Vui lòng sử dụng mã xác thực OTP dưới đây để hoàn tất quá trình:</p>
                    <div style='text-align: center; margin: 30px 0;'>
                        <span style='font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4F46E5; background-color: #F3F4F6; padding: 10px 20px; border-radius: 6px;'>{otp}</span>
                    </div>
                    <p style='color: #E11D48; font-weight: bold;'>Lưu ý: Mã xác thực OTP này có hiệu lực trong vòng 10 phút. Không chia sẻ mã này cho bất kỳ ai.</p>
                    <hr style='border: none; border-top: 1px solid #eee; margin: 20px 0;' />
                    <p style='font-size: 12px; color: #A0AEC0; text-align: center;'>Đây là email tự động từ hệ thống WEB_TMDT. Vui lòng không phản hồi email này.</p>
                </div>";

                using (var message = new MailMessage())
                {
                    message.From = new MailAddress(senderEmail, senderName);
                    message.To.Add(new MailAddress(request.Email));
                    message.Subject = subject;
                    message.Body = body;
                    message.IsBodyHtml = true;

                    using (var client = new SmtpClient(smtpServer, port))
                    {
                        client.UseDefaultCredentials = false;
                        client.Credentials = new NetworkCredential(username, password);
                        client.EnableSsl = true;

                        await client.SendMailAsync(message);
                    }
                }

                // Tiện ích cho Dev: log mã OTP ra console phòng trường hợp cấu hình lỗi
                Console.WriteLine($"[DEV-LOG] Ma OTP cua email {request.Email} la: {otp}");

                return Ok(new { Message = "Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư." });
            }
            catch (Exception ex)
            {
                // In chi tiết lỗi ra console của server
                Console.WriteLine($"[ERROR] Loi gui OTP: {ex}");
                return StatusCode(500, new { Message = "Đã xảy ra lỗi khi gửi mã OTP: " + ex.Message });
            }
        }

        [HttpPost("xac-thuc-otp")]
        public IActionResult XacThucOtp([FromBody] YeuCauXacThucOtp request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // Kiểm tra OTP từ cache
                var cacheKey = $"OTP_{request.Email}";
                if (!_cache.TryGetValue(cacheKey, out string? cachedOtp) || cachedOtp != request.Otp)
                {
                    return BadRequest(new { Success = false, Message = "Mã OTP không chính xác hoặc đã hết hiệu lực (10 phút)!" });
                }

                return Ok(new { Success = true, Message = "Mã OTP hợp lệ." });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] Loi xac thuc OTP: {ex}");
                return StatusCode(500, new { Success = false, Message = "Đã xảy ra lỗi máy chủ: " + ex.Message });
            }
        }

        [HttpPost("dat-lai-mat-khau")]
        public async Task<IActionResult> DatLaiMatKhau([FromBody] XacNhanMatKhauMoi request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // 1. Kiểm tra OTP từ cache
                var cacheKey = $"OTP_{request.Email}";
                if (!_cache.TryGetValue(cacheKey, out string? cachedOtp) || cachedOtp != request.Otp)
                {
                    return BadRequest(new { Message = "Mã OTP không chính xác hoặc đã hết hiệu lực (10 phút)!" });
                }

                // 2. Lấy thông tin User để cập nhật
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
                if (user == null)
                {
                    return BadRequest(new { Message = "Email không khớp với bất kỳ tài khoản nào." });
                }

                // 3. Mã hóa mật khẩu mới và lưu vào cơ sở dữ liệu
                string hashedPassword = HassPass.HashPassword(request.NewPassword);
                user.PasswordHash = hashedPassword;

                _context.Users.Update(user);
                await _context.SaveChangesAsync();

                // 4. Xóa OTP khỏi cache sau khi đổi mật khẩu thành công
                _cache.Remove(cacheKey);

                return Ok(new { Message = "Đặt lại mật khẩu thành công!" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] Loi dat lai mat khau: {ex}");
                return StatusCode(500, new { Message = "Đã xảy ra lỗi máy chủ: " + ex.Message });
            }
        }
    }
}
