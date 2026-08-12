namespace TMDT_FINAL_NPKL.Models
{
    public class DangNhapRequest
    {
        public string Username { get; set; }
        public string Password { get; set; }
  
    }

    public class DangNhapResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public string RedirectUrl { get; set; } // Đường dẫn frontend cần chuyển trang tới
        public string Token { get; set; }       // Token dùng để xác thực các chức năng sau này
        public string Role { get; set; }
        public string Username { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
        public string? BlockId { get; set; }
        public string? BlockReason { get; set; }
        public string? RejectReason { get; set; }
    }
}
