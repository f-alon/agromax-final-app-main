// routes/rodeos.js
const express = require('express');
const { runQuery, runSingle, runExecute } = require('../config/database');
const { authenticateToken } = require('./auth');
const router = express.Router();

// Middleware to get user's establishment
const getUserEstablishment = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    
    // Get user's establishment
    const result = await runSingle(
      `SELECT ue.establishment_id, e.name as establishment_name 
       FROM user_establishments ue 
       JOIN establishments e ON ue.establishment_id = e.id 
       WHERE ue.user_id = ? AND ue.is_active = 1`,
      [userId]
    );
    
    if (!result) {
      return res.status(403).json({ error: 'User not associated with any establishment' });
    }
    
    req.establishmentId = result.establishment_id;
    req.establishmentName = result.establishment_name;
    next();
  } catch (error) {
    console.error('Error getting user establishment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all rodeos for user's establishment
router.get('/', authenticateToken, getUserEstablishment, async (req, res) => {
  try {
    const establishmentId = req.establishmentId;

    const rodeos = await runQuery(
      `SELECT r.*, 
              COUNT(a.id) as animal_count,
              (SELECT COUNT(*) FROM animal_alerts aa 
               JOIN animals a2 ON aa.animal_id = a2.id 
               WHERE a2.current_rodeo_id = r.id AND aa.is_active = 1) as active_alerts
       FROM rodeos r
       LEFT JOIN animals a ON r.id = a.current_rodeo_id AND a.is_active = 1
       WHERE r.establishment_id = ? AND r.is_active = 1
       GROUP BY r.id
       ORDER BY r.name`,
      [establishmentId]
    );

    res.json({ rodeos });

  } catch (error) {
    console.error('Get rodeos error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get rodeo by ID with animals
router.get('/:id', authenticateToken, getUserEstablishment, async (req, res) => {
  try {
    const { id } = req.params;
    const establishmentId = req.establishmentId;

    // Get rodeo info
    const rodeo = await runSingle(
      'SELECT * FROM rodeos WHERE id = ? AND establishment_id = ? AND is_active = 1',
      [id, establishmentId]
    );

    if (!rodeo) {
      return res.status(404).json({ error: 'Rodeo not found' });
    }

    // Get animals in this rodeo
    const animals = await runQuery(
      `SELECT a.id, a.senasa_caravan, a.internal_caravan, a.name, a.birth_date, a.breed,
              (SELECT COUNT(*) FROM animal_alerts aa WHERE aa.animal_id = a.id AND aa.is_active = 1) as active_alerts
       FROM animals a
       WHERE a.current_rodeo_id = ? AND a.establishment_id = ? AND a.is_active = 1
       ORDER BY a.senasa_caravan, a.internal_caravan, a.name`,
      [id, establishmentId]
    );

    res.json({ rodeo, animals });

  } catch (error) {
    console.error('Get rodeo error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new rodeo
router.post('/', authenticateToken, getUserEstablishment, async (req, res) => {
  try {
    const { name, description } = req.body;
    const establishmentId = req.establishmentId;
    const userId = req.user.userId;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'Rodeo name is required' });
    }

    // Check if rodeo name already exists in this establishment
    const existingRodeo = await runSingle(
      'SELECT id FROM rodeos WHERE name = ? AND establishment_id = ? AND is_active = 1',
      [name, establishmentId]
    );

    if (existingRodeo) {
      return res.status(409).json({ error: 'Rodeo name already exists in this establishment' });
    }

    // Create rodeo
    const result = await runExecute(
      'INSERT INTO rodeos (name, description, establishment_id) VALUES (?, ?, ?)',
      [name, description, establishmentId]
    );

    const rodeo = {
      id: result.id,
      name,
      description,
      establishment_id: establishmentId,
      is_active: 1,
      created_at: new Date().toISOString()
    };

    // Log activity
    await runExecute(
      'INSERT INTO activity_log (establishment_id, user_id, activity_type, description, entity_type, entity_id, metadata) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        establishmentId, userId, 'rodeo_created',
        `Rodeo created: ${rodeo.name}`,
        'rodeo', rodeo.id, JSON.stringify({ name: rodeo.name })
      ]
    );

    res.status(201).json({
      message: 'Rodeo created successfully',
      rodeo
    });

  } catch (error) {
    console.error('Create rodeo error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update rodeo
router.put('/:id', authenticateToken, getUserEstablishment, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const establishmentId = req.establishmentId;
    const userId = req.user.userId;

    // Check if rodeo exists and belongs to user's establishment
    const existingRodeo = await runSingle(
      'SELECT * FROM rodeos WHERE id = ? AND establishment_id = ? AND is_active = 1',
      [id, establishmentId]
    );

    if (!existingRodeo) {
      return res.status(404).json({ error: 'Rodeo not found' });
    }

    // Check if new name already exists in this establishment (if name is being changed)
    if (name && name !== existingRodeo.name) {
      const nameExists = await runSingle(
        'SELECT id FROM rodeos WHERE name = ? AND establishment_id = ? AND is_active = 1 AND id != ?',
        [name, establishmentId, id]
      );

      if (nameExists) {
        return res.status(409).json({ error: 'Rodeo name already exists in this establishment' });
      }
    }

    // Update rodeo
    await runExecute(
      'UPDATE rodeos SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND establishment_id = ?',
      [name, description, id, establishmentId]
    );

    const rodeo = {
      id: parseInt(id),
      name,
      description,
      establishment_id: establishmentId,
      is_active: 1
    };

    // Log activity
    await runExecute(
      'INSERT INTO activity_log (establishment_id, user_id, activity_type, description, entity_type, entity_id, metadata) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        establishmentId, userId, 'rodeo_updated',
        `Rodeo updated: ${rodeo.name}`,
        'rodeo', rodeo.id, JSON.stringify({ name: rodeo.name })
      ]
    );

    res.json({
      message: 'Rodeo updated successfully',
      rodeo
    });

  } catch (error) {
    console.error('Update rodeo error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete rodeo (soft delete)
router.delete('/:id', authenticateToken, getUserEstablishment, async (req, res) => {
  try {
    const { id } = req.params;
    const establishmentId = req.establishmentId;
    const userId = req.user.userId;

    // Check if rodeo exists and belongs to user's establishment
    const existingRodeo = await runSingle(
      'SELECT * FROM rodeos WHERE id = ? AND establishment_id = ? AND is_active = 1',
      [id, establishmentId]
    );

    if (!existingRodeo) {
      return res.status(404).json({ error: 'Rodeo not found' });
    }

    // Check if rodeo has animals
    const animalsInRodeo = await runSingle(
      'SELECT COUNT(*) as count FROM animals WHERE current_rodeo_id = ? AND is_active = 1',
      [id]
    );

    if (animalsInRodeo.count > 0) {
      return res.status(400).json({ error: 'Cannot delete rodeo with animals. Move animals to another rodeo first.' });
    }

    // Soft delete rodeo
    await runExecute(
      'UPDATE rodeos SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND establishment_id = ?',
      [id, establishmentId]
    );

    // Log activity
    await runExecute(
      'INSERT INTO activity_log (establishment_id, user_id, activity_type, description, entity_type, entity_id, metadata) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        establishmentId, userId, 'rodeo_deleted',
        `Rodeo deleted: ${existingRodeo.name}`,
        'rodeo', id, JSON.stringify({ name: existingRodeo.name })
      ]
    );

    res.json({ message: 'Rodeo deleted successfully' });

  } catch (error) {
    console.error('Delete rodeo error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Move multiple animals between rodeos
router.post('/move-animals', authenticateToken, getUserEstablishment, async (req, res) => {
  try {
    const { animal_ids, to_rodeo_id, reason } = req.body;
    const establishmentId = req.establishmentId;
    const userId = req.user.userId;

    if (!animal_ids || !Array.isArray(animal_ids) || animal_ids.length === 0) {
      return res.status(400).json({ error: 'Animal IDs array is required' });
    }

    if (!to_rodeo_id) {
      return res.status(400).json({ error: 'Target rodeo ID is required' });
    }

    // Check if target rodeo exists and belongs to the same establishment
    const rodeo = await runSingle(
      'SELECT * FROM rodeos WHERE id = ? AND establishment_id = ? AND is_active = 1',
      [to_rodeo_id, establishmentId]
    );

    if (!rodeo) {
      return res.status(404).json({ error: 'Target rodeo not found' });
    }

    // Move each animal
    const movedAnimals = [];
    for (const animalId of animal_ids) {
      // Check if animal exists and belongs to user's establishment
      const animal = await runSingle(
        'SELECT * FROM animals WHERE id = ? AND establishment_id = ? AND is_active = 1',
        [animalId, establishmentId]
      );

      if (animal) {
        const from_rodeo_id = animal.current_rodeo_id;
        
        // Update animal's current rodeo
        await runExecute(
          'UPDATE animals SET current_rodeo_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [to_rodeo_id, animalId]
        );
        
        // Log the movement
        await runExecute(
          'INSERT INTO animal_movements (animal_id, from_rodeo_id, to_rodeo_id, reason, created_by) VALUES (?, ?, ?, ?, ?)',
          [animalId, from_rodeo_id, to_rodeo_id, reason, userId]
        );
        
        movedAnimals.push(animal);
      }
    }

    // Log bulk activity
    await runExecute(
      'INSERT INTO activity_log (establishment_id, user_id, activity_type, description, entity_type, entity_id, metadata) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        establishmentId, userId, 'bulk_animal_movement',
        `${movedAnimals.length} animals moved to rodeo: ${rodeo.name}`,
        'rodeo', to_rodeo_id, JSON.stringify({ 
          animal_count: movedAnimals.length, 
          reason: reason,
          animal_ids: animal_ids 
        })
      ]
    );

    res.json({
      message: `${movedAnimals.length} animals moved successfully`,
      movedAnimals: movedAnimals.length,
      targetRodeo: rodeo.name
    });

  } catch (error) {
    console.error('Move animals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;