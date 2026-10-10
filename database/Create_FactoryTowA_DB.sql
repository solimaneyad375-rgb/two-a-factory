/* FactoryTowA_DB - SQL Server default instance, Windows Authentication */
IF DB_ID(N'FactoryTowA_DB') IS NULL
    CREATE DATABASE [FactoryTowA_DB];
GO
USE [FactoryTowA_DB];
GO
IF OBJECT_ID(N'dbo.ResourceDocuments', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ResourceDocuments
    (
        ResourceName nvarchar(50) NOT NULL CONSTRAINT PK_ResourceDocuments PRIMARY KEY,
        JsonData nvarchar(max) NOT NULL,
        CreatedAt datetime2(0) NOT NULL CONSTRAINT DF_ResourceDocuments_CreatedAt DEFAULT SYSUTCDATETIME(),
        UpdatedAt datetime2(0) NOT NULL CONSTRAINT DF_ResourceDocuments_UpdatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT CK_ResourceDocuments_JsonData CHECK (ISJSON(JsonData) = 1)
    );
END;
GO
/* Seed safe initial documents. The API inserts browser defaults on first connection if missing. */
SELECT ResourceName, UpdatedAt FROM dbo.ResourceDocuments ORDER BY ResourceName;
GO
