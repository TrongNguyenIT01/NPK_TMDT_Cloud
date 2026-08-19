using System.ComponentModel.DataAnnotations;

namespace TMDT_FINAL_NPKL.Models
{
    public class YeuCauGuiOtp
    {
        [Required(ErrorMessage = "Email không được để trống.")]
        [EmailAddress(ErrorMessage = "Email không đúng định dạng.")]
        public string Email { get; set; } = null!;
    }

    public class XacNhanMatKhauMoi
    {
        [Required(ErrorMessage = "Email không được để trống.")]
        [EmailAddress(ErrorMessage = "Email không đúng định dạng.")]
        public string Email { get; set; } = null!;

        [Required(ErrorMessage = "Mã OTP không được để trống.")]
        [StringLength(6, MinimumLength = 6, ErrorMessage = "Mã OTP phải gồm đúng 6 ký tự.")]
        public string Otp { get; set; } = null!;

        [Required(ErrorMessage = "Mật khẩu mới không được để trống.")]
        [MinLength(8, ErrorMessage = "Mật khẩu mới phải có tối thiểu 8 ký tự.")]
        public string NewPassword { get; set; } = null!;

        [Required(ErrorMessage = "Xác nhận mật khẩu mới không được để trống.")]
        [Compare("NewPassword", ErrorMessage = "Mật khẩu xác nhận không khớp.")]
        public string ConfirmPassword { get; set; } = null!;
    }

    public class YeuCauXacThucOtp
    {
        [Required(ErrorMessage = "Email không được để trống.")]
        [EmailAddress(ErrorMessage = "Email không đúng định dạng.")]
        public string Email { get; set; } = null!;

        [Required(ErrorMessage = "Mã OTP không được để trống.")]
        [StringLength(6, MinimumLength = 6, ErrorMessage = "Mã OTP phải gồm đúng 6 ký tự.")]
        public string Otp { get; set; } = null!;
    }
}
