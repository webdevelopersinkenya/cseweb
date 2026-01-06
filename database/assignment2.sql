
--inspect the structure of  account table:
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'account';

--list  table’s column names:
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'account';

--insert statement for account table.
INSERT INTO account (account_firstname, account_lastname, account_email, account_password)
VALUES ('Tony', 'Stark', 'tony@starkent.com', 'Iam1ronM@n');

--Change 'Tony' 'Stark' to Admin
UPDATE account
SET account_type = 'Admin'
WHERE account_email = 'tony@starkent.com';

--Delete "Tony" "Stark" from account
DELETE FROM account
WHERE account_email = 'tony@starkent.com';

-- Modify GM Hummer to read huge interior rather than small interior.
UPDATE inventory
SET inv_description = REPLACE(inv_description, 'small interiors', 'a huge interior')
WHERE inv_model = 'GM Hummer';

--- model fields from the inventory table and the classification name 
SELECT i.inv_make, i.inv_model, c.classification_name
FROM inventory i
INNER JOIN classification c
  ON i.classification_id = c.classification_id
WHERE c.classification_name = 'Sport';

-- Update inventory
UPDATE inventory
SET
  inv_image = REPLACE(inv_image, '/images/', '/images/vehicles/'),
  inv_thumbnail = REPLACE(inv_thumbnail, '/images/', '/images/vehicles/');
