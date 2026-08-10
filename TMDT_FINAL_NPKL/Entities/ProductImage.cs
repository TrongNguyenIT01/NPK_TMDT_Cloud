using System;
using System.Collections.Generic;

namespace TMDT_FINAL_NPKL.Entities;

public partial class ProductImage
{
    public string ImageId { get; set; } = null!;

    public string ProductId { get; set; } = null!;

    public string ImageUrl { get; set; } = null!;

    public virtual Product Product { get; set; } = null!;
}
