using System;
using System.Collections.Generic;

namespace TMDT_FINAL_NPKL.Entities;

public partial class Cart
{
    public string CartId { get; set; } = null!;

    public string CustomerId { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public virtual ICollection<CartItem> CartItems { get; set; } = new List<CartItem>();

    public virtual User Customer { get; set; } = null!;
}
