using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading.Tasks;
using TMDT_FINAL_NPKL.Entities;
using TMDT_FINAL_NPKL.Models; // Thêm dòng này để gọi class DashboardAD

namespace TMDT_FINAL_NPKL.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DashboardController : ControllerBase
    {
        private readonly WebTmdtContext _context;

        public DashboardController(WebTmdtContext context)
        {
            _context = context;
        }

        [HttpGet("dashboard-metrics")]
        public async Task<IActionResult> GetDashboardMetrics()
        {
            try
            {
                // Đếm số lượng Người dùng
                var totalUsers = await _context.Users.CountAsync(u => u.Status != "REJECTED" && u.Status !="PENDING");
                var pendingUsers = await _context.Users.CountAsync(u => u.Status == "PENDING");

                // Đếm số lượng Cửa hàng hoạt động
                var activeShops = await _context.Shops.CountAsync(s => s.Status == "ACTIVE");

       
                var totalProducts = await _context.Products.CountAsync(p => p.IsDeleted == false);
                var pendingProducts = await _context.Products
                    .CountAsync(p => p.ApprovalStatus == "PENDING" && p.IsDeleted == false);

                // Gán dữ liệu vào class DashboardAD của bạn
                var metrics = new DashboardAD
                {
                    TotalUsers = totalUsers,
                    PendingUsers = pendingUsers,
                    ActiveShops = activeShops,
                    TotalProducts = totalProducts,
                    PendingProducts = pendingProducts
                };

                return Ok(metrics);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Lỗi server: {ex.Message}");
            }
        }
    }
}