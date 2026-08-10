using System;
using System.Collections.Generic;

namespace TMDT_FINAL_NPKL.Entities;

public partial class Shop
{
    public string ShopId { get; set; } = null!;

    public string SellerId { get; set; } = null!;

    public string ShopName { get; set; } = null!;

    public string? Description { get; set; }

    public string? Logo { get; set; }

    public string Status { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public virtual ICollection<Order> Orders { get; set; } = new List<Order>();

    public virtual ICollection<Product> Products { get; set; } = new List<Product>();

    public virtual User Seller { get; set; } = null!;
}
