using System;
using System.Collections.Generic;
using System.Security.Claims;

namespace TMDT_FINAL_NPKL.Entities;

public partial class User
{
    internal ClaimsIdentity? role;

    public string UserId { get; set; } = null!;

    public string Username { get; set; } = null!;

    public string PasswordHash { get; set; } = null!;

    public string FullName { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string? Phone { get; set; }

    public string? Address { get; set; }

    public string Role { get; set; } = null!;

    public string Status { get; set; } = null!;

    public string? RejectReason { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Cart? Cart { get; set; }

    public virtual ICollection<Order> Orders { get; set; } = new List<Order>();

    public virtual ICollection<ProductApprovalLog> ProductApprovalLogs { get; set; } = new List<ProductApprovalLog>();

    public virtual ICollection<Shop> Shops { get; set; } = new List<Shop>();

    public virtual ICollection<UserBlock> UserBlocks { get; set; } = new List<UserBlock>();
}
