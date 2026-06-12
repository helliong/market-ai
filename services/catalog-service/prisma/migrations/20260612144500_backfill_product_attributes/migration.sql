UPDATE "Product"
SET "attributes" = "attributes" || COALESCE(
  (
    SELECT jsonb_object_agg(
      trim(split_part(attribute_line, ':', 1)),
      trim(substr(attribute_line, strpos(attribute_line, ':') + 1))
    )
    FROM regexp_split_to_table(
      substring("description" from 'Характеристики:[[:space:]]*([\s\S]*)'),
      E'\n'
    ) AS attribute_line
    WHERE strpos(attribute_line, ':') > 0
      AND trim(split_part(attribute_line, ':', 1)) <> ''
      AND trim(substr(attribute_line, strpos(attribute_line, ':') + 1)) <> ''
  ),
  '{}'::jsonb
)
WHERE "attributes" = '{}'::jsonb
  AND "description" LIKE '%Характеристики:%';
