using System;
using System.Collections.Generic;

namespace TMDT_FINAL_NPKL.Models
{
    public class AddToCartRequest
    {
        public string ProductId { get; set; } = null!;
        public int Quantity { get; set; } = 1;
    }

    public class UpdateCartQuantityRequest
    {
        public string ProductId { get; set; } = null!;
        public int Quantity { get; set; }
    }

    public class CartItemDto
    {
        public string CartItemId { get; set; } = null!;
        public string ProductId { get; set; } = null!;
        public string Title { get; set; } = null!;
        public decimal Price { get; set; }
        public string? Img { get; set; }
        public int Qty { get; set; }
        public int StockQuantity { get; set; }
        public string? CategoryTag { get; set; }
        public string? Author { get; set; }
        public decimal Subtotal => Price * Qty;
    }

    public class CartResponse
    {
        public bool Success { get; set; }
        public string? Message { get; set; }
        public string? CartId { get; set; }
        public int TotalItemsCount { get; set; }
        public decimal SubtotalAmount { get; set; }
        public List<CartItemDto> Items { get; set; } = new List<CartItemDto>();
    }
}
