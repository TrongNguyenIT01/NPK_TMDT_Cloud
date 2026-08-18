using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using TMDT_FINAL_NPKL.Entities;
using TMDT_FINAL_NPKL.Models;

namespace TMDT_FINAL_NPKL.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ThkeSellerController : ControllerBase
    {
        private readonly WebTmdtContext _context;

        public ThkeSellerController(WebTmdtContext context)
        {
            _context = context;
        }

        // Helper: Lấy userId từ Claims Token
        private string? GetCurrentUserId()
        {
            return User.FindFirst("UserId")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        }

        // GET: api/ThkeSeller/revenue-stats
        [HttpGet("revenue-stats")]
        public async Task<IActionResult> GetSellerRevenueStats([FromQuery] int? month, [FromQuery] int? year)
        {
            try
            {
                string? userId = GetCurrentUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { Success = false, Message = "Vui lòng đăng nhập!" });
                }

                var shop = await _context.Shops.FirstOrDefaultAsync(s => s.SellerId == userId);
                if (shop == null)
                {
                    return NotFound(new { Success = false, Message = "Tài khoản của bạn chưa đăng ký cửa hàng!" });
                }

                int targetMonth = (month.HasValue && month.Value >= 1 && month.Value <= 12) ? month.Value : DateTime.Now.Month;
                int targetYear = (year.HasValue && year.Value > 2000) ? year.Value : DateTime.Now.Year;

                // Lấy tất cả đơn hàng thuộc Shop trong tháng/năm này
                var ordersInMonth = await _context.Orders
                    .Include(o => o.Payments)
                    .Where(o => o.ShopId == shop.ShopId && o.OrderDate.Month == targetMonth && o.OrderDate.Year == targetYear)
                    .ToListAsync();

                // Điều kiện doanh thu: Status == "DELIVERED" || PaymentStatus == "PAID"
                var successfulOrders = ordersInMonth
                    .Where(o => o.Status == "DELIVERED" || o.Payments.Any(p => p.PaymentStatus == "PAID"))
                    .ToList();

                decimal totalRevenue = successfulOrders.Sum(o => o.TotalAmount);
                int successfulCount = successfulOrders.Count;
                decimal averageOrderValue = successfulCount > 0 ? totalRevenue / successfulCount : 0;
                int totalOrdersCount = ordersInMonth.Count;
                double successRate = totalOrdersCount > 0 ? Math.Round((double)successfulCount * 100.0 / totalOrdersCount, 1) : 0;

                // Thống kê theo từng ngày trong tháng
                int daysInMonth = DateTime.DaysInMonth(targetYear, targetMonth);
                var dailyStatsList = new List<ThongKeDoanhThuNgayDto>();

                for (int day = 1; day <= daysInMonth; day++)
                {
                    var dailySuccessOrders = successfulOrders.Where(o => o.OrderDate.Day == day).ToList();
                    // Chỉ kê ra các ngày có doanh thu phát sinh
                    if (!dailySuccessOrders.Any()) continue;

                    decimal dailyRevenue = dailySuccessOrders.Sum(o => o.TotalAmount);
                    int dailyCount = dailySuccessOrders.Count;
                    decimal dailyAov = dailyCount > 0 ? dailyRevenue / dailyCount : 0;

                    dailyStatsList.Add(new ThongKeDoanhThuNgayDto
                    {
                        Date = new DateTime(targetYear, targetMonth, day).ToString("dd/MM/yyyy"),
                        DayNumber = day,
                        SuccessfulOrdersCount = dailyCount,
                        DailyRevenue = dailyRevenue,
                        AverageOrderValue = dailyAov
                    });
                }

                var responseDto = new DoanhThuSellerResponseDto
                {
                    ShopId = shop.ShopId,
                    ShopName = shop.ShopName,
                    Month = targetMonth,
                    Year = targetYear,
                    TotalRevenue = totalRevenue,
                    SuccessfulOrdersCount = successfulCount,
                    AverageOrderValue = averageOrderValue,
                    TotalOrdersCount = totalOrdersCount,
                    SuccessRate = successRate,
                    DailyStats = dailyStatsList
                };

                return Ok(new
                {
                    Success = true,
                    Message = $"Lấy báo cáo doanh thu Tháng {targetMonth}/{targetYear} thành công.",
                    Data = responseDto
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi khi lấy báo cáo doanh thu Seller: " + ex.Message });
            }
        }
    }
}
