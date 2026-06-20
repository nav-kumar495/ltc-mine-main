const pool = require('../config/db');

const getLtcId = (prn) => {
  if (!prn) return null;
  const digits = String(prn).replace(/\D/g, '');
  return digits.length >= 4 ? digits.slice(-4) : prn;
};

const withLtcId = (rows) => rows.map(r => ({ ...r, ltc_id: getLtcId(r.prn) }));

const writeAudit = (userId, userName, action, entityType, entityId, details) => {
  pool.query(
    `INSERT INTO audit_logs (user_id, user_name, action, entity_type, entity_id, details)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [userId || null, userName || 'System', action, entityType || null, entityId || null, details ? JSON.stringify(details) : null]
  ).catch(err => console.error('[AuditLog Error]', err.message));
};

module.exports = {
  getLtcId,
  withLtcId,
  writeAudit
};
