/*
  # Fix bills category relation

  1. Changes
    - Add comment to bills.category_id to specify the foreign key relationship name
    
  2. Security
    - No changes to RLS policies
    - No changes to existing security settings
*/

COMMENT ON COLUMN bills.category_id IS E'@foreignKey (name=category)\n@manyToOne ({\n  relation: "categories",\n  fields: ["category_id"],\n  references: ["id"]\n})';