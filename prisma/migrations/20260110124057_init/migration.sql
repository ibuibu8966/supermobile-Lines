-- CreateEnum
CREATE TYPE "SimStatus" AS ENUM ('IN_STOCK', 'ACTIVE', 'RETURNING', 'RETIRED');

-- CreateTable
CREATE TABLE "Sim" (
    "iccid" VARCHAR(20) NOT NULL,
    "msisdn" VARCHAR(20),
    "supplier" VARCHAR(50) NOT NULL,
    "ownerCompany" VARCHAR(100),
    "plan" VARCHAR(100),
    "customerType" VARCHAR(50),
    "supplierServiceStartDate" TIMESTAMP(3),
    "supplierServiceEndDate" TIMESTAMP(3),
    "currentServiceName" VARCHAR(50),
    "currentCustomerId" VARCHAR(100),
    "currentContractStartDate" TIMESTAMP(3),
    "currentContractEndDate" TIMESTAMP(3),
    "status" "SimStatus" NOT NULL DEFAULT 'IN_STOCK',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sim_pkey" PRIMARY KEY ("iccid")
);

-- CreateTable
CREATE TABLE "SimHistory" (
    "id" TEXT NOT NULL,
    "iccid" VARCHAR(20) NOT NULL,
    "serviceName" VARCHAR(50) NOT NULL,
    "customerId" VARCHAR(100),
    "contractStartDate" TIMESTAMP(3),
    "contractEndDate" TIMESTAMP(3),
    "shippedDate" TIMESTAMP(3),
    "arrivedDate" TIMESTAMP(3),
    "returnedDate" TIMESTAMP(3),
    "usageTagId" INTEGER,
    "msisdnSnapshot" VARCHAR(20),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SimHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceSource" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "displayName" VARCHAR(100) NOT NULL,
    "supabaseUrl" VARCHAR(255) NOT NULL,
    "serviceRoleKey" TEXT NOT NULL,
    "tableName" VARCHAR(100) NOT NULL,
    "columnMappings" JSONB NOT NULL DEFAULT '{"iccid": "iccid", "customerId": "customer_id", "contractStartDate": "start_date", "contractEndDate": "end_date"}',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP(3),
    "lastSyncStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageTag" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UsageTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageRule" (
    "id" SERIAL NOT NULL,
    "usageTagId" INTEGER NOT NULL,
    "supplierFilter" VARCHAR(50),
    "planFilter" VARCHAR(100),
    "minContractDays" INTEGER NOT NULL DEFAULT 0,
    "conditions" JSONB NOT NULL DEFAULT '{}',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UsageRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncLog" (
    "id" TEXT NOT NULL,
    "serviceName" VARCHAR(50),
    "operation" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "recordsAffected" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Sim_status_idx" ON "Sim"("status");

-- CreateIndex
CREATE INDEX "Sim_supplier_idx" ON "Sim"("supplier");

-- CreateIndex
CREATE INDEX "Sim_currentServiceName_idx" ON "Sim"("currentServiceName");

-- CreateIndex
CREATE INDEX "Sim_msisdn_idx" ON "Sim"("msisdn");

-- CreateIndex
CREATE INDEX "SimHistory_iccid_idx" ON "SimHistory"("iccid");

-- CreateIndex
CREATE INDEX "SimHistory_serviceName_idx" ON "SimHistory"("serviceName");

-- CreateIndex
CREATE INDEX "SimHistory_customerId_idx" ON "SimHistory"("customerId");

-- CreateIndex
CREATE INDEX "SimHistory_usageTagId_idx" ON "SimHistory"("usageTagId");

-- CreateIndex
CREATE INDEX "SimHistory_contractStartDate_contractEndDate_idx" ON "SimHistory"("contractStartDate", "contractEndDate");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceSource_name_key" ON "ServiceSource"("name");

-- CreateIndex
CREATE INDEX "ServiceSource_enabled_idx" ON "ServiceSource"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "UsageTag_name_key" ON "UsageTag"("name");

-- CreateIndex
CREATE INDEX "UsageRule_usageTagId_idx" ON "UsageRule"("usageTagId");

-- CreateIndex
CREATE INDEX "UsageRule_priority_idx" ON "UsageRule"("priority");

-- CreateIndex
CREATE INDEX "SyncLog_serviceName_idx" ON "SyncLog"("serviceName");

-- CreateIndex
CREATE INDEX "SyncLog_operation_idx" ON "SyncLog"("operation");

-- CreateIndex
CREATE INDEX "SyncLog_createdAt_idx" ON "SyncLog"("createdAt");

-- AddForeignKey
ALTER TABLE "SimHistory" ADD CONSTRAINT "SimHistory_iccid_fkey" FOREIGN KEY ("iccid") REFERENCES "Sim"("iccid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimHistory" ADD CONSTRAINT "SimHistory_usageTagId_fkey" FOREIGN KEY ("usageTagId") REFERENCES "UsageTag"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageRule" ADD CONSTRAINT "UsageRule_usageTagId_fkey" FOREIGN KEY ("usageTagId") REFERENCES "UsageTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
