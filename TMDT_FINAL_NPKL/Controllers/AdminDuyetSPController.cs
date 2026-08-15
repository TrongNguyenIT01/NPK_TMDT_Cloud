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
    public class AdminDuyetSPController : ControllerBase
    {
        private readonly WebTmdtContext _context;

        public AdminDuyetSPController(WebTmdtContext context)
        {
            _context = context;
        }

        [HttpGet("all-products")]
        public async Task<IActionResult> GetAllProducts([FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] string status = "all")
        {
            try
            {
                var query = _context.Products
                    .Include(p => p.Shop)
                    .Include(p => p.Category)
                    .Where(p => p.IsDeleted == false) // Không lấy sản phẩm mà shop đã xóa
                    .AsQueryable();

                if (!string.IsNullOrEmpty(status) && status.ToLower() != "all")
                {
                    query = query.Where(p => p.ApprovalStatus.ToLower() == status.ToLower());
                }

                // Sắp xếp sản phẩm mới nhất lên trước
                query = query.OrderByDescending(p => p.CreatedAt);

                int totalItems = await query.CountAsync();
                int totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);

                var products = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(p => new
                    {
                        p.ProductId,
                        p.ProductName,
                        p.CategoryId,
                        CategoryName = p.Category.CategoryName,
                        p.ShopId,
                        ShopName = p.Shop.ShopName,
                        p.Price,
                        p.StockQuantity,
                        p.Image,
                        p.ApprovalStatus,
                        p.IsDeleted,
                        p.CreatedAt
                    })
                    .ToListAsync();

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

        [HttpPost("approve/{productId}")]
        public async Task<IActionResult> ApproveProduct(string productId, [FromBody] AdminDuyetSP request)
        {
            try
            {
                if (request == null || string.IsNullOrWhiteSpace(request.Status))
                {
                    return BadRequest(new { Success = false, Message = "Trạng thái không được để trống!" });
                }

                string statusInput = request.Status.ToUpper().Trim();
                if (statusInput != "APPROVED" && statusInput != "REJECTED" && statusInput != "PENDING")
                {
                    return BadRequest(new { Success = false, Message = "Trạng thái không hợp lệ. Chỉ chấp nhận APPROVED, REJECTED hoặc PENDING." });
                }

                var product = await _context.Products.FirstOrDefaultAsync(p => p.ProductId == productId);

                if (product == null)
                {
                    return NotFound(new { Success = false, Message = "Không tìm thấy sản phẩm!" });
                }

                // Lấy UserId của Admin từ JWT Claims
                string? adminId = User.FindFirst("UserId")?.Value;

                if (string.IsNullOrEmpty(adminId))
                {
                    return Unauthorized(new { Success = false, Message = "Không xác định được danh tính Admin!" });
                }

                product.ApprovalStatus = statusInput;

                // Tạo bản ghi log
                var log = new ProductApprovalLog
                {
                    LogId = GenID.GenerateProductApprovalLogId(),
                    ProductId = productId,
                    AdminId = adminId,
                    Action = statusInput,
                    Note = request.Note,
                    CreatedAt = DateTime.Now
                };

                await _context.ProductApprovalLogs.AddAsync(log);
                await _context.SaveChangesAsync();

                return Ok(new { Success = true, Message = $"Đã {statusInput.ToLower()} sản phẩm thành công!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi máy chủ: " + ex.Message });
            }
        }
        [HttpGet("logs")]
        public async Task<IActionResult> GetProductApprovalLogs()
        {
            try
            {
                var logs = await _context.ProductApprovalLogs
                    .Include(l => l.Admin)
                    .Include(l => l.Product)
                        .ThenInclude(p => p.Shop)
                    .OrderByDescending(l => l.CreatedAt)
                    .Select(l => new
                    {
                        l.LogId,
                        l.ProductId,
                        ProductName = l.Product != null ? l.Product.ProductName : "N/A",
                        ShopName = (l.Product != null && l.Product.Shop != null) ? l.Product.Shop.ShopName : "N/A",
                        AdminName = l.Admin != null ? l.Admin.FullName : "Unknown",
                        l.Action,
                        l.Note,
                        l.CreatedAt
                    })
                    .ToListAsync();

                return Ok(new
                {
                    Success = true,
                    Message = "Lấy danh sách log thành công.",
                    Data = logs
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi máy chủ: " + ex.Message });
            }
        }
    }
}
