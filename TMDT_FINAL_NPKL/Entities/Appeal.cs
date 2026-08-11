using System;

namespace TMDT_FINAL_NPKL.Entities;

public partial class Appeal
{
    public string AppealId { get; set; } = null!;

    public string BlockId { get; set; } = null!;

    public string Title { get; set; } = null!;

    public string Content { get; set; } = null!;

    public string Status { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public DateTime? ResolvedAt { get; set; }

    public string? ResolvedBy { get; set; }

    public string? AdminNote { get; set; }

    public virtual UserBlock Block { get; set; } = null!;

    public virtual User? ResolvedByNavigation { get; set; }
}
