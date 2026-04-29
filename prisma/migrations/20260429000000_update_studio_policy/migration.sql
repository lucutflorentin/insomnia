-- Enforce the updated public studio policy in existing databases.

UPDATE `availability_templates`
SET
  `start_time` = '12:00',
  `end_time` = '20:00',
  `is_active` = TRUE;

INSERT INTO `settings` (`setting_key`, `setting_value`, `updated_at`)
VALUES
  (
    'studio_hours',
    '{"mon-sun":"12:00 - 20:00","note":"Se lucreaza strict in functie de programari in intervalul afisat"}',
    NOW(3)
  ),
  (
    'studio_address',
    'Str. D10, Nr. 11 Bis, Ap. 2, Mamaia Nord, Constanta',
    NOW(3)
  )
ON DUPLICATE KEY UPDATE
  `setting_value` = VALUES(`setting_value`),
  `updated_at` = NOW(3);
