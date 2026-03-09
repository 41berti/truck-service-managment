require("dotenv").config();

const bcrypt = require("bcrypt");
const pool = require("../db/pool");

console.log("Starting seedUsers.js...");

const users = [
  {
    full_name: "Dev Admin",
    email: "admin@test.local",
    password: "test1234", // changed the password for the 3 test users to one that is simple to remember.
    role: "ADMIN",
    is_active: true,
  },
  {
    full_name: "Test Mechanic",
    email: "mechanic@test.local",
    password: "test1234",
    role: "MECHANIC",
    is_active: true,
  },
  {
    full_name: "Test Guard",
    email: "guard@test.local",
    password: "test1234",
    role: "GUARD",
    is_active: true,
  },
];

async function seedUsers() {
  try {
    for (const user of users) {
      console.log(`Seeding user: ${user.email}`);

      const passwordHash = await bcrypt.hash(user.password, 10);

      const query = `
        INSERT INTO users (full_name, email, password_hash, role, is_active)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (email)
        DO UPDATE SET
          full_name = EXCLUDED.full_name,
          password_hash = EXCLUDED.password_hash,
          role = EXCLUDED.role,
          is_active = EXCLUDED.is_active
        RETURNING id, full_name, email, role, is_active
      `;

      const values = [
        user.full_name,
        user.email,
        passwordHash,
        user.role,
        user.is_active,
      ];

      const result = await pool.query(query, values);
      console.log("Seeded successfully:", result.rows[0]);
    }

    console.log("User seeding complete.");
  } catch (error) {
    console.error("Seeding failed:", error);
  } finally {
    await pool.end();
    console.log("Database pool closed.");
  }
}

seedUsers();