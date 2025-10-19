// routes/animals.js
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
       WHERE ue.user_id = $1 AND ue.is_active = TRUE`,
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

// Get all animals for user's establishment
router.get('/', authenticateToken, getUserEstablishment, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', rodeo_id = '' } = req.query;
    const offset = (page - 1) * limit;
    const establishmentId = req.establishmentId;

    let query = `
      SELECT a.id, a.senasa_caravan, a.internal_caravan, a.name, a.birth_date, 
             a.breed, a.entry_date, a.observations, a.current_rodeo_id,
             r.name as rodeo_name, a.created_at,
             (SELECT COUNT(*) FROM animal_alerts aa WHERE aa.animal_id = a.id AND aa.is_active = TRUE) as active_alerts
      FROM animals a
      LEFT JOIN rodeos r ON a.current_rodeo_id = r.id
      WHERE a.establishment_id = $1 AND a.is_active = TRUE
    `;

    const queryParams = [establishmentId];
    const addParam = (value) => {
      queryParams.push(value);
      return `$${queryParams.length}`;
    };

    if (search) {
      const likeValue = `%${search}%`;
      const senasa = addParam(likeValue);
      const internal = addParam(likeValue);
      const nameParam = addParam(likeValue);
      query += ` AND (a.senasa_caravan ILIKE ${senasa} OR a.internal_caravan ILIKE ${internal} OR a.name ILIKE ${nameParam})`;
    }

    if (rodeo_id) {
      const rodeoPlaceholder = addParam(rodeo_id);
      query += ` AND a.current_rodeo_id = ${rodeoPlaceholder}`;
    }

    const limitPlaceholder = addParam(parseInt(limit, 10));
    const offsetPlaceholder = addParam(offset);
    query += ` ORDER BY a.created_at DESC LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}`;

    const animals = await runQuery(query, queryParams);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as count FROM animals a WHERE a.establishment_id = $1 AND a.is_active = TRUE';
    const countParams = [establishmentId];
    const addCountParam = (value) => {
      countParams.push(value);
      return `$${countParams.length}`;
    };

    if (search) {
      const likeValue = `%${search}%`;
      const senasa = addCountParam(likeValue);
      const internal = addCountParam(likeValue);
      const nameParam = addCountParam(likeValue);
      countQuery += ` AND (a.senasa_caravan ILIKE ${senasa} OR a.internal_caravan ILIKE ${internal} OR a.name ILIKE ${nameParam})`;
    }

    if (rodeo_id) {
      const rodeoPlaceholder = addCountParam(rodeo_id);
      countQuery += ` AND a.current_rodeo_id = ${rodeoPlaceholder}`;
    }

    const countResult = await runSingle(countQuery, countParams);
    const totalAnimals = Number(countResult?.count ?? 0);

    res.json({
      animals,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalAnimals,
        pages: Math.ceil(totalAnimals / limit)
      }
    });

  } catch (error) {
    console.error('Get animals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get animal by ID
router.get('/:id', authenticateToken, getUserEstablishment, async (req, res) => {
  try {
    const { id } = req.params;
    const establishmentId = req.establishmentId;

    const animal = await runSingle(
      `SELECT a.*, r.name as rodeo_name, 
              m.name as mother_name, m.senasa_caravan as mother_senasa_caravan
       FROM animals a
       LEFT JOIN rodeos r ON a.current_rodeo_id = r.id
       LEFT JOIN animals m ON a.mother_id = m.id
       WHERE a.id = $1 AND a.establishment_id = $2 AND a.is_active = TRUE`,
      [id, establishmentId]
    );

    if (!animal) {
      return res.status(404).json({ error: 'Animal not found' });
    }

    // Get production records
    const productionRecords = await runQuery(
      'SELECT * FROM animal_production_records WHERE animal_id = $1 ORDER BY record_date DESC',
      [id]
    );

    // Get health records
    const healthRecords = await runQuery(
      'SELECT * FROM animal_health_records WHERE animal_id = $1 ORDER BY record_date DESC',
      [id]
    );

    // Get reproduction records
    const reproductionRecords = await runQuery(
      'SELECT * FROM animal_reproduction_records WHERE animal_id = $1 ORDER BY record_date DESC',
      [id]
    );

    // Get movement history
    const movements = await runQuery(
      `SELECT am.*, r1.name as from_rodeo_name, r2.name as to_rodeo_name
       FROM animal_movements am
       LEFT JOIN rodeos r1 ON am.from_rodeo_id = r1.id
       LEFT JOIN rodeos r2 ON am.to_rodeo_id = r2.id
       WHERE am.animal_id = $1 ORDER BY am.movement_date DESC`,
      [id]
    );

    // Get photos
    const photos = await runQuery(
      'SELECT * FROM animal_photos WHERE animal_id = $1 ORDER BY is_primary DESC, created_at DESC',
      [id]
    );

    // Get active alerts
    const alerts = await runQuery(
      'SELECT * FROM animal_alerts WHERE animal_id = $1 AND is_active = TRUE ORDER BY alert_date DESC',
      [id]
    );

    res.json({
      animal,
      productionRecords,
      healthRecords,
      reproductionRecords,
      movements,
      photos,
      alerts
    });

  } catch (error) {
    console.error('Get animal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new animal
router.post('/', authenticateToken, getUserEstablishment, async (req, res) => {
  try {
    const {
      senasa_caravan,
      internal_caravan,
      name,
      birth_date,
      breed,
      mother_id,
      father_name,
      entry_date,
      observations,
      current_rodeo_id
    } = req.body;

    const establishmentId = req.establishmentId;
    const userId = req.user.userId;

    // Validate required fields
    if (!senasa_caravan && !internal_caravan) {
      return res.status(400).json({ error: 'At least one caravan (SENASA or internal) is required' });
    }

    // Check if SENASA caravan already exists
    if (senasa_caravan) {
      const existingSenasa = await runSingle(
        'SELECT id FROM animals WHERE senasa_caravan = $1 AND is_active = TRUE',
        [senasa_caravan]
      );
      if (existingSenasa) {
        return res.status(409).json({ error: 'SENASA caravan already exists' });
      }
    }

    // Check if internal caravan already exists in this establishment
    if (internal_caravan) {
      const existingInternal = await runSingle(
        'SELECT id FROM animals WHERE internal_caravan = $1 AND establishment_id = $2 AND is_active = TRUE',
        [internal_caravan, establishmentId]
      );
      if (existingInternal) {
        return res.status(409).json({ error: 'Internal caravan already exists in this establishment' });
      }
    }

    // Create animal
    const result = await runExecute(
      `INSERT INTO animals (
        senasa_caravan, internal_caravan, name, birth_date, breed, 
        mother_id, father_name, entry_date, observations, 
        establishment_id, current_rodeo_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
      [
        senasa_caravan, internal_caravan, name, birth_date, breed,
        mother_id, father_name, entry_date, observations,
        establishmentId, current_rodeo_id
      ]
    );

    const animal = {
      id: result.rows[0]?.id,
      senasa_caravan,
      internal_caravan,
      name,
      birth_date,
      breed,
      mother_id,
      father_name,
      entry_date,
      observations,
      establishment_id: establishmentId,
      current_rodeo_id
    };

    // Log activity
    await runExecute(
      'INSERT INTO activity_log (establishment_id, user_id, activity_type, description, entity_type, entity_id, metadata) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [
        establishmentId, userId, 'animal_created', 
        `Animal created: ${animal.senasa_caravan || animal.internal_caravan}`,
        'animal', animal.id, JSON.stringify({ name: animal.name })
      ]
    );

    res.status(201).json({
      message: 'Animal created successfully',
      animal
    });

  } catch (error) {
    console.error('Create animal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update animal
router.put('/:id', authenticateToken, getUserEstablishment, async (req, res) => {
  try {
    const { id } = req.params;
    const establishmentId = req.establishmentId;
    const userId = req.user.userId;
    const updateData = req.body;

    // Check if animal exists and belongs to user's establishment
    const existingAnimal = await runSingle(
      'SELECT * FROM animals WHERE id = $1 AND establishment_id = $2 AND is_active = TRUE',
      [id, establishmentId]
    );

    if (!existingAnimal) {
      return res.status(404).json({ error: 'Animal not found' });
    }

    // Update animal
    await runExecute(
      `UPDATE animals SET 
        senasa_caravan = $1, internal_caravan = $2, name = $3, birth_date = $4, 
        breed = $5, mother_id = $6, father_name = $7, entry_date = $8, 
        observations = $9, current_rodeo_id = $10, updated_at = CURRENT_TIMESTAMP
       WHERE id = $11 AND establishment_id = $12`,
      [
        updateData.senasa_caravan, updateData.internal_caravan, updateData.name,
        updateData.birth_date, updateData.breed, updateData.mother_id,
        updateData.father_name, updateData.entry_date, updateData.observations,
        updateData.current_rodeo_id, id, establishmentId
      ]
    );

    const animal = {
      id: parseInt(id),
      ...updateData,
      establishment_id: establishmentId
    };

    // Log activity
    await runExecute(
      'INSERT INTO activity_log (establishment_id, user_id, activity_type, description, entity_type, entity_id, metadata) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [
        establishmentId, userId, 'animal_updated',
        `Animal updated: ${animal.senasa_caravan || animal.internal_caravan}`,
        'animal', animal.id, JSON.stringify({ name: animal.name })
      ]
    );

    res.json({
      message: 'Animal updated successfully',
      animal
    });

  } catch (error) {
    console.error('Update animal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Move animal between rodeos
router.post('/:id/move', authenticateToken, getUserEstablishment, async (req, res) => {
  try {
    const { id } = req.params;
    const { to_rodeo_id, reason } = req.body;
    const establishmentId = req.establishmentId;
    const userId = req.user.userId;

    // Check if animal exists and belongs to user's establishment
    const animal = await runSingle(
      'SELECT * FROM animals WHERE id = $1 AND establishment_id = $2 AND is_active = TRUE',
      [id, establishmentId]
    );

    if (!animal) {
      return res.status(404).json({ error: 'Animal not found' });
    }

    // Check if target rodeo exists and belongs to the same establishment
    const rodeo = await runSingle(
      'SELECT * FROM rodeos WHERE id = $1 AND establishment_id = $2 AND is_active = TRUE',
      [to_rodeo_id, establishmentId]
    );

    if (!rodeo) {
      return res.status(404).json({ error: 'Target rodeo not found' });
    }

    const from_rodeo_id = animal.current_rodeo_id;

    // Update animal's current rodeo
    await runExecute(
      'UPDATE animals SET current_rodeo_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [to_rodeo_id, id]
    );
    
    // Log the movement
    await runExecute(
      'INSERT INTO animal_movements (animal_id, from_rodeo_id, to_rodeo_id, reason, created_by) VALUES ($1, $2, $3, $4, $5)',
      [id, from_rodeo_id, to_rodeo_id, reason, userId]
    );
    
    // Log the activity
    await runExecute(
      'INSERT INTO activity_log (establishment_id, user_id, activity_type, description, entity_type, entity_id, metadata) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [
        establishmentId, userId, 'animal_movement',
        'Animal moved between rodeos',
        'animal', id, JSON.stringify({
          from_rodeo_id,
          to_rodeo_id,
          reason
        })
      ]
    );

    res.json({ message: 'Animal moved successfully' });

  } catch (error) {
    console.error('Move animal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add production record
router.post('/:id/production', authenticateToken, getUserEstablishment, async (req, res) => {
  try {
    const { id } = req.params;
    const { record_date, liters_per_day, quality_rating, notes } = req.body;
    const establishmentId = req.establishmentId;
    const userId = req.user.userId;

    // Check if animal exists and belongs to user's establishment
    const animal = await runSingle(
      'SELECT * FROM animals WHERE id = $1 AND establishment_id = $2 AND is_active = TRUE',
      [id, establishmentId]
    );

    if (!animal) {
      return res.status(404).json({ error: 'Animal not found' });
    }

    // Add production record
    const result = await runExecute(
      `INSERT INTO animal_production_records (animal_id, record_date, liters_per_day, quality_rating, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [id, record_date, liters_per_day, quality_rating, notes, userId]
    );

    const record = {
      id: result.rows[0]?.id,
      animal_id: parseInt(id),
      record_date,
      liters_per_day,
      quality_rating,
      notes,
      created_by: userId
    };

    // Log activity
    await runExecute(
      'INSERT INTO activity_log (establishment_id, user_id, activity_type, description, entity_type, entity_id, metadata) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [
        establishmentId, userId, 'production_record_added',
        `Production record added for animal: ${animal.senasa_caravan || animal.internal_caravan}`,
        'animal', id, JSON.stringify({ liters_per_day, quality_rating })
      ]
    );

    res.status(201).json({
      message: 'Production record added successfully',
      record
    });

  } catch (error) {
    console.error('Add production record error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add health record
router.post('/:id/health', authenticateToken, getUserEstablishment, async (req, res) => {
  try {
    const { id } = req.params;
    const { record_date, event_type, description, treatment, cost, veterinarian, notes } = req.body;
    const establishmentId = req.establishmentId;
    const userId = req.user.userId;

    // Check if animal exists and belongs to user's establishment
    const animal = await runSingle(
      'SELECT * FROM animals WHERE id = $1 AND establishment_id = $2 AND is_active = TRUE',
      [id, establishmentId]
    );

    if (!animal) {
      return res.status(404).json({ error: 'Animal not found' });
    }

    // Add health record
    const result = await runExecute(
      `INSERT INTO animal_health_records (animal_id, record_date, event_type, description, treatment, cost, veterinarian, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [id, record_date, event_type, description, treatment, cost, veterinarian, notes, userId]
    );

    const record = {
      id: result.rows[0]?.id,
      animal_id: parseInt(id),
      record_date,
      event_type,
      description,
      treatment,
      cost,
      veterinarian,
      notes,
      created_by: userId
    };

    // Log activity
    await runExecute(
      'INSERT INTO activity_log (establishment_id, user_id, activity_type, description, entity_type, entity_id, metadata) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [
        establishmentId, userId, 'health_record_added',
        `Health record added for animal: ${animal.senasa_caravan || animal.internal_caravan}`,
        'animal', id, JSON.stringify({ event_type, cost })
      ]
    );

    res.status(201).json({
      message: 'Health record added successfully',
      record
    });

  } catch (error) {
    console.error('Add health record error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add reproduction record
router.post('/:id/reproduction', authenticateToken, getUserEstablishment, async (req, res) => {
  try {
    const { id } = req.params;
    const { record_date, record_type, bull_id, expected_birth_date, actual_birth_date, calf_sex, calf_weight, notes } = req.body;
    const establishmentId = req.establishmentId;
    const userId = req.user.userId;

    // Check if animal exists and belongs to user's establishment
    const animal = await runSingle(
      'SELECT * FROM animals WHERE id = $1 AND establishment_id = $2 AND is_active = TRUE',
      [id, establishmentId]
    );

    if (!animal) {
      return res.status(404).json({ error: 'Animal not found' });
    }

    // Add reproduction record
    const result = await runExecute(
      `INSERT INTO animal_reproduction_records (animal_id, record_date, record_type, bull_id, expected_birth_date, actual_birth_date, calf_sex, calf_weight, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [id, record_date, record_type, bull_id, expected_birth_date, actual_birth_date, calf_sex, calf_weight, notes, userId]
    );

    const record = {
      id: result.rows[0]?.id,
      animal_id: parseInt(id),
      record_date,
      record_type,
      bull_id,
      expected_birth_date,
      actual_birth_date,
      calf_sex,
      calf_weight,
      notes,
      created_by: userId
    };

    // Log activity
    await runExecute(
      'INSERT INTO activity_log (establishment_id, user_id, activity_type, description, entity_type, entity_id, metadata) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [
        establishmentId, userId, 'reproduction_record_added',
        `Reproduction record added for animal: ${animal.senasa_caravan || animal.internal_caravan}`,
        'animal', id, JSON.stringify({ record_type, expected_birth_date })
      ]
    );

    res.status(201).json({
      message: 'Reproduction record added successfully',
      record
    });

  } catch (error) {
    console.error('Add reproduction record error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add alert
router.post('/:id/alerts', authenticateToken, getUserEstablishment, async (req, res) => {
  try {
    const { id } = req.params;
    const { alert_type, title, description, alert_date } = req.body;
    const establishmentId = req.establishmentId;
    const userId = req.user.userId;

    // Check if animal exists and belongs to user's establishment
    const animal = await runSingle(
      'SELECT * FROM animals WHERE id = $1 AND establishment_id = $2 AND is_active = TRUE',
      [id, establishmentId]
    );

    if (!animal) {
      return res.status(404).json({ error: 'Animal not found' });
    }

    // Add alert
    const result = await runExecute(
      `INSERT INTO animal_alerts (animal_id, alert_type, title, description, alert_date, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [id, alert_type, title, description, alert_date, userId]
    );

    const alert = {
      id: result.rows[0]?.id,
      animal_id: parseInt(id),
      alert_type,
      title,
      description,
      alert_date,
      is_active: true,
      created_by: userId
    };

    // Log activity
    await runExecute(
      'INSERT INTO activity_log (establishment_id, user_id, activity_type, description, entity_type, entity_id, metadata) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [
        establishmentId, userId, 'alert_added',
        `Alert added for animal: ${animal.senasa_caravan || animal.internal_caravan}`,
        'animal', id, JSON.stringify({ alert_type, title })
      ]
    );

    res.status(201).json({
      message: 'Alert added successfully',
      alert
    });

  } catch (error) {
    console.error('Add alert error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Resolve alert
router.put('/alerts/:alertId/resolve', authenticateToken, getUserEstablishment, async (req, res) => {
  try {
    const { alertId } = req.params;
    const establishmentId = req.establishmentId;
    const userId = req.user.userId;

    // Check if alert exists and belongs to user's establishment
    const alert = await runSingle(
      `SELECT aa.*, a.establishment_id 
       FROM animal_alerts aa 
       JOIN animals a ON aa.animal_id = a.id 
       WHERE aa.id = $1 AND a.establishment_id = $2`,
      [alertId, establishmentId]
    );

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    // Resolve alert
    await runExecute(
      'UPDATE animal_alerts SET is_active = FALSE, resolved_date = CURRENT_DATE, resolved_by = $1 WHERE id = $2',
      [userId, alertId]
    );

    const resolvedAlert = {
      ...alert,
      is_active: 0,
      resolved_date: new Date().toISOString().split('T')[0],
      resolved_by: userId
    };

    res.json({
      message: 'Alert resolved successfully',
      alert: resolvedAlert
    });

  } catch (error) {
    console.error('Resolve alert error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
