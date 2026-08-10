using System;
using System.Security.Cryptography;
using System.Text;
namespace TMDT_FINAL_NPKL.Models
{
    public class HassPass
    {
        public static string HashPassword(string password)
        {
         
            // Khởi tạo đối tượng SHA256
            using (SHA256 sha256 = SHA256.Create())
            {
                // 1. Chuyển đổi chuỗi mật khẩu thành mảng byte bằng UTF-8
                byte[] inputBytes = Encoding.UTF8.GetBytes(password);

                // 2. Thực hiện băm (Hash)
                byte[] hashBytes = sha256.ComputeHash(inputBytes);

                // 3. Chuyển đổi mảng byte kết quả thành chuỗi Hex để lưu vào Database
                StringBuilder builder = new StringBuilder();
                for (int i = 0; i < hashBytes.Length; i++)
                {
                    // "x2" định dạng byte thành chuỗi Hex in thường (VD: a1b2c3)
                    // Nếu muốn in hoa toàn bộ, bạn có thể đổi thành "X2"
                    builder.Append(hashBytes[i].ToString("x2"));
                }

                return builder.ToString();
            }
        }
    }
}
