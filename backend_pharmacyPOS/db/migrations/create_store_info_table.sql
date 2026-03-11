-- Create store_info table
CREATE TABLE IF NOT EXISTS `store_info` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `code` varchar(100) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `businessType` varchar(100) DEFAULT NULL,
  `logo` varchar(255) DEFAULT NULL,
  `activeBranchId` int(11) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default store info if not exists
INSERT INTO `store_info` (`id`, `name`, `code`, `email`, `businessType`, `logo`, `activeBranchId`)
SELECT 1, 'My Store', 'ST001', 'store@example.com', 'Retail', NULL, 1
WHERE NOT EXISTS (SELECT 1 FROM `store_info` WHERE id = 1);
