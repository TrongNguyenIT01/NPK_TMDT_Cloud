using System;
using System.Collections.Generic;

namespace TMDT_FINAL_NPKL.Entities;

public partial class CartItem
{
    public string CartItemId { get; set; } = null!;

    public string CartId { get; set; } = null!;

    public string ProductId { get; set; } = null!;

    public int Quantity { get; set; }

    public virtual Cart Cart { get; set; } = null!;

    public virtual Product Product { get; set; } = null!;
}
