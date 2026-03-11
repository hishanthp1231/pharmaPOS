-- MySQL dump 10.13  Distrib 8.0.34, for Win64 (x86_64)
--
-- Host: localhost    Database: pharmacypos
-- ------------------------------------------------------
-- Server version	8.0.35

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `billing_settings`
--

DROP TABLE IF EXISTS `billing_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `billing_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `branch_id` int NOT NULL,
  `defaultPaymentMethod` varchar(32) NOT NULL DEFAULT 'Cash',
  `defaultDiscountType` varchar(32) NOT NULL DEFAULT 'Percentage',
  `defaultDiscountValue` decimal(5,2) NOT NULL DEFAULT '0.00',
  `taxPercentage` decimal(5,2) NOT NULL DEFAULT '0.00',
  `receiptFooter` varchar(255) NOT NULL DEFAULT 'Thank you for your business!',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_branch` (`branch_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `billing_settings`
--

LOCK TABLES `billing_settings` WRITE;
/*!40000 ALTER TABLE `billing_settings` DISABLE KEYS */;
INSERT INTO `billing_settings` VALUES (1,1,'Cash','Percentage',5.00,12.00,'Thank you for shopping with us!');
/*!40000 ALTER TABLE `billing_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `branches`
--

DROP TABLE IF EXISTS `branches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `branches` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `code` varchar(100) NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `tel` varchar(50) DEFAULT NULL,
  `manager` varchar(100) DEFAULT NULL,
  `active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `branches`
--

LOCK TABLES `branches` WRITE;
/*!40000 ALTER TABLE `branches` DISABLE KEYS */;
INSERT INTO `branches` VALUES (1,'Main Branch','BR001','123 Galle Road, Colombo','+94 11 2345678','John Perera',1),(2,'Kandy Branch','BR002','45 Temple Street, Kandy','+94 81 2233445','Nimal Silva',1),(3,'Galle Branch','BR003','67 Lighthouse Street, Galle','+94 91 2256789','Saman Kumara',1),(4,'Negombo Branch','BR004','88 Beach Road, Negombo','+94 31 2277889','Ruwan Fernando',1),(5,'Jaffna Branch','BR005','12 KKS Road, Jaffna','+94 21 2223344','Thiru Sivarajah',0),(6,'Matara Branch','BR006','56 Main Street, Matara','+94 41 2233445','Kasun Jayasuriya',1),(7,'Kurunegala Branch','BR007','34 Lake Road, Kurunegala','+94 37 2244556','Roshan Weerasinghe',1),(8,'Batticaloa Branch','BR008','78 Trinco Road, Batticaloa','+94 65 2228899','Mohan Raj',0);
/*!40000 ALTER TABLE `branches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `branch_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_name_branch` (`name`,`branch_id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (15,'Abc',1),(13,'Baby Care',1),(7,'Baby Care',4),(9,'Cold & Flu',1),(3,'Cold & Flu',2),(11,'Diabetes Care',1),(5,'Diabetes Care',3),(12,'First Aid',1),(6,'First Aid',3),(1,'Pain Relief',1),(14,'Personal Care',1),(8,'Personal Care',4),(16,'pgt',1),(10,'Skincare',1),(4,'Skincare',2),(2,'Vitamins & Supplements',1),(17,'werqs',1);
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `whatsapp` tinyint(1) DEFAULT '0',
  `viber` tinyint(1) DEFAULT '0',
  `email` varchar(100) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `dob` date DEFAULT NULL,
  `paid` decimal(12,2) DEFAULT '0.00',
  `due` decimal(12,2) DEFAULT '0.00',
  `credit` decimal(12,2) DEFAULT '0.00',
  `status` varchar(20) DEFAULT 'Active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `branch_id` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES (1,'Shayanthavi Tharmananthan','0763650199',0,0,'sayanthavitharmaa13@gmail.com','Galle, Sri Lanka','2000-06-07',0.00,0.00,0.00,'Active','2025-08-28 03:08:51',NULL),(2,'Shayanthavi Tharmananthan','0763650199',0,0,'sayanthavitharmaa13@gmail.com','Galle, Sri Lanka','2000-06-07',0.00,0.00,0.00,'Active','2025-08-28 03:40:52',NULL),(3,'Shayanthavi Tharmananthan','0763650199',0,0,'sayanthavitharmaa13@gmail.com','Galle, Sri Lanka','2000-06-07',0.00,0.00,0.00,'Active','2025-08-28 03:42:35',NULL),(4,'Shayanthavi ','0763650199',0,0,'sayanthavitharmaa@gmail.com','Galle, Sri Lanka','2000-06-07',0.00,0.00,0.00,'Active','2025-08-28 04:03:54',NULL),(5,'Shayanthavi T','0763650199',0,0,'sayanthavitharmaa@gmail.com','Galle, Sri Lanka','2000-06-07',0.00,0.00,0.00,'Active','2025-08-28 04:04:36',NULL),(6,'Shayanthu','0763650198',0,0,'sayanthavitrmaa@gmail.com','Galle, Sri Lanka','2000-05-07',0.00,0.00,0.00,'Active','2025-08-28 04:16:11',NULL),(7,'Sagi','0763650197',0,0,'sayanthavitrmaa@gmail.com','Galle, Sri Lanka','2000-05-07',0.00,0.00,0.00,'Active','2025-08-28 04:22:31',NULL),(8,'Sagiiii','0763650198',1,0,'sayanthavitrmaa@gmail.com','Galle, Sri Lanka','2000-05-05',5000.00,2000.00,500.00,'Active','2025-08-28 04:44:03',1);
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `discounts`
--

DROP TABLE IF EXISTS `discounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `discounts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `type` varchar(20) NOT NULL,
  `value` decimal(10,2) NOT NULL,
  `startDate` date NOT NULL,
  `endDate` date NOT NULL,
  `status` varchar(20) NOT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `branch_id` int DEFAULT NULL,
  `items` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `discounts`
--

LOCK TABLES `discounts` WRITE;
/*!40000 ALTER TABLE `discounts` DISABLE KEYS */;
INSERT INTO `discounts` VALUES (1,'djsa','percentage',12.00,'2025-09-01','2025-10-01','Active','2025-09-02 06:45:41',1,'[\"abd\",\"fgu\"]');
/*!40000 ALTER TABLE `discounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `expenses`
--

DROP TABLE IF EXISTS `expenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expenses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `expense` varchar(255) NOT NULL,
  `paidTo` varchar(255) NOT NULL,
  `date` date NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `paymentMethod` varchar(50) NOT NULL,
  `status` varchar(50) DEFAULT 'Paid',
  `balance` decimal(12,2) DEFAULT '0.00',
  `remark` text,
  `receipt` varchar(255) DEFAULT NULL,
  `branch_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expenses`
--

LOCK TABLES `expenses` WRITE;
/*!40000 ALTER TABLE `expenses` DISABLE KEYS */;
INSERT INTO `expenses` VALUES (1,'Rent','erty','2025-09-01',20000.00,'Cash','Paid',NULL,'nteidnj djiwk','1756723182699-430030365-test_jpg.jpg',1,'2025-09-01 05:31:48'),(2,'Bills','derdtfg','2025-09-17',3000.00,'Cash','Paid',NULL,'djygfg','1756724596770-356125285-432713PE9R6W852.jpg',1,'2025-09-01 10:46:28');
/*!40000 ALTER TABLE `expenses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `grn_items`
--

DROP TABLE IF EXISTS `grn_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `grn_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `branch_id` int NOT NULL,
  `medicine_id` int NOT NULL,
  `quantity` int NOT NULL,
  `unit` varchar(20) DEFAULT NULL,
  `mrp` decimal(10,2) NOT NULL,
  `retail` decimal(10,2) DEFAULT NULL,
  `wholesale` decimal(10,2) DEFAULT NULL,
  `expiry` date DEFAULT NULL,
  `supplier` varchar(100) NOT NULL,
  `date` date NOT NULL,
  `invoice` varchar(50) DEFAULT NULL,
  `grn_id` int DEFAULT NULL,
  `total` decimal(12,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `medicine_id` (`medicine_id`),
  KEY `branch_id` (`branch_id`),
  CONSTRAINT `grn_items_ibfk_1` FOREIGN KEY (`medicine_id`) REFERENCES `medicines` (`id`),
  CONSTRAINT `grn_items_ibfk_2` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `grn_items`
--

LOCK TABLES `grn_items` WRITE;
/*!40000 ALTER TABLE `grn_items` DISABLE KEYS */;
INSERT INTO `grn_items` VALUES (6,1,1,400,'cards',500.00,800.00,750.00,'2025-08-26','wqcx','2025-08-12','453',3,0.00),(7,1,2,120,'cards',300.00,500.00,450.00,'2025-08-25','wqcx','2025-08-12','453',3,0.00),(8,1,1,200,'bottles',550.00,850.00,800.00,'2025-09-29','wqcxfad','2025-08-25','453',4,110000.00),(9,1,2,300,'cards',300.00,500.00,450.00,'2025-09-04','wqcxfad','2025-08-25','453',4,90000.00),(10,1,3,30,'box',400.00,700.00,600.00,'2025-09-24','wqcxfad','2025-08-25','453',4,12000.00),(11,1,1,200,'bottles',550.00,850.00,800.00,'2025-09-29','wqcxfad','2025-07-22','453',2,110000.00),(12,1,2,300,'cards',300.00,500.00,450.00,'2025-09-04','wqcxfad','2025-07-22','453',2,90000.00),(13,1,2,35,'box',24667.00,45678.00,64332.00,'2025-08-17','wqcxfad','2025-07-22','453',2,863345.00),(23,1,1,40,'boxes',1500.00,2600.00,2500.00,'2025-09-15','wqcxfad','2025-09-02','656',5,60000.00),(24,1,4,3,'cards',200.00,800.00,700.00,'2025-09-21','gi4j','2025-09-03','440',6,600.00);
/*!40000 ALTER TABLE `grn_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medicines`
--

DROP TABLE IF EXISTS `medicines`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medicines` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `generic_name` varchar(100) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `suppliers` text,
  `default_mrp` decimal(10,2) DEFAULT NULL,
  `image` varchar(512) DEFAULT NULL,
  `variants` text,
  `barcode` varchar(32) DEFAULT NULL,
  `branch_id` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medicines`
--

LOCK TABLES `medicines` WRITE;
/*!40000 ALTER TABLE `medicines` DISABLE KEYS */;
INSERT INTO `medicines` VALUES (1,'Paracetamol		','Acetaminophen','Pain Relief',NULL,110.00,'med-1756120356677-k7hdol.jpg','[{\"typeId\":\"6\",\"typeName\":\"Abcde\",\"options\":[{\"optionId\":\"15\",\"optionName\":\"efgh\",\"price_adjustment\":0,\"custom_price_adjustment\":100},{\"optionId\":\"17\",\"optionName\":\"pqr\",\"price_adjustment\":0,\"custom_price_adjustment\":200}]}]','00000001',1),(2,'dfv','swqgy','Cold & Flu',NULL,130.00,'med-1756120423742-0t1mb8.jpg','[{\"typeId\":\"1\",\"typeName\":\"Dosage\",\"options\":[{\"optionId\":\"1\",\"optionName\":\"100mg\"},{\"optionId\":\"2\",\"optionName\":\"250mg\"},{\"optionId\":\"3\",\"optionName\":\"500mg\"}]}]','00000002',1),(3,'dghjk','drdfgyu','First Aid',NULL,220.00,'med-1756179890346-s4eoyd.jpg','[{\"typeId\":\"1\",\"typeName\":\"Dosage\",\"options\":[]}]','00000003',1),(4,'nbvcdsrt','gfe4356tbg','pgt',NULL,123.00,'med-1756287147605-gvowzp.jpg','[{\"typeId\":\"6\",\"typeName\":\"Abcde\",\"options\":[]}]','00000004',1),(5,'mkv','djdehj','Personal Care',NULL,0.00,'med-1756367448662-vrm9ut.jpg','[]','00000005',NULL),(6,'Panadol','wgdgrw','Pain Relief',NULL,0.00,'','[{\"typeId\":\"6\",\"typeName\":\"Abcde\",\"options\":[{\"optionId\":\"15\",\"optionName\":\"efgh\",\"price_adjustment\":\"0.00\"}]},{\"typeId\":\"1\",\"typeName\":\"Dosage\",\"options\":[{\"optionId\":\"1\",\"optionName\":\"100mg\",\"price_adjustment\":\"0.00\"},{\"optionId\":\"2\",\"optionName\":\"250mg\",\"price_adjustment\":\"20.00\"}]}]','00000006',NULL),(8,'geduux','jchugyef','Abc',NULL,0.00,'med-1756880362096-y10fai.jpg','[{\"typeId\":\"6\",\"typeName\":\"Abcde\",\"options\":[{\"optionId\":\"15\",\"optionName\":\"efgh\",\"price_adjustment\":\"0.00\"}]}]','00000008',1),(9,'nhjdhegf','dnjs','werqs',NULL,0.00,'med-1756881582855-f9rtdy.jpg','[{\"typeId\":\"6\",\"typeName\":\"Abcde\",\"options\":[{\"optionId\":\"15\",\"optionName\":\"efgh\",\"price_adjustment\":\"0.00\",\"custom_price_adjustment\":200},{\"optionId\":\"16\",\"optionName\":\"ijk\",\"price_adjustment\":\"0.00\",\"custom_price_adjustment\":300}]}]','00000009',1);
/*!40000 ALTER TABLE `medicines` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pharmacy_pay_in_terms`
--

DROP TABLE IF EXISTS `pharmacy_pay_in_terms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pharmacy_pay_in_terms` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `contact` varchar(50) DEFAULT NULL,
  `prescriptionId` varchar(50) DEFAULT NULL,
  `medicineBatch` varchar(50) DEFAULT NULL,
  `expiryDate` date DEFAULT NULL,
  `pharmacistNotes` text,
  `creditLimit` decimal(12,2) DEFAULT '0.00',
  `termDuration` varchar(50) DEFAULT NULL,
  `paymentCycle` varchar(50) DEFAULT NULL,
  `invoiceDate` date DEFAULT NULL,
  `dueDate` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `branch_id` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pharmacy_pay_in_terms`
--

LOCK TABLES `pharmacy_pay_in_terms` WRITE;
/*!40000 ALTER TABLE `pharmacy_pay_in_terms` DISABLE KEYS */;
INSERT INTO `pharmacy_pay_in_terms` VALUES (1,'Abc','0763650199','efdde4','123','2025-08-12','derfdfd',20000.00,'1 year','2 months','2025-09-17','2025-08-30','2025-08-28 13:28:10',1);
/*!40000 ALTER TABLE `pharmacy_pay_in_terms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pharmacy_payments`
--

DROP TABLE IF EXISTS `pharmacy_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pharmacy_payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `pay_in_terms_id` int NOT NULL,
  `date` date DEFAULT NULL,
  `amount` decimal(12,2) DEFAULT NULL,
  `notes` text,
  PRIMARY KEY (`id`),
  KEY `pay_in_terms_id` (`pay_in_terms_id`),
  CONSTRAINT `pharmacy_payments_ibfk_1` FOREIGN KEY (`pay_in_terms_id`) REFERENCES `pharmacy_pay_in_terms` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pharmacy_payments`
--

LOCK TABLES `pharmacy_payments` WRITE;
/*!40000 ALTER TABLE `pharmacy_payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `pharmacy_payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pharmacy_returns_refunds`
--

DROP TABLE IF EXISTS `pharmacy_returns_refunds`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pharmacy_returns_refunds` (
  `id` int NOT NULL AUTO_INCREMENT,
  `date` date DEFAULT NULL,
  `medicine` varchar(100) DEFAULT NULL,
  `batch` varchar(50) DEFAULT NULL,
  `expiry` date DEFAULT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `refundAmount` decimal(12,2) DEFAULT NULL,
  `method` varchar(50) DEFAULT NULL,
  `pharmacistNotes` text,
  `customerName` varchar(100) DEFAULT NULL,
  `customerContact` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `branch_id` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pharmacy_returns_refunds`
--

LOCK TABLES `pharmacy_returns_refunds` WRITE;
/*!40000 ALTER TABLE `pharmacy_returns_refunds` DISABLE KEYS */;
INSERT INTO `pharmacy_returns_refunds` VALUES (1,'2025-08-27','hgtd','001','2025-10-14','Defected',30000.00,'cash','derfdfd','Abc','123456789654','2025-08-29 03:40:03',1);
/*!40000 ALTER TABLE `pharmacy_returns_refunds` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `profile_settings`
--

DROP TABLE IF EXISTS `profile_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `profile_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `role` varchar(30) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `profile_settings`
--

LOCK TABLES `profile_settings` WRITE;
/*!40000 ALTER TABLE `profile_settings` DISABLE KEYS */;
INSERT INTO `profile_settings` VALUES (1,'Shayanthavi Tharma','sayanthavitharmaa13@gmail.com','0763650196','Admin');
/*!40000 ALTER TABLE `profile_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `can_view` tinyint(1) DEFAULT '0',
  `can_edit` tinyint(1) DEFAULT '0',
  `can_delete` tinyint(1) DEFAULT '0',
  `pages` json DEFAULT NULL,
  `is_admin` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'Role1',1,1,1,'[\"Dashboard\", \"Expenses\", \"Home\", \"Menu Items\", \"Orders\", \"Tables\", \"Reports\", \"Settings\"]',0),(3,'Admin1',1,1,1,'[\"Dashboard\", \"Home\", \"Menu Items\", \"Orders\", \"Tables\", \"Customers\", \"Expenses\", \"Reports\", \"Settings\"]',0),(4,'Admin2',1,1,1,'[\"Dashboard\", \"Home\", \"Menu Items\", \"Orders\", \"Tables\", \"Customers\", \"Expenses\", \"Reports\", \"Settings\"]',0),(5,'Role2',1,1,0,'[\"Home\", \"Menu Items\", \"Orders\"]',0),(6,'Role3',1,0,0,'[\"Dashboard\", \"Home\", \"Menu Items\", \"Orders\", \"Tables\", \"Customers\", \"Expenses\", \"Reports\", \"Settings\"]',0),(7,'Admin3',1,1,1,'[\"Dashboard\", \"Home\", \"Menu Items\", \"Orders\", \"Tables\", \"Customers\", \"Expenses\", \"Reports\", \"Settings\"]',1),(8,'Admin4',1,1,1,'[\"Dashboard\", \"Home\", \"Inventory\", \"Suppliers\", \"Customers\", \"Expenses\", \"Reports\", \"Settings\"]',1),(10,'Role4',1,1,0,'[\"Home\", \"Customers\", \"Suppliers\", \"Expenses\", \"Add Sales\"]',0);
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sales_details`
--

DROP TABLE IF EXISTS `sales_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sales_details` (
  `id` int NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `customer` varchar(128) NOT NULL,
  `items` json NOT NULL,
  `total` decimal(12,2) NOT NULL,
  `branch_id` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sales_details`
--

LOCK TABLES `sales_details` WRITE;
/*!40000 ALTER TABLE `sales_details` DISABLE KEYS */;
INSERT INTO `sales_details` VALUES (1,'2025-08-27','Abc','[{\"name\": \"Paracetamol\\t\\t\", \"quantity\": 1}]',600.00,1),(2,'2025-08-27','Abc','[{\"name\": \"dghjk\", \"quantity\": 12}, {\"name\": \"dfv\", \"quantity\": 20}]',800.00,1),(3,'2025-10-07','sae','[{\"name\": \"dfv\", \"quantity\": 20}]',3000.00,1);
/*!40000 ALTER TABLE `sales_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `store_info`
--

DROP TABLE IF EXISTS `store_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `store_info` (
  `id` int NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `code` varchar(100) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `businessType` varchar(100) DEFAULT NULL,
  `logo` varchar(255) DEFAULT NULL,
  `activeBranchId` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `store_info`
--

LOCK TABLES `store_info` WRITE;
/*!40000 ALTER TABLE `store_info` DISABLE KEYS */;
INSERT INTO `store_info` VALUES (1,'MediWorld Phar','ST001','info@techworld.lk','Mobile Shop','logo_1757312102177.jpg',1);
/*!40000 ALTER TABLE `store_info` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `supplier_payments`
--

DROP TABLE IF EXISTS `supplier_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `supplier_payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `supplier_name` varchar(255) NOT NULL,
  `supplier_phone` varchar(50) DEFAULT NULL,
  `amount` decimal(12,2) NOT NULL,
  `method` varchar(50) NOT NULL,
  `date` date NOT NULL,
  `status` varchar(50) DEFAULT 'Pending',
  `branch_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `balance` decimal(12,2) DEFAULT '0.00',
  `total_due` decimal(12,2) DEFAULT '0.00',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `supplier_payments`
--

LOCK TABLES `supplier_payments` WRITE;
/*!40000 ALTER TABLE `supplier_payments` DISABLE KEYS */;
INSERT INTO `supplier_payments` VALUES (1,'derdtfg','09876543234567',20000.00,'cash','2025-08-31','Pending',1,'2025-09-01 04:03:39',0.00,1000.00);
/*!40000 ALTER TABLE `supplier_payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `suppliers`
--

DROP TABLE IF EXISTS `suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `suppliers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'Active',
  `branch_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suppliers`
--

LOCK TABLES `suppliers` WRITE;
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
INSERT INTO `suppliers` VALUES (1,'Sagiiii','Galle, Sri Lanka','sayanthavitrmaa@gmail.com','0763650198','Active',1,'2025-08-29 10:12:57');
/*!40000 ALTER TABLE `suppliers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `branch_id` json NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'1','Role1','$2b$10$Ee04JQo8WcfT7lTu9ObrGe4Sp0rkX23nqvx924azpWwU1DFLegqam',1),(2,'[2]','User2','$2b$10$FSb4FmgpDSmeIxYwhdkMGOkf7VHPLy9azhk971drtRrbuKX01IssG',5),(3,'[1]','User4','$2b$10$dE8DbuhpszBXWjwvJx7Tze0F7veFmCztQVQ.LdPYfDFXcxGD5bJD6',6),(4,'3','User5','$2b$10$skoJ93LnkWDVUFGD06QL/uhyQLu.2FyK4YCu3UNoEmOu9ItV/Uvf.',5),(5,'null','User6','$2b$10$7euO92ZBTUe9VL9oH62eSuecj4.Y2I1YXSU7bNQ4SgfTYPUzooN1y',7),(6,'4','User7','$2b$10$VzFrBmzM0lbkb99ZVhropePxQj0vWw1qREcYWt/62YLjtjvZBx/PW',5),(7,'null','User8','$2b$10$bEWZYebZ.NicD6kB4YdQLOBdE1TY/5afvDGTrF6Ph8vPMU957/w2u',8),(11,'1','User9','$2b$10$dayJsecM57.FYI1yXGJ2i.nxl95.XBR.w53UNDvSosiQLrn.dJjmG',10);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `variant_options`
--

DROP TABLE IF EXISTS `variant_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `variant_options` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `price_adjustment` decimal(10,2) DEFAULT '0.00',
  `variant_type_id` int NOT NULL,
  `branch_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `variant_type_id` (`variant_type_id`),
  CONSTRAINT `variant_options_ibfk_1` FOREIGN KEY (`variant_type_id`) REFERENCES `variant_types` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `variant_options`
--

LOCK TABLES `variant_options` WRITE;
/*!40000 ALTER TABLE `variant_options` DISABLE KEYS */;
INSERT INTO `variant_options` VALUES (1,'100mg',0.00,1,1),(2,'250mg',20.00,1,1),(3,'500mg',40.00,1,1),(4,'10 Tablets',0.00,2,1),(5,'30 Tablets',50.00,2,1),(6,'60 Tablets',90.00,2,1),(7,'Tablet',0.00,3,2),(8,'Syrup',30.00,3,2),(9,'Injection',100.00,3,2),(10,'Orange Flavor',0.00,4,2),(11,'Mint Flavor',10.00,4,2),(12,'5mg',0.00,5,3),(13,'10mg',25.00,5,3),(14,'20mg',50.00,5,3),(15,'efgh',0.00,6,1),(16,'ijk',0.00,6,1),(17,'pqr',0.00,6,1);
/*!40000 ALTER TABLE `variant_options` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `variant_types`
--

DROP TABLE IF EXISTS `variant_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `variant_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `branch_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_type_branch` (`name`,`branch_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `variant_types`
--

LOCK TABLES `variant_types` WRITE;
/*!40000 ALTER TABLE `variant_types` DISABLE KEYS */;
INSERT INTO `variant_types` VALUES (6,'Abcde',1),(1,'Dosage',1),(4,'Flavor',2),(3,'Form',2),(2,'Pack Size',1),(5,'Strength',3);
/*!40000 ALTER TABLE `variant_types` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-02  9:21:13
