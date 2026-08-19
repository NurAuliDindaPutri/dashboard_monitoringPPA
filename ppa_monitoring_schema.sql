-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Aug 19, 2026 at 02:58 AM
-- Server version: 8.0.30
-- PHP Version: 8.3.32

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `ppa_monitoring`
--

-- --------------------------------------------------------

--
-- Table structure for table `monthly_kpi_summary`
--

CREATE TABLE `monthly_kpi_summary` (
  `id` int UNSIGNED NOT NULL,
  `site_id` int UNSIGNED NOT NULL,
  `period_year` smallint UNSIGNED NOT NULL,
  `period_month` tinyint UNSIGNED NOT NULL,
  `readyness_actual` decimal(6,4) DEFAULT NULL,
  `readyness_target` decimal(6,4) DEFAULT NULL,
  `availability_actual` decimal(6,4) DEFAULT NULL,
  `availability_target` decimal(6,4) DEFAULT NULL,
  `leadtime_actual` decimal(6,4) DEFAULT NULL,
  `leadtime_target` decimal(6,4) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ;

-- --------------------------------------------------------

--
-- Table structure for table `monthly_unit_performance`
--

CREATE TABLE `monthly_unit_performance` (
  `id` int UNSIGNED NOT NULL,
  `unit_model_id` int UNSIGNED NOT NULL,
  `period_year` smallint UNSIGNED NOT NULL,
  `period_month` tinyint UNSIGNED NOT NULL,
  `physical_availability` decimal(6,4) DEFAULT NULL,
  `unit_availability` decimal(6,4) DEFAULT NULL,
  `mtbf` decimal(10,2) DEFAULT NULL,
  `mttr` decimal(10,2) DEFAULT NULL,
  `productivity` decimal(12,2) DEFAULT NULL,
  `fuel_consumption` decimal(12,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ;

-- --------------------------------------------------------

--
-- Table structure for table `pending_supply`
--

CREATE TABLE `pending_supply` (
  `id` int UNSIGNED NOT NULL,
  `site_id` int UNSIGNED NOT NULL,
  `parts_number` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `qty` int UNSIGNED NOT NULL DEFAULT '0',
  `no_po` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `eta` date DEFAULT NULL,
  `remarks` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `no_po_identity` varchar(100) COLLATE utf8mb4_unicode_ci GENERATED ALWAYS AS (coalesce(nullif(upper(trim(`no_po`)),_utf8mb4''),_utf8mb4'__NO_PO__')) STORED INVISIBLE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sites`
--

CREATE TABLE `sites` (
  `id` int UNSIGNED NOT NULL,
  `site_code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `site_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `unit_models`
--

CREATE TABLE `unit_models` (
  `id` int UNSIGNED NOT NULL,
  `site_id` int UNSIGNED NOT NULL,
  `model_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `monthly_kpi_summary`
--
ALTER TABLE `monthly_kpi_summary`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_monthly_kpi_site_period` (`site_id`,`period_year`,`period_month`),
  ADD KEY `idx_monthly_kpi_period_site` (`period_year`,`period_month`,`site_id`);

--
-- Indexes for table `monthly_unit_performance`
--
ALTER TABLE `monthly_unit_performance`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_unit_perf_model_period` (`unit_model_id`,`period_year`,`period_month`),
  ADD KEY `idx_unit_perf_period_model` (`period_year`,`period_month`,`unit_model_id`);

--
-- Indexes for table `pending_supply`
--
ALTER TABLE `pending_supply`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_pending_supply_identity` (`site_id`,`parts_number`,`no_po_identity`),
  ADD KEY `idx_pending_supply_site` (`site_id`);

--
-- Indexes for table `sites`
--
ALTER TABLE `sites`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_sites_site_code` (`site_code`);

--
-- Indexes for table `unit_models`
--
ALTER TABLE `unit_models`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_unit_models_site_model` (`site_id`,`model_name`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `monthly_kpi_summary`
--
ALTER TABLE `monthly_kpi_summary`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `monthly_unit_performance`
--
ALTER TABLE `monthly_unit_performance`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pending_supply`
--
ALTER TABLE `pending_supply`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sites`
--
ALTER TABLE `sites`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `unit_models`
--
ALTER TABLE `unit_models`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `monthly_kpi_summary`
--
ALTER TABLE `monthly_kpi_summary`
  ADD CONSTRAINT `fk_monthly_kpi_site` FOREIGN KEY (`site_id`) REFERENCES `sites` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `monthly_unit_performance`
--
ALTER TABLE `monthly_unit_performance`
  ADD CONSTRAINT `fk_unit_perf_model` FOREIGN KEY (`unit_model_id`) REFERENCES `unit_models` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `pending_supply`
--
ALTER TABLE `pending_supply`
  ADD CONSTRAINT `fk_pending_supply_site` FOREIGN KEY (`site_id`) REFERENCES `sites` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `unit_models`
--
ALTER TABLE `unit_models`
  ADD CONSTRAINT `fk_unit_models_site` FOREIGN KEY (`site_id`) REFERENCES `sites` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Check constraints for table `monthly_kpi_summary`
--
ALTER TABLE `monthly_kpi_summary`
  ADD CONSTRAINT `chk_monthly_kpi_year`
    CHECK (`period_year` BETWEEN 2000 AND 2100),
  ADD CONSTRAINT `chk_monthly_kpi_month`
    CHECK (`period_month` BETWEEN 1 AND 12),
  ADD CONSTRAINT `chk_monthly_kpi_readyness_actual`
    CHECK (`readyness_actual` IS NULL OR `readyness_actual` BETWEEN 0 AND 1),
  ADD CONSTRAINT `chk_monthly_kpi_readyness_target`
    CHECK (`readyness_target` IS NULL OR `readyness_target` BETWEEN 0 AND 1),
  ADD CONSTRAINT `chk_monthly_kpi_availability_actual`
    CHECK (`availability_actual` IS NULL OR `availability_actual` BETWEEN 0 AND 1),
  ADD CONSTRAINT `chk_monthly_kpi_availability_target`
    CHECK (`availability_target` IS NULL OR `availability_target` BETWEEN 0 AND 1),
  ADD CONSTRAINT `chk_monthly_kpi_leadtime_actual`
    CHECK (`leadtime_actual` IS NULL OR `leadtime_actual` BETWEEN 0 AND 1),
  ADD CONSTRAINT `chk_monthly_kpi_leadtime_target`
    CHECK (`leadtime_target` IS NULL OR `leadtime_target` BETWEEN 0 AND 1);

--
-- Check constraints for table `monthly_unit_performance`
--
ALTER TABLE `monthly_unit_performance`
  ADD CONSTRAINT `chk_unit_perf_year`
    CHECK (`period_year` BETWEEN 2000 AND 2100),
  ADD CONSTRAINT `chk_unit_perf_month`
    CHECK (`period_month` BETWEEN 1 AND 12),
  ADD CONSTRAINT `chk_unit_perf_pa`
    CHECK (`physical_availability` IS NULL OR `physical_availability` BETWEEN 0 AND 1),
  ADD CONSTRAINT `chk_unit_perf_ua`
    CHECK (`unit_availability` IS NULL OR `unit_availability` BETWEEN -1 AND 1),
  ADD CONSTRAINT `chk_unit_perf_mtbf`
    CHECK (`mtbf` IS NULL OR `mtbf` >= 0),
  ADD CONSTRAINT `chk_unit_perf_mttr`
    CHECK (`mttr` IS NULL OR `mttr` >= 0),
  ADD CONSTRAINT `chk_unit_perf_productivity`
    CHECK (`productivity` IS NULL OR `productivity` >= 0),
  ADD CONSTRAINT `chk_unit_perf_fuel`
    CHECK (`fuel_consumption` IS NULL OR `fuel_consumption` >= 0);

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
