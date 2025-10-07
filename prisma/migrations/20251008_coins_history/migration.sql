CREATE TABLE IF NOT EXISTS "CoinTransaction" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "adminId" INTEGER,
  "delta" INTEGER NOT NULL,
  "reason" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "CoinTransaction_user_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "CoinTransaction_admin_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "CoinTransaction_user_created_idx" ON "CoinTransaction"("userId","createdAt");
