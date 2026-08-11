USE WEB_TMDT;
GO

-- 1. Tạo bảng user_blocks
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[user_blocks]') AND type in (N'U'))
BEGIN
    CREATE TABLE user_blocks (
        block_id        VARCHAR(20)     NOT NULL,
        user_id         VARCHAR(20)     NOT NULL,
        reason          NVARCHAR(MAX)   NOT NULL,
        [status]        VARCHAR(20)     NOT NULL DEFAULT 'ACTIVE',
        created_at      DATETIME        NOT NULL DEFAULT GETDATE(),

        CONSTRAINT PK_user_blocks PRIMARY KEY (block_id),
        CONSTRAINT FK_user_blocks_user FOREIGN KEY (user_id) REFERENCES users(user_id),
        CONSTRAINT CK_user_blocks_status CHECK (status IN ('ACTIVE','RESOLVED'))
    );
    CREATE INDEX IX_user_blocks_user_id ON user_blocks(user_id);
END
GO

-- 2. Tạo bảng appeals
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[appeals]') AND type in (N'U'))
BEGIN
    CREATE TABLE appeals (
        appeal_id       VARCHAR(20)     NOT NULL,
        block_id        VARCHAR(20)     NOT NULL,
        title           NVARCHAR(255)   NOT NULL,
        content         NVARCHAR(MAX)   NOT NULL,
        [status]        VARCHAR(20)     NOT NULL DEFAULT 'PENDING',
        created_at      DATETIME        NOT NULL DEFAULT GETDATE(),
        resolved_at     DATETIME        NULL,
        resolved_by     VARCHAR(20)     NULL,
        admin_note      NVARCHAR(MAX)   NULL,

        CONSTRAINT PK_appeals PRIMARY KEY (appeal_id),
        CONSTRAINT FK_appeals_block FOREIGN KEY (block_id) REFERENCES user_blocks(block_id),
        CONSTRAINT FK_appeals_admin FOREIGN KEY (resolved_by) REFERENCES users(user_id),
        CONSTRAINT CK_appeals_status CHECK (status IN ('PENDING','APPROVED','REJECTED'))
    );
    CREATE INDEX IX_appeals_block_id ON appeals(block_id);
END
GO

-- 3. Chèn tài khoản demo Nguyễn Đắc Trãi bị khóa để kiểm thử
IF NOT EXISTS (SELECT 1 FROM users WHERE username = 'NguyenDTRAI')
BEGIN
    INSERT INTO users (user_id, username, password_hash, full_name, email, phone, address, role, status, created_at)
    VALUES (
        'CUSNGUYENDTRAI',
        'NguyenDTRAI',
        '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', -- SHA256 của '123456'
        N'Nguyễn Đắc Trãi',
        'lamnguyenkietco@gmail.com',
        '0987654321',
        N'Hồ Chí Minh',
        'CUSTOMER',
        'BLOCKED',
        GETDATE()
    );
END

-- 4. Chèn hồ sơ khóa cho NguyenDTRAI
IF NOT EXISTS (SELECT 1 FROM user_blocks WHERE block_id = 'BLK-982410')
BEGIN
    INSERT INTO user_blocks (block_id, user_id, reason, status, created_at)
    VALUES (
        'BLK-982410',
        'CUSNGUYENDTRAI',
        N'Vi phạm điều khoản đăng bán sản phẩm / Hoạt động có rủi ro bảo mật',
        'ACTIVE',
        GETDATE()
    );
END
GO
