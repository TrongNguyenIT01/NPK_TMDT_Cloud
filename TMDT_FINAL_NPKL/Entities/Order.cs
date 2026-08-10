using System;
using System.Collections.Generic;

namespace TMDT_FINAL_NPKL.Entities;

public partial class Order
{
    public string OrderId { get; set; } = null!;

    public string CustomerId { get; set; } = null!;

    public string ShopId { get; set; } = null!;

    public DateTime OrderDate { get; set; }

    public decimal TotalAmount { get; set; }

    public string ShippingAddress { get; set; } = null!;

    public string Status { get; set; } = null!;

    public virtual User Customer { get; set; } = null!;

    public virtual ICollection<OrderDetail> OrderDetails { get; set; } = new List<OrderDetail>();

    public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();

    public virtual Shop Shop { get; set; } = null!;
}
