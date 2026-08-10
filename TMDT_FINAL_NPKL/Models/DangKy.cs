using System.ComponentModel.DataAnnotations;
namespace TMDT_FINAL_NPKL.Models
{
    public class DangKy
    {
        [Required(ErrorMessage = "Tên đăng nhập không được để trống.")]
        [StringLength(50, ErrorMessage = "Tên đăng nhập không được vượt quá 50 ký tự.")]
        public string Username { get; set; }

        [Required(ErrorMessage = "Mật khẩu không được để trống.")]
        [MinLength(8, ErrorMessage = "Mật khẩu phải có tối thiểu 8 ký tự.")] 
        public string Password { get; set; }

        [Required(ErrorMessage = "Họ và tên không được để trống.")]
        public string FullName { get; set; }

        [Required(ErrorMessage = "Email không được để trống.")]
        [EmailAddress(ErrorMessage = "Email không đúng định dạng.")]
        public string Email { get; set; }

        // Dùng Regex để kiểm tra sơ bộ định dạng SĐT Việt Nam
        [RegularExpression(@"^(0[3|5|7|8|9])+([0-9]{8})$", ErrorMessage = "Số điện thoại không hợp lệ.")]
        public string Phone { get; set; }

        public string? Address { get; set; }

        [Required(ErrorMessage = "Vai trò không được để trống.")]
        public string Role { get; set; }
    }
}
