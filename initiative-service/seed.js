const db = require('./db');

const runSeed = async () => {
  try {
    console.log("🌱 Starting Force Database Reset & Seed...");

    // 1. Drop existing tables to ensure a clean slate with the correct columns
    await db.query(`
      DROP TABLE IF EXISTS comments CASCADE;
      DROP TABLE IF EXISTS resources CASCADE;
      DROP TABLE IF EXISTS initiatives CASCADE;
      DROP TABLE IF EXISTS project_members CASCADE;
      DROP TABLE IF EXISTS projects CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);
    console.log("🗑️ Old tables cleared.");

    // 2. Build tables with correct columns
    await db.query(`
      CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          department VARCHAR(50) NOT NULL,
          role VARCHAR(50) NOT NULL,
          password VARCHAR(255) NOT NULL
      );

      CREATE TABLE projects (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          department VARCHAR(50) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE project_members (
          project_id INT REFERENCES projects(id) ON DELETE CASCADE,
          user_id INT REFERENCES users(id) ON DELETE CASCADE,
          PRIMARY KEY (project_id, user_id)
      );

      CREATE TABLE initiatives (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          status VARCHAR(50) DEFAULT 'Ideation',
          due_date DATE,
          next_action TEXT,
          last_update TEXT, /* <--- ADDED THE MISSING COLUMN HERE */
          supervising_name VARCHAR(100),
          owner_name VARCHAR(100),
          owner_id INT REFERENCES users(id),
          raci_consulted_informed TEXT[],
          department VARCHAR(50),
          board_type VARCHAR(50),
          project_id INT REFERENCES projects(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE comments (
          id SERIAL PRIMARY KEY,
          initiative_id INT REFERENCES initiatives(id) ON DELETE CASCADE,
          user_id INT REFERENCES users(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE resources (
          id SERIAL PRIMARY KEY,
          initiative_id INT REFERENCES initiatives(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          url TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Tables recreated with correct columns.");

    // 3. Insert the Dummy Users
    const dummyUsers = [
      ['CSManager1', 'CS', 'Manager', '12345678'],
      ['CSManager2', 'CS', 'Manager', '12345678'],
      ['CSMember1', 'CS', 'Member', '12345678'],
      ['CSMember2', 'CS', 'Member', '12345678'],
      ['MKTmanager1', 'Marketing', 'Manager', '12345678'],
      ['MKTmanager2', 'Marketing', 'Manager', '12345678'],
      ['MKTmember1', 'Marketing', 'Member', '12345678'],
      ['MKTmember2', 'Marketing', 'Member', '12345678']
    ];

    for (const user of dummyUsers) {
      await db.query(`
        INSERT INTO users (username, department, role, password) 
        VALUES ($1, $2, $3, $4)
      `, user);
    }
    console.log("✅ 8 Dummy Users seeded.");

    console.log("🚀 Seeding Complete!");
    process.exit(0);

  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

runSeed();