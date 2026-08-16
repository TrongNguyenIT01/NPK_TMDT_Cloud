using System.ComponentModel.DataAnnotations;

namespace TMDT_FINAL_NPKL.Models
{
    public class UpdateProfileRequest
    {
        [Required(ErrorMessage = "Họ và tên không được để trống.")]
        public string FullName { get; set; } = null!;

        [Required(ErrorMessage = "Email không được để trống.")]
        [EmailAddress(ErrorMessage = "Email không đúng định dạng.")]
        public string Email { get; set; } = null!;

        public string? Phone { get; set; }

        public string? Address { get; set; }
    }
}
