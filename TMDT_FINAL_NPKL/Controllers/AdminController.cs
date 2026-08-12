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
    [Authorize(Roles = "ADMIN")]
    public class AdminController : ControllerBase
    {
        private readonly WebTmdtContext _context;

        public AdminController(WebTmdtContext context)
        {
            _context = context;
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers([FromQuery] string? status, [FromQuery] string? role, [FromQuery] string? search)
        {
            try
            {
                var query = _context.Users.AsQueryable();

                if (!string.IsNullOrEmpty(status) && status.ToUpper() != "ALL")
                {
                    query = query.Where(u => u.Status == status.ToUpper());
                }

                if (!string.IsNullOrEmpty(role) && role.ToUpper() != "ALL")
                {
                    query = query.Where(u => u.Role == role.ToUpper());
                }

                if (!string.IsNullOrEmpty(search))
                {
                    var searchLower = search.ToLower().Trim();
                    query = query.Where(u => u.Username.ToLower().Contains(searchLower) ||
                                             u.FullName.ToLower().Contains(searchLower) ||
                                             u.Email.ToLower().Contains(searchLower) ||
                                             (u.Phone != null && u.Phone.ToLower().Contains(searchLower)));
                }

                var users = await query
                    .OrderByDescending(u => u.CreatedAt)
                    .Select(u => new
                    {
                        u.UserId,
                        u.FullName,
                        u.Username,
                        u.Email,
                        u.Phone,
                        u.Role,
                        u.Status,
                        u.RejectReason,
                        u.CreatedAt
                    })
                    .ToListAsync();

                return Ok(new { Success = true, Data = users });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi máy chủ: " + ex.Message });
            }
        }

        [HttpPost("approve/{userId}")]
        public async Task<IActionResult> ApproveUser(string userId)
        {
            try
            {
                var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId);
                if (user == null)
                {
                    return NotFound(new { Success = false, Message = "Không tìm thấy người dùng!" });
                }

                user.Status = "ACTIVE";
                user.RejectReason = null;

                await _context.SaveChangesAsync();

                return Ok(new { Success = true, Message = "Đã duyệt kích hoạt tài khoản thành công!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi máy chủ: " + ex.Message });
            }
        }

        [HttpPost("reject/{userId}")]
        public async Task<IActionResult> RejectUser(string userId, [FromBody] RejectUserRequest request)
        {
            try
            {
                if (request == null || string.IsNullOrWhiteSpace(request.Reason))
                {
                    return BadRequest(new { Success = false, Message = "Lý do từ chối không được để trống!" });
                }

                var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId);
                if (user == null)
                {
                    return NotFound(new { Success = false, Message = "Không tìm thấy người dùng!" });
                }

                user.Status = "REJECTED";
                user.RejectReason = request.Reason;

                await _context.SaveChangesAsync();

                return Ok(new { Success = true, Message = "Đã từ chối tài khoản thành công!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi máy chủ: " + ex.Message });
            }
        }

        [HttpPost("block/{userId}")]
        public async Task<IActionResult> BlockUser(string userId, [FromBody] BlockUserRequest request)
        {
            try
            {
                if (request == null || string.IsNullOrWhiteSpace(request.Reason))
                {
                    return BadRequest(new { Success = false, Message = "Lý do khóa không được để trống!" });
                }

                var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId);
                if (user == null)
                {
                    return NotFound(new { Success = false, Message = "Không tìm thấy người dùng!" });
                }

                if (user.Status == "BLOCKED")
                {
                    return BadRequest(new { Success = false, Message = "Tài khoản đã bị khóa từ trước!" });
                }

                user.Status = "BLOCKED";

                // Tạo bản ghi block mới
                var newBlock = new UserBlock
                {
                    BlockId = GenID.GenerateBlockId(),
                    UserId = userId,
                    Reason = request.Reason,
                    Status = "ACTIVE",
                    CreatedAt = DateTime.Now
                };

                await _context.UserBlocks.AddAsync(newBlock);
                await _context.SaveChangesAsync();

                return Ok(new { Success = true, Message = "Đã khóa tài khoản thành công!", BlockId = newBlock.BlockId });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi máy chủ: " + ex.Message });
            }
        }

        [HttpPost("unblock/{userId}")]
        public async Task<IActionResult> UnblockUser(string userId)
        {
            try
            {
                var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId);
                if (user == null)
                {
                    return NotFound(new { Success = false, Message = "Không tìm thấy người dùng!" });
                }

                if (user.Status != "BLOCKED")
                {
                    return BadRequest(new { Success = false, Message = "Tài khoản này hiện không bị khóa!" });
                }

                user.Status = "ACTIVE";

                // Giải quyết bản ghi block
                var activeBlock = await _context.UserBlocks
                    .Where(b => b.UserId == userId && b.Status == "ACTIVE")
                    .FirstOrDefaultAsync();

                if (activeBlock != null)
                {
                    activeBlock.Status = "RESOLVED";
                }

                await _context.SaveChangesAsync();

                return Ok(new { Success = true, Message = "Đã mở khóa tài khoản thành công!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi máy chủ: " + ex.Message });
            }
        }

        [HttpGet("appeals")]
        public async Task<IActionResult> GetAppeals([FromQuery] string? status, [FromQuery] string? search)
        {
            try
            {
                var query = _context.Appeals
                    .Include(a => a.Block)
                        .ThenInclude(b => b.User)
                    .AsQueryable();

                if (!string.IsNullOrEmpty(status) && status.ToUpper() != "ALL")
                {
                    query = query.Where(a => a.Status == status.ToUpper());
                }

                if (!string.IsNullOrEmpty(search))
                {
                    var searchLower = search.ToLower().Trim();
                    query = query.Where(a => a.Title.ToLower().Contains(searchLower) ||
                                             a.Content.ToLower().Contains(searchLower) ||
                                             a.Block.User.Username.ToLower().Contains(searchLower) ||
                                             a.Block.User.FullName.ToLower().Contains(searchLower));
                }

                var appealsList = await query
                    .OrderByDescending(a => a.CreatedAt)
                    .Select(a => new
                    {
                        a.AppealId,
                        a.BlockId,
                        a.Title,
                        a.Content,
                        a.Status,
                        a.CreatedAt,
                        a.ResolvedAt,
                        ResolvedBy = a.ResolvedByNavigation != null ? a.ResolvedByNavigation.FullName : null,
                        a.AdminNote,
                        Username = a.Block.User.Username,
                        FullName = a.Block.User.FullName,
                        Email = a.Block.User.Email,
                        BlockReason = a.Block.Reason
                    })
                    .ToListAsync();

                return Ok(new { Success = true, Data = appealsList });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi máy chủ: " + ex.Message });
            }
        }

        [HttpPost("appeals/resolve/{appealId}")]
        public async Task<IActionResult> ResolveAppeal(string appealId, [FromBody] ResolveAppealRequest request)
        {
            try
            {
                if (request == null || string.IsNullOrWhiteSpace(request.Status))
                {
                    return BadRequest(new { Success = false, Message = "Trạng thái giải quyết không được để trống!" });
                }

                string statusInput = request.Status.ToUpper().Trim();
                if (statusInput != "APPROVED" && statusInput != "REJECTED")
                {
                    return BadRequest(new { Success = false, Message = "Trạng thái không hợp lệ. Chỉ chấp nhận APPROVED hoặc REJECTED." });
                }

                var appeal = await _context.Appeals
                    .Include(a => a.Block)
                    .FirstOrDefaultAsync(a => a.AppealId == appealId);

                if (appeal == null)
                {
                    return NotFound(new { Success = false, Message = "Không tìm thấy đơn khiếu nại!" });
                }

                if (appeal.Status != "PENDING")
                {
                    return BadRequest(new { Success = false, Message = "Khiếu nại này đã được giải quyết từ trước!" });
                }

                // Lấy UserId của Admin từ JWT Claims
                string? adminUserId = User.FindFirst("UserId")?.Value;

                appeal.Status = statusInput;
                appeal.ResolvedAt = DateTime.Now;
                appeal.ResolvedBy = adminUserId;
                appeal.AdminNote = request.AdminNote;

                if (statusInput == "APPROVED")
                {
                    // Chấp nhận khiếu nại -> Tiến hành mở khóa tài khoản
                    var block = appeal.Block;
                    if (block != null)
                    {
                        block.Status = "RESOLVED";

                        var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == block.UserId);
                        if (user != null)
                        {
                            user.Status = "ACTIVE";
                        }
                    }
                }

                await _context.SaveChangesAsync();

                return Ok(new { Success = true, Message = $"Đã giải quyết khiếu nại thành công: {statusInput}!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi máy chủ: " + ex.Message });
            }
        }
    }
}
