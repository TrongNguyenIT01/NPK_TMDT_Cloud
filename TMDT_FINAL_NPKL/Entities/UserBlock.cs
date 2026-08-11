using System;
using System.Collections.Generic;

namespace TMDT_FINAL_NPKL.Entities;

public partial class UserBlock
{
    public string BlockId { get; set; } = null!;

    public string UserId { get; set; } = null!;

    public string Reason { get; set; } = null!;

    public string Status { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public virtual User User { get; set; } = null!;

    public virtual ICollection<Appeal> Appeals { get; set; } = new List<Appeal>();
}
