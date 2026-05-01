ALTER TABLE `bookings`
  MODIFY `consultation_date` DATE NULL,
  MODIFY `consultation_time` VARCHAR(5) NULL;

UPDATE `bookings`
SET `consultation_date` = NULL,
    `consultation_time` = NULL
WHERE `source` = 'quick_form'
  AND `consultation_time` = '00:00';
