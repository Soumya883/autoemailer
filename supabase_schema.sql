-- Supabase Schema for Autoemailer

-- Senders Table
CREATE TABLE senders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    app_password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Queue Table
CREATE TABLE queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_email VARCHAR(255) NOT NULL,
    sender_email VARCHAR(255) NOT NULL REFERENCES senders(email),
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'failed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast queue querying
CREATE INDEX idx_queue_status ON queue(status) WHERE status = 'pending';
