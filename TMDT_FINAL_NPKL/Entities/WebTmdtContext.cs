using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace TMDT_FINAL_NPKL.Entities;

public partial class WebTmdtContext : DbContext
{
    public WebTmdtContext()
    {
    }

    public WebTmdtContext(DbContextOptions<WebTmdtContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Cart> Carts { get; set; }

    public virtual DbSet<CartItem> CartItems { get; set; }

    public virtual DbSet<Category> Categories { get; set; }

    public virtual DbSet<Order> Orders { get; set; }

    public virtual DbSet<OrderDetail> OrderDetails { get; set; }

    public virtual DbSet<Payment> Payments { get; set; }

    public virtual DbSet<Product> Products { get; set; }

    public virtual DbSet<ProductApprovalLog> ProductApprovalLogs { get; set; }

    public virtual DbSet<ProductImage> ProductImages { get; set; }

    public virtual DbSet<Shop> Shops { get; set; }

    public virtual DbSet<User> Users { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
        => optionsBuilder.UseSqlServer(" Server=.; Database=WEB_TMDT; Integrated Security=True; Trust Server Certificate=True ");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Cart>(entity =>
        {
            entity.ToTable("carts");

            entity.HasIndex(e => e.CustomerId, "UQ_carts_customer").IsUnique();

            entity.Property(e => e.CartId)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("cart_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("created_at");
            entity.Property(e => e.CustomerId)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("customer_id");

            entity.HasOne(d => d.Customer).WithOne(p => p.Cart)
                .HasForeignKey<Cart>(d => d.CustomerId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_carts_customer");
        });

        modelBuilder.Entity<CartItem>(entity =>
        {
            entity.ToTable("cart_items");

            entity.HasIndex(e => e.ProductId, "IX_cart_items_product_id");

            entity.HasIndex(e => new { e.CartId, e.ProductId }, "UQ_cart_items_cart_product").IsUnique();

            entity.Property(e => e.CartItemId)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("cart_item_id");
            entity.Property(e => e.CartId)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("cart_id");
            entity.Property(e => e.ProductId)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("product_id");
            entity.Property(e => e.Quantity).HasColumnName("quantity");

            entity.HasOne(d => d.Cart).WithMany(p => p.CartItems)
                .HasForeignKey(d => d.CartId)
                .HasConstraintName("FK_cart_items_cart");

            entity.HasOne(d => d.Product).WithMany(p => p.CartItems)
                .HasForeignKey(d => d.ProductId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_cart_items_product");
        });

        modelBuilder.Entity<Category>(entity =>
        {
            entity.ToTable("categories");

            entity.Property(e => e.CategoryId)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("category_id");
            entity.Property(e => e.CategoryName)
                .HasMaxLength(100)
                .HasColumnName("category_name");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("created_at");
            entity.Property(e => e.Description).HasColumnName("description");
        });

        modelBuilder.Entity<Order>(entity =>
        {
            entity.ToTable("orders");

            entity.HasIndex(e => e.CustomerId, "IX_orders_customer_id");

            entity.HasIndex(e => e.ShopId, "IX_orders_shop_id");

            entity.Property(e => e.OrderId)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("order_id");
            entity.Property(e => e.CustomerId)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("customer_id");
            entity.Property(e => e.OrderDate)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("order_date");
            entity.Property(e => e.ShippingAddress)
                .HasMaxLength(255)
                .HasColumnName("shipping_address");
            entity.Property(e => e.ShopId)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("shop_id");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasDefaultValue("PENDING")
                .HasColumnName("status");
            entity.Property(e => e.TotalAmount)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("total_amount");

            entity.HasOne(d => d.Customer).WithMany(p => p.Orders)
                .HasForeignKey(d => d.CustomerId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_orders_customer");

            entity.HasOne(d => d.Shop).WithMany(p => p.Orders)
                .HasForeignKey(d => d.ShopId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_orders_shop");
        });

        modelBuilder.Entity<OrderDetail>(entity =>
        {
            entity.HasKey(e => e.DetailId);

            entity.ToTable("order_details");

            entity.HasIndex(e => e.OrderId, "IX_order_details_order_id");

            entity.HasIndex(e => e.ProductId, "IX_order_details_product_id");

            entity.Property(e => e.DetailId)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("detail_id");
            entity.Property(e => e.OrderId)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("order_id");
            entity.Property(e => e.Price)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("price");
            entity.Property(e => e.ProductId)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("product_id");
            entity.Property(e => e.Quantity).HasColumnName("quantity");

            entity.HasOne(d => d.Order).WithMany(p => p.OrderDetails)
                .HasForeignKey(d => d.OrderId)
                .HasConstraintName("FK_order_details_order");

            entity.HasOne(d => d.Product).WithMany(p => p.OrderDetails)
                .HasForeignKey(d => d.ProductId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_order_details_product");
        });

        modelBuilder.Entity<Payment>(entity =>
        {
            entity.ToTable("payments");

            entity.HasIndex(e => e.OrderId, "IX_payments_order_id");

            entity.Property(e => e.PaymentId)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("payment_id");
            entity.Property(e => e.Amount)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("amount");
            entity.Property(e => e.OrderId)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("order_id");
            entity.Property(e => e.PaidAt)
                .HasColumnType("datetime")
                .HasColumnName("paid_at");
            entity.Property(e => e.PaymentMethod)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("payment_method");
            entity.Property(e => e.PaymentStatus)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasDefaultValue("PENDING")
                .HasColumnName("payment_status");

            entity.HasOne(d => d.Order).WithMany(p => p.Payments)
                .HasForeignKey(d => d.OrderId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_payments_order");
        });

        modelBuilder.Entity<Product>(entity =>
        {
            entity.ToTable("products");

            entity.HasIndex(e => e.CategoryId, "IX_products_category_id");

            entity.HasIndex(e => e.ProductName, "IX_products_name");

            entity.HasIndex(e => e.ShopId, "IX_products_shop_id");

            entity.Property(e => e.ProductId)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("product_id");
            entity.Property(e => e.ApprovalStatus)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasDefaultValue("PENDING")
                .HasColumnName("approval_status");
            entity.Property(e => e.CategoryId)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("category_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("created_at");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.Image)
                .HasMaxLength(255)
                .IsUnicode(false)
                .HasColumnName("image");
            entity.Property(e => e.IsDeleted).HasColumnName("is_deleted");
            entity.Property(e => e.Price)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("price");
            entity.Property(e => e.ProductName)
                .HasMaxLength(255)
                .HasColumnName("product_name");
            entity.Property(e => e.ShopId)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("shop_id");
            entity.Property(e => e.StockQuantity).HasColumnName("stock_quantity");

            entity.HasOne(d => d.Category).WithMany(p => p.Products)
                .HasForeignKey(d => d.CategoryId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_products_category");

            entity.HasOne(d => d.Shop).WithMany(p => p.Products)
                .HasForeignKey(d => d.ShopId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_products_shop");
        });

        modelBuilder.Entity<ProductApprovalLog>(entity =>
        {
            entity.HasKey(e => e.LogId);

            entity.ToTable("product_approval_logs");

            entity.HasIndex(e => e.AdminId, "IX_logs_admin_id");

            entity.HasIndex(e => e.ProductId, "IX_logs_product_id");

            entity.Property(e => e.LogId)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("log_id");
            entity.Property(e => e.Action)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("action");
            entity.Property(e => e.AdminId)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("admin_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("created_at");
            entity.Property(e => e.Note).HasColumnName("note");
            entity.Property(e => e.ProductId)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("product_id");

            entity.HasOne(d => d.Admin).WithMany(p => p.ProductApprovalLogs)
                .HasForeignKey(d => d.AdminId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_logs_admin");

            entity.HasOne(d => d.Product).WithMany(p => p.ProductApprovalLogs)
                .HasForeignKey(d => d.ProductId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_logs_product");
        });

        modelBuilder.Entity<ProductImage>(entity =>
        {
            entity.HasKey(e => e.ImageId);

            entity.ToTable("product_images");

            entity.HasIndex(e => e.ProductId, "IX_product_images_product_id");

            entity.Property(e => e.ImageId)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("image_id");
            entity.Property(e => e.ImageUrl)
                .HasMaxLength(255)
                .IsUnicode(false)
                .HasColumnName("image_url");
            entity.Property(e => e.ProductId)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("product_id");

            entity.HasOne(d => d.Product).WithMany(p => p.ProductImages)
                .HasForeignKey(d => d.ProductId)
                .HasConstraintName("FK_product_images_product");
        });

        modelBuilder.Entity<Shop>(entity =>
        {
            entity.ToTable("shops");

            entity.HasIndex(e => e.SellerId, "IX_shops_seller_id");

            entity.Property(e => e.ShopId)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("shop_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("created_at");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.Logo)
                .HasMaxLength(255)
                .IsUnicode(false)
                .HasColumnName("logo");
            entity.Property(e => e.SellerId)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("seller_id");
            entity.Property(e => e.ShopName)
                .HasMaxLength(150)
                .HasColumnName("shop_name");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasDefaultValue("ACTIVE")
                .HasColumnName("status");

            entity.HasOne(d => d.Seller).WithMany(p => p.Shops)
                .HasForeignKey(d => d.SellerId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_shops_seller");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users");

            entity.HasIndex(e => e.Email, "UQ_users_email").IsUnique();

            entity.HasIndex(e => e.Username, "UQ_users_username").IsUnique();

            entity.Property(e => e.UserId)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("user_id");
            entity.Property(e => e.Address)
                .HasMaxLength(255)
                .HasColumnName("address");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("created_at");
            entity.Property(e => e.Email)
                .HasMaxLength(100)
                .IsUnicode(false)
                .HasColumnName("email");
            entity.Property(e => e.FullName)
                .HasMaxLength(100)
                .HasColumnName("full_name");
            entity.Property(e => e.PasswordHash)
                .HasMaxLength(255)
                .IsUnicode(false)
                .HasColumnName("password_hash");
            entity.Property(e => e.Phone)
                .HasMaxLength(15)
                .IsUnicode(false)
                .HasColumnName("phone");
            entity.Property(e => e.Role)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("role");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasDefaultValue("PENDING")
                .HasColumnName("status");
            entity.Property(e => e.Username)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("username");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
