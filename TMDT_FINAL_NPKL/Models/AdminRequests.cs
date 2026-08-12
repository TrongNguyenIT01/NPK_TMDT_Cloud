namespace TMDT_FINAL_NPKL.Models
{
    public class RejectUserRequest
    {
        public string Reason { get; set; } = null!;
    }

    public class BlockUserRequest
    {
        public string Reason { get; set; } = null!;
    }

    public class ResolveAppealRequest
    {
        public string Status { get; set; } = null!;
        public string? AdminNote { get; set; }
    }
}
