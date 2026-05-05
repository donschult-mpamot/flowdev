import bcrypt from "bcryptjs";
import { prisma } from "../src/index.js";

const BCRYPT_COST = 12;

async function main(): Promise<void> {
  const email = process.env.DEV_ADMIN_EMAIL;
  const password = process.env.DEV_ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn(
      "[seed] DEV_ADMIN_EMAIL and/or DEV_ADMIN_PASSWORD not set — skipping admin seed.",
    );
    return;
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name: "Dev Admin",
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
    },
    update: {
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  console.log(`[seed] upserted dev admin user: ${user.email} (id=${user.id})`);
}

main()
  .catch((err) => {
    console.error("[seed] failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
