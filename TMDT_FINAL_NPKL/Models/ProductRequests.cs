using Microsoft.AspNetCore.Http;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace TMDT_FINAL_NPKL.Models
{
    public class AddProductRequest
    {
        [Required(ErrorMessage = "Danh mục không được để trống")]
        public string CategoryId { get; set; } = null!;

        [Required(ErrorMessage = "Tên sản phẩm không được để trống")]
        [StringLength(200, ErrorMessage = "Tên sản phẩm không được vượt quá 200 ký tự")]
        public string ProductName { get; set; } = null!;

        public string? Description { get; set; }

        [Required(ErrorMessage = "Giá bán không được để trống")]
        [Range(0, double.MaxValue, ErrorMessage = "Giá bán phải lớn hơn hoặc bằng 0")]
        public decimal Price { get; set; }

        [Required(ErrorMessage = "Số lượng tồn kho không được để trống")]
        [Range(0, int.MaxValue, ErrorMessage = "Số lượng tồn kho phải lớn hơn hoặc bằng 0")]
        public int StockQuantity { get; set; }

        [Required(ErrorMessage = "Vui lòng chọn ảnh đại diện sản phẩm")]
        public IFormFile MainImage { get; set; } = null!;

        // Ảnh chi tiết không bắt buộc phải có, nhưng nếu có thì là 1 list
        public List<IFormFile>? DetailImages { get; set; }
    }
}
