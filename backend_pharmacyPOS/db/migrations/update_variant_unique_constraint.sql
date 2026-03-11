ALTER TABLE variants DROP INDEX unique_variant;
ALTER TABLE variants ADD UNIQUE KEY unique_variant (variant_type, variant_option, branch_id);