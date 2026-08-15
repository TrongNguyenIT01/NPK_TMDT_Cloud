using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using TMDT_FINAL_NPKL.Entities;
using TMDT_FINAL_NPKL.Models;

namespace TMDT_FINAL_NPKL.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "SELLER")]
    public class SanPhamController : ControllerBase
    {
        private readonly WebTmdtContext _context;
        private readonly IWebHostEnvironment _env;

        public SanPhamController(WebTmdtContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        [HttpPost("add-product")]
        public async Task<IActionResult> AddProduct([FromForm] AddProductRequest request)
        {
            try
            {
                // 1. Xác thực người dùng và kiểm tra cửa hàng
                string? userId = User.FindFirst("UserId")?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { Success = false, Message = "Không tìm thấy thông tin định danh người dùng!" });
                }

                var shop = await _context.Shops.FirstOrDefaultAsync(s => s.SellerId == userId);
                if (shop == null)
                {
                    return BadRequest(new { Success = false, Message = "Bạn chưa đăng ký cửa hàng!" });
                }

                if (shop.Status != "ACTIVE")
                {
                    return BadRequest(new { Success = false, Message = "Cửa hàng của bạn chưa được phê duyệt hoặc đang bị khóa, không thể đăng sản phẩm!" });
                }

                // 2. Lấy thông tin danh mục
                var category = await _context.Categories.FindAsync(request.CategoryId);
                if (category == null)
                {
                    return BadRequest(new { Success = false, Message = "Danh mục không tồn tại!" });
                }

                // 3. Tạo Product ID
                string productId = GenID.GenerateProductId(category.CategoryName, request.ProductName, shop.ShopName);

                // Đảm bảo ProductId không trùng lặp (trường hợp hiếm)
                if (await _context.Products.AnyAsync(p => p.ProductId == productId))
                {
                    productId = productId + Guid.NewGuid().ToString("N").Substring(0, 4).ToUpper();
                }

                // 4. Xử lý upload ảnh đại diện (MainImage)
                string mainImageUrl = "";
                if (request.MainImage != null)
                {
                    var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
                    var extension = Path.GetExtension(request.MainImage.FileName).ToLower();

                    if (!allowedExtensions.Contains(extension))
                    {
                        return BadRequest(new { Success = false, Message = "Chỉ chấp nhận file ảnh định dạng JPG, JPEG, PNG, WEBP." });
                    }

                    if (request.MainImage.Length > 5 * 1024 * 1024) // 5MB
                    {
                        return BadRequest(new { Success = false, Message = "Dung lượng ảnh đại diện tối đa là 5MB." });
                    }

                    string uploadsFolder = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "images", "products");
                    if (!Directory.Exists(uploadsFolder))
                    {
                        Directory.CreateDirectory(uploadsFolder);
                    }

                    string uniqueFileName = Guid.NewGuid().ToString() + "_" + Path.GetFileName(request.MainImage.FileName);
                    string filePath = Path.Combine(uploadsFolder, uniqueFileName);

                    using (var fileStream = new FileStream(filePath, FileMode.Create))
                    {
                        await request.MainImage.CopyToAsync(fileStream);
                    }
                    
                    mainImageUrl = "/images/products/" + uniqueFileName;
                }

                // 5. Tạo đối tượng Product
                var product = new Product
                {
                    ProductId = productId,
                    ShopId = shop.ShopId,
                    CategoryId = request.CategoryId,
                    ProductName = request.ProductName.Trim(),
                    Description = request.Description?.Trim(),
                    Price = request.Price,
                    StockQuantity = request.StockQuantity,
                    Image = mainImageUrl,
                    ApprovalStatus = "PENDING", // Trạng thái chờ duyệt
                    IsDeleted = false,
                    CreatedAt = DateTime.Now
                };

                await _context.Products.AddAsync(product);

                // 6. Xử lý upload ảnh chi tiết (DetailImages)
                if (request.DetailImages != null && request.DetailImages.Any())
                {
                    string uploadsFolder = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "images", "products");
                    if (!Directory.Exists(uploadsFolder))
                    {
                        Directory.CreateDirectory(uploadsFolder);
                    }

                    foreach (var file in request.DetailImages)
                    {
                        if (file.Length > 0)
                        {
                            var extension = Path.GetExtension(file.FileName).ToLower();
                            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
                            
                            if (allowedExtensions.Contains(extension) && file.Length <= 5 * 1024 * 1024)
                            {
                                string uniqueFileName = Guid.NewGuid().ToString() + "_" + Path.GetFileName(file.FileName);
                                string filePath = Path.Combine(uploadsFolder, uniqueFileName);

                                using (var fileStream = new FileStream(filePath, FileMode.Create))
                                {
                                    await file.CopyToAsync(fileStream);
                                }

                                var productImage = new ProductImage
                                {
                                    ImageId = "IMG" + Guid.NewGuid().ToString("N").Substring(0, 15).ToUpper(),
                                    ProductId = productId,
                                    ImageUrl = "/images/products/" + uniqueFileName
                                };

                                await _context.ProductImages.AddAsync(productImage);
                            }
                        }
                    }
                }

                // 7. Lưu thay đổi
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    Success = true,
                    Message = "Đăng sản phẩm thành công! Vui lòng chờ Admin phê duyệt.",
                    Data = new { ProductId = product.ProductId }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi máy chủ: " + ex.Message });
            }
        }

        // ==========================================
        // API PUBLIC CHO TRANG CHỦ / KHÁCH HÀNG
        // ==========================================
        [HttpGet("public-products")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPublicProducts([FromQuery] string? categoryId = null, [FromQuery] string? keyword = null)
        {
            try
            {
                var query = _context.Products
                    .Include(p => p.Category)
                    .Include(p => p.Shop)
                        .ThenInclude(s => s.Seller)
                    .Include(p => p.ProductImages)
                    .Where(p => p.ApprovalStatus == "APPROVED" && p.IsDeleted == false)
                    .AsQueryable();

                // Lọc theo danh mục nếu có
                if (!string.IsNullOrWhiteSpace(categoryId) && categoryId.ToUpper() != "ALL")
                {
                    query = query.Where(p => p.CategoryId == categoryId);
                }

                // Lọc theo từ khóa tìm kiếm nếu có
                if (!string.IsNullOrWhiteSpace(keyword))
                {
                    string kw = keyword.Trim().ToLower();
                    query = query.Where(p => p.ProductName.ToLower().Contains(kw) 
                                          || (p.Description != null && p.Description.ToLower().Contains(kw))
                                          || p.Category.CategoryName.ToLower().Contains(kw));
                }

                var products = await query
                    .OrderByDescending(p => p.CreatedAt)
                    .Select(p => new
                    {
                        ProductId = p.ProductId,
                        ProductName = p.ProductName,
                        CategoryId = p.CategoryId,
                        CategoryName = p.Category != null ? p.Category.CategoryName : "",
                        Price = p.Price,
                        StockQuantity = p.StockQuantity,
                        Image = p.Image,
                        Description = p.Description,
                        CreatedAt = p.CreatedAt,
                        Shop = p.Shop != null ? new
                        {
                            ShopId = p.Shop.ShopId,
                            ShopName = p.Shop.ShopName,
                            SellerName = p.Shop.Seller != null ? p.Shop.Seller.FullName : "",
                            SellerPhone = p.Shop.Seller != null ? p.Shop.Seller.Phone : "",
                            SellerEmail = p.Shop.Seller != null ? p.Shop.Seller.Email : "",
                            SellerAddress = p.Shop.Seller != null ? p.Shop.Seller.Address : ""
                        } : null,
                        Images = p.ProductImages.Select(img => img.ImageUrl).ToList()
                    })
                    .ToListAsync();

                return Ok(new
                {
                    Success = true,
                    Message = "Lấy danh sách sản phẩm thành công.",
                    Data = products
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi máy chủ: " + ex.Message });
            }
        }

        [HttpGet("public-detail/{productId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPublicProductDetail(string productId)
        {
            try
            {
                var product = await _context.Products
                    .Include(p => p.Category)
                    .Include(p => p.Shop)
                        .ThenInclude(s => s.Seller)
                    .Include(p => p.ProductImages)
                    .FirstOrDefaultAsync(p => p.ProductId == productId && p.ApprovalStatus == "APPROVED" && p.IsDeleted == false);

                if (product == null)
                {
                    return NotFound(new { Success = false, Message = "Không tìm thấy sản phẩm hoặc sản phẩm chưa được duyệt!" });
                }

                return Ok(new
                {
                    Success = true,
                    Data = new
                    {
                        ProductId = product.ProductId,
                        ProductName = product.ProductName,
                        CategoryId = product.CategoryId,
                        CategoryName = product.Category?.CategoryName ?? "",
                        Price = product.Price,
                        StockQuantity = product.StockQuantity,
                        Image = product.Image,
                        Description = product.Description,
                        CreatedAt = product.CreatedAt,
                        Shop = product.Shop != null ? new
                        {
                            ShopId = product.Shop.ShopId,
                            ShopName = product.Shop.ShopName,
                            SellerName = product.Shop.Seller?.FullName ?? "",
                            SellerPhone = product.Shop.Seller?.Phone ?? "",
                            SellerEmail = product.Shop.Seller?.Email ?? "",
                            SellerAddress = product.Shop.Seller?.Address ?? ""
                        } : null,
                        Images = product.ProductImages.Select(img => img.ImageUrl).ToList()
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi máy chủ: " + ex.Message });
            }
        }
    }
}
