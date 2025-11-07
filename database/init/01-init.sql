-- Initialize the monolith database
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable timestamptz for better timestamp handling
SET timezone = 'UTC';

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    address TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    purchase_price DECIMAL(10,2),
    sales_price DECIMAL(10,2),
    stock INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_transactions_order_id ON transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

-- Insert some sample data
INSERT INTO clients (id, name, email, address) VALUES 
    ('550e8400-e29b-41d4-a716-446655440001', 'John Doe', 'john.doe@example.com', '123 Main St, Anytown, USA'),
    ('550e8400-e29b-41d4-a716-446655440002', 'Jane Smith', 'jane.smith@example.com', '456 Oak Ave, Somewhere, USA')
ON CONFLICT (email) DO NOTHING;

INSERT INTO products (id, name, description, purchase_price, sales_price, stock) VALUES 
    ('660e8400-e29b-41d4-a716-446655440001', 'Laptop Pro', 'High-performance laptop for professionals', 800.00, 1200.00, 50),
    ('660e8400-e29b-41d4-a716-446655440002', 'Wireless Mouse', 'Ergonomic wireless mouse with precision tracking', 25.00, 45.00, 200),
    ('660e8400-e29b-41d4-a716-446655440003', 'Mechanical Keyboard', 'RGB backlit mechanical keyboard', 80.00, 120.00, 75)
ON CONFLICT (id) DO NOTHING;