// routes/dashboard.js
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

// Get dashboard KPIs and statistics
router.get('/stats', authenticateToken, getUserEstablishment, async (req, res) => {
  try {
    const establishmentId = req.establishmentId;

    // Get basic counts
    const stats = await runSingle(`
      SELECT 
        (SELECT COUNT(*) FROM animals WHERE establishment_id = ? AND is_active = 1) as total_animals,
        (SELECT COUNT(*) FROM rodeos WHERE establishment_id = ? AND is_active = 1) as total_rodeos,
        (SELECT COUNT(*) FROM animal_alerts aa 
         JOIN animals a ON aa.animal_id = a.id 
         WHERE a.establishment_id = ? AND aa.is_active = 1) as total_alerts,
        (SELECT COUNT(*) FROM animal_alerts aa 
         JOIN animals a ON aa.animal_id = a.id 
         WHERE a.establishment_id = ? AND aa.is_active = 1 AND aa.alert_type = 'pregnancy') as pregnancy_alerts,
        (SELECT COUNT(*) FROM animal_alerts aa 
         JOIN animals a ON aa.animal_id = a.id 
         WHERE a.establishment_id = ? AND aa.is_active = 1 AND aa.alert_type = 'antibiotics') as antibiotics_alerts
    `, [establishmentId, establishmentId, establishmentId, establishmentId, establishmentId]);

    // Get production statistics for the last 30 days
    const productionData = await runQuery(`
      SELECT 
        DATE(apr.record_date) as date,
        COUNT(DISTINCT apr.animal_id) as animals_milked,
        AVG(apr.liters_per_day) as avg_liters_per_animal,
        SUM(apr.liters_per_day) as total_liters,
        AVG(apr.quality_rating) as avg_quality
      FROM animal_production_records apr
      JOIN animals a ON apr.animal_id = a.id
      WHERE a.establishment_id = ? 
        AND apr.record_date >= date('now', '-30 days')
      GROUP BY DATE(apr.record_date)
      ORDER BY DATE(apr.record_date) DESC
      LIMIT 30
    `, [establishmentId]);

    // Get recent activity log
    const activities = await runQuery(`
      SELECT 
        al.activity_type,
        al.description,
        al.created_at,
        u.first_name,
        u.last_name
      FROM activity_log al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.establishment_id = ?
      ORDER BY al.created_at DESC
      LIMIT 20
    `, [establishmentId]);

    // Get animals by rodeo
    const rodeos = await runQuery(`
      SELECT 
        r.id,
        r.name,
        COUNT(a.id) as animal_count,
        (SELECT COUNT(*) FROM animal_alerts aa 
         JOIN animals a2 ON aa.animal_id = a2.id 
         WHERE a2.current_rodeo_id = r.id AND aa.is_active = 1) as alerts_count
      FROM rodeos r
      LEFT JOIN animals a ON r.id = a.current_rodeo_id AND a.is_active = 1
      WHERE r.establishment_id = ? AND r.is_active = 1
      GROUP BY r.id, r.name
      ORDER BY r.name
    `, [establishmentId]);

    res.json({
      establishment: {
        id: establishmentId,
        name: req.establishmentName
      },
      stats: {
        totalAnimals: parseInt(stats.total_animals),
        totalRodeos: parseInt(stats.total_rodeos),
        totalAlerts: parseInt(stats.total_alerts),
        pregnancyAlerts: parseInt(stats.pregnancy_alerts),
        antibioticsAlerts: parseInt(stats.antibiotics_alerts)
      },
      production: {
        daily: productionData.map(row => ({
          date: row.date,
          animalsMilked: parseInt(row.animals_milked),
          avgLitersPerAnimal: parseFloat(row.avg_liters_per_animal || 0),
          totalLiters: parseFloat(row.total_liters || 0),
          avgQuality: parseFloat(row.avg_quality || 0)
        }))
      },
      activity: activities.map(row => ({
        type: row.activity_type,
        description: row.description,
        timestamp: row.created_at,
        user: row.first_name && row.last_name ? `${row.first_name} ${row.last_name}` : 'Sistema'
      })),
      rodeos: rodeos.map(row => ({
        id: row.id,
        name: row.name,
        animalCount: parseInt(row.animal_count),
        alertsCount: parseInt(row.alerts_count)
      }))
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get alerts for dashboard
router.get('/alerts', authenticateToken, getUserEstablishment, async (req, res) => {
  try {
    const establishmentId = req.establishmentId;
    const { limit = 10 } = req.query;

    const alerts = await runQuery(`
      SELECT 
        aa.id,
        aa.alert_type,
        aa.title,
        aa.description,
        aa.alert_date,
        aa.created_at,
        a.senasa_caravan,
        a.internal_caravan,
        a.name as animal_name,
        r.name as rodeo_name,
        u.first_name,
        u.last_name
      FROM animal_alerts aa
      JOIN animals a ON aa.animal_id = a.id
      LEFT JOIN rodeos r ON a.current_rodeo_id = r.id
      LEFT JOIN users u ON aa.created_by = u.id
      WHERE a.establishment_id = ? AND aa.is_active = 1
      ORDER BY aa.alert_date DESC, aa.created_at DESC
      LIMIT ?
    `, [establishmentId, parseInt(limit)]);

    res.json({
      alerts: alerts.map(row => ({
        id: row.id,
        type: row.alert_type,
        title: row.title,
        description: row.description,
        alertDate: row.alert_date,
        createdAt: row.created_at,
        animal: {
          senasaCaravan: row.senasa_caravan,
          internalCaravan: row.internal_caravan,
          name: row.animal_name,
          rodeo: row.rodeo_name
        },
        createdBy: row.first_name && row.last_name ? `${row.first_name} ${row.last_name}` : 'Sistema'
      }))
    });

  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search animals (quick search)
router.get('/search', authenticateToken, getUserEstablishment, async (req, res) => {
  try {
    const { q } = req.query;
    const establishmentId = req.establishmentId;

    if (!q || q.length < 2) {
      return res.json({ animals: [] });
    }

    const animals = await runQuery(`
      SELECT 
        a.id,
        a.senasa_caravan,
        a.internal_caravan,
        a.name,
        r.name as rodeo_name,
        (SELECT COUNT(*) FROM animal_alerts aa WHERE aa.animal_id = a.id AND aa.is_active = 1) as active_alerts
      FROM animals a
      LEFT JOIN rodeos r ON a.current_rodeo_id = r.id
      WHERE a.establishment_id = ? 
        AND a.is_active = 1
        AND (
          a.senasa_caravan LIKE ? OR 
          a.internal_caravan LIKE ? OR 
          a.name LIKE ?
        )
      ORDER BY 
        CASE 
          WHEN a.senasa_caravan LIKE ? THEN 1
          WHEN a.internal_caravan LIKE ? THEN 2
          ELSE 3
        END,
        a.senasa_caravan,
        a.internal_caravan,
        a.name
      LIMIT 10
    `, [establishmentId, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`]);

    res.json({
      animals: animals.map(row => ({
        id: row.id,
        senasaCaravan: row.senasa_caravan,
        internalCaravan: row.internal_caravan,
        name: row.name,
        rodeo: row.rodeo_name,
        activeAlerts: parseInt(row.active_alerts)
      }))
    });

  } catch (error) {
    console.error('Search animals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get production summary for charts
router.get('/production-summary', authenticateToken, getUserEstablishment, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const establishmentId = req.establishmentId;

    const productionData = await runQuery(`
      SELECT 
        DATE(apr.record_date) as date,
        COUNT(DISTINCT apr.animal_id) as animals_milked,
        AVG(apr.liters_per_day) as avg_liters_per_animal,
        SUM(apr.liters_per_day) as total_liters,
        AVG(apr.quality_rating) as avg_quality,
        COUNT(*) as total_records
      FROM animal_production_records apr
      JOIN animals a ON apr.animal_id = a.id
      WHERE a.establishment_id = ? 
        AND apr.record_date >= date('now', '-${parseInt(days)} days')
      GROUP BY DATE(apr.record_date)
      ORDER BY DATE(apr.record_date) ASC
    `, [establishmentId]);

    // Calculate totals and averages
    const totals = productionData.reduce((acc, row) => {
      acc.totalLiters += parseFloat(row.total_liters || 0);
      acc.totalRecords += parseInt(row.total_records);
      acc.daysWithData += 1;
      return acc;
    }, { totalLiters: 0, totalRecords: 0, daysWithData: 0 });

    const avgDailyLiters = totals.daysWithData > 0 ? totals.totalLiters / totals.daysWithData : 0;

    res.json({
      summary: {
        totalLiters: totals.totalLiters,
        totalRecords: totals.totalRecords,
        avgDailyLiters: avgDailyLiters,
        daysWithData: totals.daysWithData,
        period: parseInt(days)
      },
      daily: productionData.map(row => ({
        date: row.date,
        animalsMilked: parseInt(row.animals_milked),
        avgLitersPerAnimal: parseFloat(row.avg_liters_per_animal || 0),
        totalLiters: parseFloat(row.total_liters || 0),
        avgQuality: parseFloat(row.avg_quality || 0),
        totalRecords: parseInt(row.total_records)
      }))
    });

  } catch (error) {
    console.error('Get production summary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;