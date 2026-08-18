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

        [HttpGet("user-approval-metrics")]
        public async Task<IActionResult> GetUserApprovalMetrics()
        {
            try
            {
                var now = DateTime.Now;
                var pendingTotal = await _context.Users.CountAsync(u => u.Status == "PENDING");
                var pendingSellers = await _context.Users.CountAsync(u => u.Role == "SELLER" && u.Status == "PENDING");
                var pendingCustomers = await _context.Users.CountAsync(u => u.Role == "CUSTOMER" && u.Status == "PENDING");
                var approvedThisMonth = await _context.Users.CountAsync(u => u.Status == "ACTIVE" && u.CreatedAt.Month == now.Month && u.CreatedAt.Year == now.Year);
                var approvedToday = await _context.Users.CountAsync(u => u.Status == "ACTIVE" && u.CreatedAt.Date == now.Date);

                return Ok(new
                {
                    Success = true,
                    Data = new
                    {
                        PendingTotal = pendingTotal,
                        PendingSellers = pendingSellers,
                        PendingCustomers = pendingCustomers,
                        ApprovedThisMonth = approvedThisMonth,
                        ApprovedToday = approvedToday
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi máy chủ: " + ex.Message });
            }
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

                // Nếu user là SELLER -> Đồng bộ cấm Shop, từ chối sản phẩm và hủy các đơn hàng chưa hoàn tất
                if (user.Role == "SELLER")
                {
                    var shop = await _context.Shops.FirstOrDefaultAsync(s => s.SellerId == userId);
                    if (shop != null)
                    {
                        shop.Status = "BANNED";
                        string adminId = User.FindFirst("UserId")?.Value ?? "ADMIN";
                        await HandleShopDisableInternalAsync(shop.ShopId, $"Tài khoản chủ gian hàng [{user.Username}] bị khóa: {request.Reason}", adminId);
                    }
                }

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

                // Nếu user là SELLER -> Tự động khôi phục Shop về ACTIVE và khôi phục sản phẩm về APPROVED
                if (user.Role == "SELLER")
                {
                    var shop = await _context.Shops.FirstOrDefaultAsync(s => s.SellerId == userId);
                    if (shop != null && shop.Status == "BANNED")
                    {
                        shop.Status = "ACTIVE";

                        var shopProducts = await _context.Products.Where(p => p.ShopId == shop.ShopId).ToListAsync();
                        foreach (var prod in shopProducts)
                        {
                            if (prod.ApprovalStatus == "REJECTED")
                            {
                                prod.ApprovalStatus = "APPROVED";
                            }
                        }
                    }
                }

                await _context.SaveChangesAsync();

                return Ok(new { Success = true, Message = "Đã mở khóa tài khoản thành công! Toàn bộ gian hàng và sản phẩm đã được kích hoạt lại." });
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

                            // Nếu là SELLER -> Mở lại Shop và khôi phục sản phẩm APPROVED
                            if (user.Role == "SELLER")
                            {
                                var shop = await _context.Shops.FirstOrDefaultAsync(s => s.SellerId == user.UserId);
                                if (shop != null && shop.Status == "BANNED")
                                {
                                    shop.Status = "ACTIVE";

                                    var shopProducts = await _context.Products.Where(p => p.ShopId == shop.ShopId).ToListAsync();
                                    foreach (var prod in shopProducts)
                                    {
                                        if (prod.ApprovalStatus == "REJECTED")
                                        {
                                            prod.ApprovalStatus = "APPROVED";
                                        }
                                    }
                                }
                            }
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

        [HttpGet("shops")]
        public async Task<IActionResult> GetShops([FromQuery] string? status, [FromQuery] string? search)
        {
            try
            {
                var query = _context.Shops
                    .Include(s => s.Seller)
                    .AsQueryable();

                if (!string.IsNullOrEmpty(status) && status.ToUpper() != "ALL")
                {
                    query = query.Where(s => s.Status == status.ToUpper());
                }

                if (!string.IsNullOrEmpty(search))
                {
                    var searchLower = search.ToLower().Trim();
                    query = query.Where(s => s.ShopName.ToLower().Contains(searchLower) ||
                                             s.ShopId.ToLower().Contains(searchLower) ||
                                             s.SellerId.ToLower().Contains(searchLower) ||
                                             s.Seller.FullName.ToLower().Contains(searchLower));
                }

                var shops = await query
                    .OrderByDescending(s => s.CreatedAt)
                    .Select(s => new
                    {
                        s.ShopId,
                        s.ShopName,
                        s.SellerId,
                        SellerName = s.Seller.FullName,
                        s.Description,
                        s.CreatedAt,
                        s.Status
                    })
                    .ToListAsync();

                return Ok(new { Success = true, Data = shops });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi máy chủ: " + ex.Message });
            }
        }

        [HttpPost("shops/approve/{shopId}")]
        public async Task<IActionResult> ApproveShop(string shopId)
        {
            try
            {
                var shop = await _context.Shops.FirstOrDefaultAsync(s => s.ShopId == shopId);
                if (shop == null)
                {
                    return NotFound(new { Success = false, Message = "Không tìm thấy cửa hàng!" });
                }

                shop.Status = "ACTIVE";
                await _context.SaveChangesAsync();

                return Ok(new { Success = true, Message = "Đã duyệt kích hoạt cửa hàng thành công!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi máy chủ: " + ex.Message });
            }
        }

        [HttpPost("shops/reject/{shopId}")]
        public async Task<IActionResult> RejectShop(string shopId)
        {
            try
            {
                var shop = await _context.Shops.FirstOrDefaultAsync(s => s.ShopId == shopId);
                if (shop == null)
                {
                    return NotFound(new { Success = false, Message = "Không tìm thấy cửa hàng!" });
                }

                shop.Status = "REJECTED";
                string adminId = User.FindFirst("UserId")?.Value ?? "ADMIN";
                await HandleShopDisableInternalAsync(shop.ShopId, "Hồ sơ gian hàng bị Admin từ chối.", adminId);

                await _context.SaveChangesAsync();

                return Ok(new { Success = true, Message = "Đã từ chối đơn đăng ký cửa hàng!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi máy chủ: " + ex.Message });
            }
        }

        [HttpPost("shops/suspend/{shopId}")]
        public async Task<IActionResult> SuspendShop(string shopId)
        {
            try
            {
                var shop = await _context.Shops.FirstOrDefaultAsync(s => s.ShopId == shopId);
                if (shop == null)
                {
                    return NotFound(new { Success = false, Message = "Không tìm thấy cửa hàng!" });
                }

                shop.Status = "INACTIVE";
                string adminId = User.FindFirst("UserId")?.Value ?? "ADMIN";
                await HandleShopDisableInternalAsync(shop.ShopId, "Gian hàng chuyển sang trạng thái Tạm Nghỉ. Toàn bộ sản phẩm chuyển sang chưa duyệt.", adminId);

                await _context.SaveChangesAsync();

                return Ok(new { Success = true, Message = "Đã chuyển cửa hàng sang trạng thái Tạm Nghỉ, từ chối duyệt sản phẩm và hủy các đơn hàng chưa hoàn tất!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi máy chủ: " + ex.Message });
            }
        }

        [HttpPost("shops/ban/{shopId}")]
        public async Task<IActionResult> BanShop(string shopId)
        {
            try
            {
                var shop = await _context.Shops.FirstOrDefaultAsync(s => s.ShopId == shopId);
                if (shop == null)
                {
                    return NotFound(new { Success = false, Message = "Không tìm thấy cửa hàng!" });
                }

                shop.Status = "BANNED";
                string adminId = User.FindFirst("UserId")?.Value ?? "ADMIN";
                await HandleShopDisableInternalAsync(shop.ShopId, "Gian hàng bị Admin cấm hoạt động. Toàn bộ sản phẩm bị từ chối duyệt.", adminId);

                await _context.SaveChangesAsync();

                return Ok(new { Success = true, Message = "Đã cấm cửa hàng hoạt động, từ chối toàn bộ sản phẩm và tự động hủy các đơn hàng chưa hoàn tất!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi máy chủ: " + ex.Message });
            }
        }

        [HttpPost("shops/unban/{shopId}")]
        public async Task<IActionResult> UnbanShop(string shopId)
        {
            try
            {
                var shop = await _context.Shops.FirstOrDefaultAsync(s => s.ShopId == shopId);
                if (shop == null)
                {
                    return NotFound(new { Success = false, Message = "Không tìm thấy cửa hàng!" });
                }

                shop.Status = "ACTIVE";

                // Phục hồi lại các sản phẩm của shop sang APPROVED (nếu trước đó bị chuyển sang REJECTED do cấm shop)
                var shopProducts = await _context.Products.Where(p => p.ShopId == shopId).ToListAsync();
                foreach (var prod in shopProducts)
                {
                    if (prod.ApprovalStatus == "REJECTED")
                    {
                        prod.ApprovalStatus = "APPROVED";
                    }
                }

                await _context.SaveChangesAsync();

                return Ok(new { Success = true, Message = "Đã gỡ cấm cửa hàng và kích hoạt lại toàn bộ sản phẩm thành công!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi máy chủ: " + ex.Message });
            }
        }

        // Helper: Khi Shop bị Cấm/Tạm nghỉ/Khóa -> Từ chối các yêu cầu PENDING + Hủy các đơn hàng PENDING/CONFIRMED/SHIPPING
        private async Task HandleShopDisableInternalAsync(string shopId, string reasonNote, string adminId)
        {
            // 1. Chỉ từ chối các yêu cầu đăng sản phẩm mới đang chờ duyệt (PENDING)
            var pendingProducts = await _context.Products.Where(p => p.ShopId == shopId && p.ApprovalStatus == "PENDING").ToListAsync();
            foreach (var prod in pendingProducts)
            {
                prod.ApprovalStatus = "REJECTED";
                _context.ProductApprovalLogs.Add(new ProductApprovalLog
                {
                    LogId = GenID.GenerateProductApprovalLogId(),
                    ProductId = prod.ProductId,
                    AdminId = adminId,
                    Action = "REJECTED",
                    Note = reasonNote,
                    CreatedAt = DateTime.Now
                });
            }

            // 2. Hủy các đơn hàng chưa hoàn tất (PENDING, CONFIRMED, SHIPPING) và hoàn tồn kho
            var activeOrders = await _context.Orders
                .Include(o => o.Payments)
                .Include(o => o.OrderDetails)
                    .ThenInclude(od => od.Product)
                .Where(o => o.ShopId == shopId && o.Status != "DELIVERED" && o.Status != "CANCELLED")
                .ToListAsync();

            foreach (var order in activeOrders)
            {
                order.Status = "CANCELLED";
                foreach (var detail in order.OrderDetails)
                {
                    if (detail.Product != null)
                    {
                        detail.Product.StockQuantity += detail.Quantity;
                    }
                }
                var payment = order.Payments.FirstOrDefault();
                if (payment != null && payment.PaymentStatus != "PAID")
                {
                    payment.PaymentStatus = "FAILED";
                }
            }
        }
    }
}
