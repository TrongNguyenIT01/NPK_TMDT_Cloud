using System;
using System.Collections.Generic;

namespace TMDT_FINAL_NPKL.Entities;

public partial class Category
{
    public string CategoryId { get; set; } = null!;

    public string CategoryName { get; set; } = null!;

    public string? Description { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual ICollection<Product> Products { get; set; } = new List<Product>();
}
