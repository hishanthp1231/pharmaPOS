const db = require('../db');

const getAllTemplates = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM notification_templates ORDER BY created_at DESC');
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch templates' });
    }
};

const getTemplateById = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM notification_templates WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Template not found' });
        }
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch template' });
    }
};

const createTemplate = async (req, res) => {
    const { name, type, trigger_event, template_text, is_active } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO notification_templates (name, type, trigger_event, template_text, is_active) VALUES (?, ?, ?, ?, ?)',
            [name, type, trigger_event, template_text, is_active ?? true]
        );
        res.json({ success: true, id: result.insertId });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to create template' });
    }
};

const updateTemplate = async (req, res) => {
    const { name, type, trigger_event, template_text, is_active } = req.body;
    try {
        await db.query(
            'UPDATE notification_templates SET name = ?, type = ?, trigger_event = ?, template_text = ?, is_active = ? WHERE id = ?',
            [name, type, trigger_event, template_text, is_active, req.params.id]
        );
        res.json({ success: true, message: 'Template updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to update template' });
    }
};

const deleteTemplate = async (req, res) => {
    try {
        await db.query('DELETE FROM notification_templates WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Template deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to delete template' });
    }
};

module.exports = {
    getAllTemplates,
    getTemplateById,
    createTemplate,
    updateTemplate,
    deleteTemplate
};
