using System;
using System.Security.Cryptography;
using System.Text;

namespace TMDT_FINAL_NPKL.Models
{
    public class GenID
    {
        public static string GenerateUserId(string role, string username, string fullName, DateTime createdAt)
        {
            // 1. Xác định tiền tố dựa trên Quyền
            string prefix = "";
            switch (role.ToUpper().Trim())
            {
                case "ADMIN":
                    prefix = "ADM";
                    break;
                case "SELLER":
                    prefix = "SLR";
                    break;
                case "CUSTOMER":
                    prefix = "CUS";
                    break;
                default:
                    throw new ArgumentException("Quyền không hợp lệ. Vui lòng truyền ADMIN, Seller hoặc Customer.");
            }

            // 2. Lấy định dạng phút và giây từ thời gian tạo (mm: phút, ss: giây)
            string timePart = createdAt.ToString("mmss");

            // 3. Ghép chuỗi cần Hash: Username + fullname + thời gian tạo
            string rawData = $"{username}{fullName}{timePart}";

            // 4. Thực hiện băm (Hash) chuỗi bằng thuật toán SHA256
            string hashPart = GetHashString(rawData);

            // 5. Cắt lấy 7 ký tự đầu tiên của chuỗi đã Hash (chuyển thành in hoa cho đẹp)
            string shortHash = hashPart.Substring(0, 7).ToUpper();

            // 6. Trả về kết quả: Tiền tố + 7 ký tự Hash
            return $"{prefix}{shortHash}";
        }

        /// <summary>
        /// Hàm hỗ trợ Hash chuỗi đầu vào bằng SHA256 và trả về chuỗi Hex
        /// </summary>
        private static string GetHashString(string inputString)
        {
            using (SHA256 sha256 = SHA256.Create())
            {
                byte[] bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(inputString));
                StringBuilder builder = new StringBuilder();

                for (int i = 0; i < bytes.Length; i++)
                {
                    builder.Append(bytes[i].ToString("x2"));
                }
                return builder.ToString();
            }
        }

        public static string GenerateBlockId()
        {
            // Sử dụng YYMMDDHHMMSSfff để tạo mã hồ sơ xử lý (19 ký tự: BLK- + 15 ký tự thời gian)
            // Đảm bảo không vượt quá độ dài tối đa VARCHAR(20) của cột CSDL
            return "BLK-" + DateTime.Now.ToString("yyMMddHHmmssfff");
        }

        public static string GenerateAppealId()
        {
            // Sử dụng YYMMDDHHMMSSfff để tạo mã khiếu nại (18 ký tự: APL + 15 ký tự thời gian)
            // Đảm bảo không vượt quá độ dài tối đa VARCHAR(20) của cột CSDL
            return "APL" + DateTime.Now.ToString("yyMMddHHmmssfff");
        }

        public static string GenerateProductApprovalLogId()
        {
            // Sử dụng YYMMDDHHMMSSfff để tạo mã log duyệt sản phẩm (19 ký tự: LOG- + 15 ký tự thời gian)
            // Đảm bảo không vượt quá độ dài tối đa VARCHAR(20) của cột CSDL
            return "LOG-" + DateTime.Now.ToString("yyMMddHHmmssfff");
        }


        public static string GenerateCategoryId(string categoryName, DateTime createdAt)
        {
            // 1. Tiền tố cố định
            string prefix = "CAT";

            // 2. Định dạng thời gian (Lấy đầy đủ yyMMddHHmmss để đảm bảo độ phân giải cao nhất)
            string timePart = createdAt.ToString("yyMMddHHmmss");

            // 3. Ghép chuỗi cần Hash: Tên danh mục + thời gian tạo
            string rawData = $"{categoryName}{timePart}";

            // 4. Băm (Hash) chuỗi bằng thuật toán SHA256 (tái sử dụng hàm GetHashString)
            string hashPart = GetHashString(rawData);

            // 5. Cắt lấy 5 ký tự đầu tiên của chuỗi đã Hash, chuyển thành in hoa
            string shortHash = hashPart.Substring(0, 5).ToUpper();

            // 6. Trả về kết quả: CAT + 5 ký tự Hash
            return $"{prefix}{shortHash}";
        }

        public static string GenerateProductId(string categoryName, string productName, string shopName)
        {
            // 1. Tiền tố cố định cho Sản phẩm
            string prefix = "SP";

            // 2. Ghép chuỗi cần Hash: Tên danh mục + Tên sản phẩm + Tên shop
            string rawData = $"{categoryName}{productName}{shopName}";

            // 3. Băm (Hash) chuỗi bằng thuật toán SHA256 (tái sử dụng hàm GetHashString có sẵn)
            string hashPart = GetHashString(rawData);

            // 4. Cắt lấy 8 ký tự đầu tiên của chuỗi đã Hash, chuyển thành in hoa cho đẹp
            string shortHash = hashPart.Substring(0, 8).ToUpper();

            // 5. Trả về kết quả: SP + 8 ký tự Hash (Tổng cộng 10 ký tự)
            return $"{prefix}{shortHash}";
        }
    }
}
