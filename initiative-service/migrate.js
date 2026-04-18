const db = require('./db');

const runMigration = async () => {
  try {
    console.log("Starting database migration...");

    // 1. Create Projects table
    await db.query(`
      CREATE TABLE IF NOT EXISTS projects (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          department VARCHAR(50) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Projects table ready.");

    // 2. Create Project Members table
    await db.query(`
      CREATE TABLE IF NOT EXISTS project_members (
          project_id INT REFERENCES projects(id) ON DELETE CASCADE,
          user_id INT REFERENCES users(id) ON DELETE CASCADE,
          PRIMARY KEY (project_id, user_id)
      );
    `);
    console.log("✅ Project Members table ready.");

    // 3. Update Initiatives table
    await db.query(`
      ALTER TABLE initiatives 
      ADD COLUMN IF NOT EXISTS project_id INT REFERENCES projects(id) ON DELETE CASCADE;
    `);
    console.log("✅ Initiatives table updated with project_id.");

    console.log("🚀 Migration complete!");
    process.exit(0);

  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
};

runMigration();