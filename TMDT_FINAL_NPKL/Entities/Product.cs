using System;
using System.Collections.Generic;

namespace TMDT_FINAL_NPKL.Entities;

public partial class Product
{
    public string ProductId { get; set; } = null!;

    public string ShopId { get; set; } = null!;

    public string CategoryId { get; set; } = null!;

    public string ProductName { get; set; } = null!;

    public string? Description { get; set; }

    public decimal Price { get; set; }

    public int StockQuantity { get; set; }

    public string? Image { get; set; }

    public string ApprovalStatus { get; set; } = null!;

    public bool IsDeleted { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual ICollection<CartItem> CartItems { get; set; } = new List<CartItem>();

    public virtual Category Category { get; set; } = null!;

    public virtual ICollection<OrderDetail> OrderDetails { get; set; } = new List<OrderDetail>();

    public virtual ICollection<ProductApprovalLog> ProductApprovalLogs { get; set; } = new List<ProductApprovalLog>();

    public virtual ICollection<ProductImage> ProductImages { get; set; } = new List<ProductImage>();

    public virtual Shop Shop { get; set; } = null!;
}
