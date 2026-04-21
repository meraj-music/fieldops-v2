const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// 1. GET Initiatives (Filtered by RBAC & Projects)
app.get('/api/initiatives', async (req, res) => {
    try {
        const { department, board_type, user_id, project_id } = req.query;
        let query = 'SELECT * FROM initiatives WHERE department = $1';
        const params = [department];

        // If a specific Project is selected, ONLY show tasks for that project
        if (project_id) {
            query += ` AND project_id = $${params.push(project_id)}`;
        } 
        // Otherwise, it's a general board (Team, Goals, Personal). Make sure to exclude project tasks!
        else {
            query += ` AND project_id IS NULL AND board_type = $${params.push(board_type)}`;
            if (user_id) {
                query += ` AND owner_id = $${params.push(user_id)}`;
            }
        }
        
        query += ' ORDER BY created_at DESC';
        const initiatives = await db.query(query, params);
        res.json(initiatives.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

// 2. POST a New Initiative
app.post('/api/initiatives', async (req, res) => {
    try {
        const { 
            title, description, status, department, board_type, 
            owner_id, due_date, project_id, next_action, 
            last_update, supervising_name, owner_name 
        } = req.body;
        
        const newInitiative = await db.query(
            `INSERT INTO initiatives 
            (title, description, status, department, board_type, owner_id, 
             due_date, project_id, next_action, last_update, supervising_name, owner_name) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
            RETURNING *`,
            [
                title, description, status, department, board_type, owner_id, 
                due_date || null, project_id || null, next_action, 
                last_update, supervising_name, owner_name
            ]
        );
        res.status(201).json(newInitiative.rows[0]);
    } catch (err) {
        console.error("POST Error:", err.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

// 3. PUT (Update) an existing Initiative
app.put('/api/initiatives/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            title, description, status, due_date, next_action, 
            last_update, supervising_name, owner_name 
        } = req.body;
        
        const updateQuery = `
            UPDATE initiatives 
            SET title = $1, 
                description = $2, 
                status = $3, 
                due_date = $4, 
                next_action = $5, 
                last_update = $6, 
                supervising_name = $7, 
                owner_name = $8
            WHERE id = $9 RETURNING *
        `;
        
        const updated = await db.query(updateQuery, [
            title, description, status, due_date || null, 
            next_action, last_update, supervising_name, owner_name, id
        ]);
        
        if (updated.rows.length === 0) return res.status(404).json({ error: "Task not found" });
        res.json(updated.rows[0]);
    } catch (err) {
        console.error("PUT Error:", err.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

// 4. PATCH (Quick Status Update)
app.patch('/api/initiatives/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const updated = await db.query(
            `UPDATE initiatives SET status = $1 WHERE id = $2 RETURNING *`,
            [status, id]
        );
        res.json(updated.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server Error updating status' });
    }
});

// 5. DELETE (Cleanup: Oldest Cancelled Initiative)
app.delete('/api/initiatives/cleanup/cancelled', async (req, res) => {
    try {
        // Finds the oldest cancelled initiative and deletes it in one query
        const result = await db.query(`
            DELETE FROM initiatives 
            WHERE id = (
                SELECT id FROM initiatives 
                WHERE status = 'Cancelled' 
                ORDER BY created_at ASC 
                LIMIT 1
            ) RETURNING *
        `);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No cancelled initiatives found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server Error deleting old initiative' });
    }
});

// 6. GET all Users (For the RACI Dropdowns)
app.get('/api/users', async (req, res) => {
    try {
        const users = await db.query('SELECT id, username, department, role FROM users ORDER BY username ASC');
        res.json(users.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server Error fetching users' });
    }
});

// 7. GET & POST Comments
app.get('/api/initiatives/:id/comments', async (req, res) => {
    try {
        const { id } = req.params;
        const comments = await db.query(`
            SELECT c.*, u.username 
            FROM comments c 
            JOIN users u ON c.user_id = u.id 
            WHERE initiative_id = $1 
            ORDER BY c.created_at DESC
        `, [id]);
        res.json(comments.rows);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching comments' });
    }
});

app.post('/api/initiatives/:id/comments', async (req, res) => {
    try {
        const { id } = req.params;
        const { user_id, content } = req.body;
        const newComment = await db.query(`
            INSERT INTO comments (initiative_id, user_id, content) 
            VALUES ($1, $2, $3) RETURNING *
        `, [id, user_id, content]);
        res.status(201).json(newComment.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Error posting comment' });
    }
});

// 8. GET, POST, & DELETE Resources
app.get('/api/initiatives/:id/resources', async (req, res) => {
    try {
        const { id } = req.params;
        const resources = await db.query('SELECT * FROM resources WHERE initiative_id = $1 ORDER BY created_at DESC', [id]);
        res.json(resources.rows);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching resources' });
    }
});

app.post('/api/initiatives/:id/resources', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, url } = req.body;
        const newResource = await db.query(`
            INSERT INTO resources (initiative_id, title, url) 
            VALUES ($1, $2, $3) RETURNING *
        `, [id, title, url]);
        res.status(201).json(newResource.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Error posting resource' });
    }
});

app.delete('/api/resources/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM resources WHERE id = $1', [id]);
        res.json({ message: 'Resource deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Error deleting resource' });
    }


});

// =========================================================================
// PHASE 3 ROUTES: PROJECTS & RBAC
// =========================================================================

// GET Projects based on RBAC
app.get('/api/projects', async (req, res) => {
    try {
        const { user_id, role, department } = req.query;
        let query;
        let params;

        if (role.toLowerCase().includes('manager')) {
            // Managers see all projects in their department
            query = `SELECT * FROM projects WHERE department = $1 ORDER BY created_at DESC`;
            params = [department];
        } else {
            // Members only see projects they are explicitly added to
            query = `
                SELECT p.* FROM projects p
                JOIN project_members pm ON p.id = pm.project_id
                WHERE pm.user_id = $1
                ORDER BY p.created_at DESC
            `;
            params = [user_id];
        }

        const projects = await db.query(query, params);
        res.json(projects.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server Error fetching projects' });
    }
});

// POST a new Project
app.post('/api/projects', async (req, res) => {
    try {
        const { name, department, members } = req.body;
        
        // 1. Create the project
        const projectResult = await db.query(
            `INSERT INTO projects (name, department) VALUES ($1, $2) RETURNING *`,
            [name, department]
        );
        const newProject = projectResult.rows[0];

        // 2. Add members to the project_members table
        if (members && members.length > 0) {
            const memberValues = members.map(userId => `(${newProject.id}, ${userId})`).join(',');
            await db.query(`INSERT INTO project_members (project_id, user_id) VALUES ${memberValues}`);
        }

        res.status(201).json(newProject);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server Error creating project' });
    }
});



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Initiative Service running on port ${PORT}`));