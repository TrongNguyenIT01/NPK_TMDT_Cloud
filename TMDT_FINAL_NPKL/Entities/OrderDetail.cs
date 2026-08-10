using System;
using System.Collections.Generic;

namespace TMDT_FINAL_NPKL.Entities;

public partial class OrderDetail
{
    public string DetailId { get; set; } = null!;

    public string OrderId { get; set; } = null!;

    public string ProductId { get; set; } = null!;

    public int Quantity { get; set; }

    public decimal Price { get; set; }

    public virtual Order Order { get; set; } = null!;

    public virtual Product Product { get; set; } = null!;
}
