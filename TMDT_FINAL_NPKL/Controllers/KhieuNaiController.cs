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
    public class KhieuNaiController : ControllerBase
    {
        private readonly WebTmdtContext _context;

        public KhieuNaiController(WebTmdtContext context)
        {
            _context = context;
        }

        // DTO cho yêu cầu khiếu nại
        public class CreateAppealRequest
        {
            public string BlockId { get; set; } = null!;
            public string Title { get; set; } = null!;
            public string Content { get; set; } = null!;
        }

        // Endpoint gửi đơn khiếu nại tài khoản
        [HttpPost("create")]
        public async Task<IActionResult> CreateAppeal([FromBody] CreateAppealRequest request)
        {
            try
            {
                if (request == null || string.IsNullOrWhiteSpace(request.BlockId) 
                    || string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.Content))
                {
                    return BadRequest(new { Success = false, Message = "Vui lòng nhập đầy đủ thông tin khiếu nại!" });
                }

                // 1. Kiểm tra mã hồ sơ xử lý có tồn tại hay không
                var blockRecord = await _context.UserBlocks
                    .FirstOrDefaultAsync(b => b.BlockId == request.BlockId);

                if (blockRecord == null)
                {
                    return BadRequest(new { Success = false, Message = "Mã hồ sơ xử lý không hợp lệ hoặc không tồn tại trên hệ thống!" });
                }

                // 2. Sinh ID khiếu nại ngẫu nhiên sử dụng helper GenID
                string appealId = GenID.GenerateAppealId();

                // 3. Tạo bản ghi khiếu nại mới
                var appeal = new Appeal
                {
                    AppealId = appealId,
                    BlockId = request.BlockId,
                    Title = request.Title,
                    Content = request.Content,
                    Status = "PENDING",
                    CreatedAt = DateTime.Now
                };

                // 4. Lưu vào CSDL
                await _context.Appeals.AddAsync(appeal);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    Success = true,
                    Message = "Đơn khiếu nại của bạn đã được gửi thành công!",
                    AppealId = appealId
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Đã xảy ra lỗi máy chủ: " + ex.Message });
            }
        }

        // Endpoint truy vấn ngược thông tin từ mã hồ sơ xử lý
        [HttpGet("block-info/{blockId}")]
        public async Task<IActionResult> GetBlockInfo(string blockId)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(blockId))
                {
                    return BadRequest(new { Success = false, Message = "Mã hồ sơ không được để trống!" });
                }

                // Tìm hồ sơ khóa liên kết với thông tin người dùng
                var blockRecord = await _context.UserBlocks
                    .Include(b => b.User)
                    .FirstOrDefaultAsync(b => b.BlockId == blockId);

                if (blockRecord == null)
                {
                    return NotFound(new { Success = false, Message = "Không tìm thấy hồ sơ xử lý cho mã: " + blockId });
                }

                return Ok(new
                {
                    Success = true,
                    BlockId = blockRecord.BlockId,
                    Username = blockRecord.User.Username,
                    Email = blockRecord.User.Email,
                    Reason = blockRecord.Reason,
                    Status = blockRecord.Status,
                    CreatedAt = blockRecord.CreatedAt
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Đã xảy ra lỗi máy chủ: " + ex.Message });
            }
        }
    }
}
