using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace TMDT_FINAL_NPKL.Models
{
    public class TaoDonHangRequest
    {
        [Required(ErrorMessage = "Địa chỉ nhận hàng không được để trống")]
        public string ShippingAddress { get; set; } = null!;

        public string? RecipientName { get; set; }

        public string? Phone { get; set; }

        public string? Email { get; set; }

        public string PaymentMethod { get; set; } = "COD";

        public string? Note { get; set; }

        // Danh sách ProductId người dùng chọn đặt (nếu rỗng/null sẽ đặt toàn bộ sản phẩm trong giỏ hàng)
        public List<string>? SelectedProductIds { get; set; }
    }

    public class CapNhatTrangThaiDonHangRequest
    {
        [Required(ErrorMessage = "Trạng thái đơn hàng không được để trống")]
        public string Status { get; set; } = null!;
    }

    public class ChiTietSanPhamDonHangDto
    {
        public string DetailId { get; set; } = null!;
        public string ProductId { get; set; } = null!;
        public string ProductName { get; set; } = null!;
        public string? ProductImage { get; set; }
        public int Quantity { get; set; }
        public decimal Price { get; set; }
        public decimal Subtotal => Quantity * Price;
    }

    public class ThanhToanDonHangDto
    {
        public string PaymentId { get; set; } = null!;
        public string OrderId { get; set; } = null!;
        public decimal Amount { get; set; }
        public string PaymentMethod { get; set; } = null!;
        public string PaymentStatus { get; set; } = null!;
        public DateTime? PaidAt { get; set; }
    }

    public class TimKiemDonHangFilter
    {
        public string? Status { get; set; }
        public string? ShopId { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public string? SearchKeyword { get; set; }
    }

    public class ThongKeDonHangAdminDto
    {
        public int TongSoDonHang { get; set; }
        public decimal TongDoanhThu { get; set; }
        public int SoDonPending { get; set; }
        public int SoDonConfirmed { get; set; }
        public int SoDonShipping { get; set; }
        public int SoDonDelivered { get; set; }
        public int SoDonCancelled { get; set; }
    }

    public class DonHangResponseDto
    {
        public string OrderId { get; set; } = null!;
        public string CustomerId { get; set; } = null!;
        public string? CustomerName { get; set; }
        public string ShopId { get; set; } = null!;
        public string? ShopName { get; set; }
        public DateTime OrderDate { get; set; }
        public decimal TotalAmount { get; set; }
        public string ShippingAddress { get; set; } = null!;
        public string Status { get; set; } = null!;
        public ThanhToanDonHangDto? Payment { get; set; }
        public List<ChiTietSanPhamDonHangDto> OrderDetails { get; set; } = new List<ChiTietSanPhamDonHangDto>();
    }
}
