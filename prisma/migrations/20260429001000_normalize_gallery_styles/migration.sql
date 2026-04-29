UPDATE `gallery`
SET `style` = 'realism'
WHERE LOWER(TRIM(`style`)) IN ('realism', 'realistic');

UPDATE `gallery`
SET `style` = 'linework'
WHERE LOWER(REPLACE(REPLACE(TRIM(`style`), ' ', ''), '_', '')) IN ('linework', 'linework');

UPDATE `gallery`
SET `style` = 'blackgrey'
WHERE LOWER(REPLACE(REPLACE(REPLACE(TRIM(`style`), '&', ''), ' ', ''), '_', '')) IN ('blackgrey', 'blackandgrey');

UPDATE `gallery`
SET `style` = 'graphic'
WHERE LOWER(TRIM(`style`)) = 'graphic';

UPDATE `gallery`
SET `style` = 'geometric'
WHERE LOWER(TRIM(`style`)) = 'geometric';

UPDATE `gallery`
SET `style` = 'minimalist'
WHERE LOWER(TRIM(`style`)) IN ('minimalist', 'minimalism');

UPDATE `gallery`
SET `style` = 'blackwork'
WHERE LOWER(TRIM(`style`)) = 'blackwork';

UPDATE `gallery`
SET `style` = 'color'
WHERE LOWER(TRIM(`style`)) IN ('color', 'colour');

UPDATE `gallery`
SET `style` = 'portraits'
WHERE LOWER(TRIM(`style`)) IN ('portrait', 'portraits', 'portrete');

UPDATE `gallery`
SET `style` = 'nature'
WHERE LOWER(TRIM(`style`)) IN ('nature', 'natura');
