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
    public class DoanhMucController : ControllerBase
    {
        private readonly WebTmdtContext _context;

        public DoanhMucController(WebTmdtContext context)
        {
            _context = context;
        }
        [HttpPost("DoanhMuc")]
        public async Task<IActionResult> CreateCategory([FromBody] DoanhMuc request)
        {
            try
            {
                // Kiểm tra xem tên danh mục đã tồn tại chưa
                bool isExist = await _context.Categories.AnyAsync(c => c.CategoryName == request.CategoryName);
                if (isExist)
                {
                    return BadRequest("Tên danh mục này đã tồn tại trên hệ thống.");
                }

                // Khởi tạo thời gian hiện tại
                DateTime currentTime = DateTime.Now;

                // Tự động sinh ID danh mục bằng class GenID
                string newCategoryId = GenID.GenerateCategoryId(request.CategoryName, currentTime);

                // Map dữ liệu từ DTO sang Entity
                var newCategory = new Category
                {
                    CategoryId = newCategoryId,
                    CategoryName = request.CategoryName,
                    Description = request.Description,
                    CreatedAt = currentTime
                };

                // Thêm vào database
                _context.Categories.Add(newCategory);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    Message = "Thêm danh mục thành công!",
                    CategoryId = newCategory.CategoryId
                });
            }
            catch (Exception ex)
            {
                string detailedError = ex.InnerException != null ? ex.InnerException.Message : ex.Message;

                // Ghi log ra màn hình Console của Visual Studio để bạn dễ nhìn
                Console.WriteLine("LỖI DB: " + detailedError);

                return StatusCode(500, $"Chi tiết lỗi: {detailedError}");
            }
        }

        // ==========================================
        // 2. API CHỈNH SỬA DANH MỤC (PUT)
        // Đường dẫn: PUT /api/categories/{id}
        // ==========================================
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCategory(string id, [FromBody] DoanhMuc request)
        {
            try
            {
                // Tìm danh mục cần sửa trong database
                var existingCategory = await _context.Categories.FirstOrDefaultAsync(c => c.CategoryId == id);

                if (existingCategory == null)
                {
                    return NotFound($"Không tìm thấy danh mục có ID: {id}");
                }

                // Kiểm tra trùng tên khi sửa (không tính chính nó)
                bool isDuplicateName = await _context.Categories
                    .AnyAsync(c => c.CategoryName == request.CategoryName && c.CategoryId != id);

                if (isDuplicateName)
                {
                    return BadRequest("Tên danh mục mới bị trùng với một danh mục khác đã có.");
                }

                // Cập nhật thông tin mới (Không cập nhật CategoryId và CreatedAt)
                existingCategory.CategoryName = request.CategoryName;
                existingCategory.Description = request.Description;

                // Lưu thay đổi
                _context.Categories.Update(existingCategory);
                await _context.SaveChangesAsync();

                return Ok(new { Message = "Cập nhật danh mục thành công!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Lỗi server: {ex.Message}");
            }
        }
    }
}
