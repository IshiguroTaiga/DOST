-- ============================================================
-- RDRRMC Report System — Admin User Types Migration
-- Run this script in the Supabase SQL Editor
-- ============================================================

-- ================================================================
-- STEP 1: Upgrade existing users to their Admin equivalents
-- (Q4: Yes — upgrade existing Regional and Provincial users)
-- ================================================================

-- Upgrade all existing 'Regional' users → 'Regional Admin'
UPDATE users
SET account_type = 'Regional Admin'
WHERE account_type = 'Regional';

-- Upgrade all existing 'Provincial' users → 'Provincial Admin'
UPDATE users
SET account_type = 'Provincial Admin'
WHERE account_type = 'Provincial';

-- NOTE: LGU users are NOT upgraded automatically.
-- If you want specific LGU users to become LGU Admins, run:
-- UPDATE users SET account_type = 'LGU Admin' WHERE account_type = 'LGU' AND email = 'specific@email.com';


-- ================================================================
-- STEP 2: Verification — check what account types exist after migration
-- ================================================================

SELECT account_type, COUNT(*) AS user_count
FROM users
GROUP BY account_type
ORDER BY account_type;


-- ================================================================
-- STEP 3 (OPTIONAL): Recreate non-admin versions of Regional/Provincial
-- if you still want some users without admin privileges
--
-- Example: Create a new Regional user who CANNOT manage users:
-- UPDATE users SET account_type = 'Regional' WHERE email = 'readonly@email.com';
-- ================================================================
