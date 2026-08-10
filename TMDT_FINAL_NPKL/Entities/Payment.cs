using System;
using System.Collections.Generic;

namespace TMDT_FINAL_NPKL.Entities;

public partial class Payment
{
    public string PaymentId { get; set; } = null!;

    public string OrderId { get; set; } = null!;

    public decimal Amount { get; set; }

    public string PaymentMethod { get; set; } = null!;

    public string PaymentStatus { get; set; } = null!;

    public DateTime? PaidAt { get; set; }

    public virtual Order Order { get; set; } = null!;
}
