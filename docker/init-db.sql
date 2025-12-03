-- OnlyCats Database Initialization Script

-- ========================================
-- Users Table
-- ========================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('individual', 'shelter', 'breeder')),
    phone VARCHAR(50),
    address TEXT,
    
    -- Verification status
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    verified BOOLEAN DEFAULT FALSE,
    
    -- Documents
    documents JSONB DEFAULT '[]'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- Cats Table
-- ========================================
CREATE TABLE IF NOT EXISTS cats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Basic Info
    name VARCHAR(255) NOT NULL,
    breed VARCHAR(100),
    age_years INTEGER,
    age_months INTEGER,
    gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'unknown')),
    color VARCHAR(100),
    
    -- Description
    description TEXT,
    personality TEXT,
    health_info TEXT,
    
    -- Location
    location VARCHAR(255),
    prefecture VARCHAR(100),
    city VARCHAR(100),
    
    -- Status
    status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'pending', 'adopted', 'unavailable')),
    
    -- Images
    images JSONB DEFAULT '[]'::jsonb,
    thumbnail VARCHAR(500),
    
    -- Metadata
    view_count INTEGER DEFAULT 0,
    favorite_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- Pets Table
-- ========================================
CREATE TABLE IF NOT EXISTS pets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Basic Info
    name VARCHAR(255) NOT NULL,
    species VARCHAR(50) DEFAULT 'cat' CHECK (species IN ('cat', 'dog', 'other')),
    breed VARCHAR(100),
    age_years INTEGER,
    age_months INTEGER,
    gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'unknown')),
    size VARCHAR(20) CHECK (size IN ('small', 'medium', 'large')),
    color VARCHAR(100),

    -- Description
    description TEXT,
    personality TEXT,
    health_info TEXT,

    -- Location
    location VARCHAR(255),
    prefecture VARCHAR(100),
    city VARCHAR(100),

    -- Status
    status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'pending', 'adopted', 'unavailable')),

    -- Images
    images TEXT[] DEFAULT '{}',
    thumbnail VARCHAR(500),

    -- Adoption Fee
    adoption_fee INTEGER DEFAULT 0,

    -- Metadata
    view_count INTEGER DEFAULT 0,
    favorite_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- Inquiries Table
-- ========================================
CREATE TABLE IF NOT EXISTS inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    adopter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shelter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Inquiry Details
    message TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(pet_id, adopter_id)
);

-- ========================================
-- Messages Table
-- ========================================
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inquiry_id UUID NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    content TEXT NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- Notifications Table
-- ========================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    data JSONB DEFAULT '{}'::jsonb,

    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- Reviews Table
-- ========================================
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewed_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    inquiry_id UUID REFERENCES inquiries(id) ON DELETE SET NULL,

    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(reviewer_id, reviewed_id, inquiry_id)
);

-- ========================================
-- Applications Table
-- ========================================
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cat_id UUID NOT NULL REFERENCES cats(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Application Details
    message TEXT,
    housing_type VARCHAR(100),
    has_experience BOOLEAN,
    other_pets TEXT,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(cat_id, user_id)
);

-- ========================================
-- Favorites Table
-- ========================================
CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cat_id UUID NOT NULL REFERENCES cats(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, cat_id)
);

-- ========================================
-- Posts Table (SNS)
-- ========================================
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cat_id UUID REFERENCES cats(id) ON DELETE SET NULL,
    
    -- Content
    content TEXT NOT NULL,
    images JSONB DEFAULT '[]'::jsonb,
    
    -- Engagement
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- Comments Table
-- ========================================
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    content TEXT NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- Likes Table
-- ========================================
CREATE TABLE IF NOT EXISTS likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(post_id, user_id)
);

-- ========================================
-- Indexes for Performance
-- ========================================

-- Users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_type ON users(type);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Cats
CREATE INDEX IF NOT EXISTS idx_cats_owner_id ON cats(owner_id);
CREATE INDEX IF NOT EXISTS idx_cats_status ON cats(status);
CREATE INDEX IF NOT EXISTS idx_cats_breed ON cats(breed);
CREATE INDEX IF NOT EXISTS idx_cats_location ON cats(prefecture, city);
CREATE INDEX IF NOT EXISTS idx_cats_created_at ON cats(created_at DESC);

-- Applications
CREATE INDEX IF NOT EXISTS idx_applications_cat_id ON applications(cat_id);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

-- Favorites
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_cat_id ON favorites(cat_id);

-- Posts
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_cat_id ON posts(cat_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

-- Comments
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);

-- Likes
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);

-- Pets
CREATE INDEX IF NOT EXISTS idx_pets_owner_id ON pets(owner_id);
CREATE INDEX IF NOT EXISTS idx_pets_status ON pets(status);
CREATE INDEX IF NOT EXISTS idx_pets_species ON pets(species);
CREATE INDEX IF NOT EXISTS idx_pets_breed ON pets(breed);
CREATE INDEX IF NOT EXISTS idx_pets_location ON pets(prefecture, city);
CREATE INDEX IF NOT EXISTS idx_pets_created_at ON pets(created_at DESC);

-- Inquiries
CREATE INDEX IF NOT EXISTS idx_inquiries_pet_id ON inquiries(pet_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_adopter_id ON inquiries(adopter_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_shelter_id ON inquiries(shelter_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);

-- Messages
CREATE INDEX IF NOT EXISTS idx_messages_inquiry_id ON messages(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Reviews
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed_id ON reviews(reviewed_id);
CREATE INDEX IF NOT EXISTS idx_reviews_inquiry_id ON reviews(inquiry_id);

-- ========================================
-- Updated_at Trigger Function
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cats_updated_at BEFORE UPDATE ON cats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- Sample Data (Development Only)
-- ========================================

-- Insert sample users (password: "password123")
-- Password hash generated with bcrypt
INSERT INTO users (email, password_hash, name, type, status, verified, phone, address) VALUES
('john@example.com', '$2a$10$YourBcryptHashHere', 'John Doe', 'individual', 'approved', true, '090-1234-5678', '東京都渋谷区'),
('shelter@example.com', '$2a$10$YourBcryptHashHere', 'Tokyo Cat Shelter', 'shelter', 'approved', true, '03-1234-5678', '東京都新宿区'),
('breeder@example.com', '$2a$10$YourBcryptHashHere', 'Premium Cat Breeder', 'breeder', 'approved', true, '06-1234-5678', '大阪府大阪市')
ON CONFLICT (email) DO NOTHING;

-- Note: In production, remove sample data and let users register properly
