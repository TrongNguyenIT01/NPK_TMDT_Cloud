using System;
using System.Collections.Generic;

namespace TMDT_FINAL_NPKL.Entities;

public partial class ProductApprovalLog
{
    public string LogId { get; set; } = null!;

    public string ProductId { get; set; } = null!;

    public string AdminId { get; set; } = null!;

    public string Action { get; set; } = null!;

    public string? Note { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual User Admin { get; set; } = null!;

    public virtual Product Product { get; set; } = null!;
}
