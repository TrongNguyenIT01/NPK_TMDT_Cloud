using System.ComponentModel.DataAnnotations;

namespace TMDT_FINAL_NPKL.Models
{
    public class CreateShopRequest
    {
        [Required(ErrorMessage = "Tên cửa hàng không được để trống")]
        [StringLength(150, ErrorMessage = "Tên cửa hàng không được vượt quá 150 ký tự")]
        public string ShopName { get; set; } = null!;

        public string? Description { get; set; }

        [Required(ErrorMessage = "Số điện thoại hotline không được để trống")]
        public string Phone { get; set; } = null!;

        [Required(ErrorMessage = "Email không được để trống")]
        [EmailAddress(ErrorMessage = "Địa chỉ email không hợp lệ")]
        public string Email { get; set; } = null!;

        [Required(ErrorMessage = "Địa chỉ lấy hàng không được để trống")]
        public string Address { get; set; } = null!;
    }

    public class UpdateShopProfileRequest
    {
        [Required(ErrorMessage = "Tên cửa hàng không được để trống")]
        [StringLength(150, ErrorMessage = "Tên cửa hàng không được vượt quá 150 ký tự")]
        public string ShopName { get; set; } = null!;

        public string? Description { get; set; }

        [Required(ErrorMessage = "Số điện thoại hotline không được để trống")]
        public string Phone { get; set; } = null!;

        [Required(ErrorMessage = "Email không được để trống")]
        [EmailAddress(ErrorMessage = "Địa chỉ email không hợp lệ")]
        public string Email { get; set; } = null!;

        [Required(ErrorMessage = "Địa chỉ lấy hàng không được để trống")]
        public string Address { get; set; } = null!;

        public string? Status { get; set; } // Cho phép cập nhật status giữa ACTIVE và INACTIVE
    }
}
