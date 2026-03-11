-- Create notification_templates table
CREATE TABLE IF NOT EXISTS notification_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type ENUM('SMS', 'WhatsApp') NOT NULL,
    trigger_event VARCHAR(100) NOT NULL,
    template_text TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_trigger (trigger_event, type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert some default templates
INSERT INTO notification_templates (name, type, trigger_event, template_text, is_active) VALUES
('EMI Reminder', 'SMS', 'EMI_DUE', 'Dear {name}, your EMI of LKR {amount} for order #{order_id} is due on {due_date}. Please make the payment to avoid late fees.', TRUE),
('Warranty Expiry', 'WhatsApp', 'WARRANTY_EXPIRY', 'Hello {name}, the warranty for your {product} (Order #{order_id}) will expire on {expiry_date}. Contact us for an extension!', TRUE),
('Service Update', 'SMS', 'SERVICE_UPDATE', 'Dear {name}, your service request #{service_id} has been updated to: {status}. {additional_notes}', TRUE),
('Birthday Greeting', 'WhatsApp', 'BIRTHDAY_GREETING', '🎉 Happy Birthday, {name}! 🎂 Enjoy a special {discount}% off on your next purchase with us! Use code: BDAY{year}', TRUE),
('Promotional Offer', 'SMS', 'PROMOTION', 'Hi {name}! {offer_details} Visit us today! Reply STOP to unsubscribe.', TRUE);
