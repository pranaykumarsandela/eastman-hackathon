-- SmartCart Demo Data Seed Migration
-- Migration: 002_seed_demo_data.sql

-- 1. Insert Realistic Demo Products across Electronics, Fashion, Home, Accessories
INSERT INTO products (name, description, price, category, image_url, stock_quantity, rating, is_active)
VALUES
    (
        'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
        'Industry-leading active noise cancellation with 2 processors, 8 microphones, 30 hours battery life, and crystal clear hands-free calling.',
        24990.00,
        'Electronics',
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
        25,
        4.8,
        TRUE
    ),
    (
        'Apple iPad 10th Gen (10.9-inch, Wi-Fi, 64GB - Blue)',
        'Striking 10.9-inch Liquid Retina display, A14 Bionic chip, 12MP Ultra Wide front camera with Center Stage, and USB-C connectivity.',
        34900.00,
        'Electronics',
        'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&auto=format&fit=crop&q=80',
        18,
        4.7,
        TRUE
    ),
    (
        'Logitech MX Master 3S Wireless Performance Mouse',
        'Quiet clicks and 8K DPI track-on-glass sensor. Ergonomic contour with electromagnetic MagSpeed scrolling wheel.',
        8995.00,
        'Electronics',
        'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&auto=format&fit=crop&q=80',
        40,
        4.9,
        TRUE
    ),
    (
        'Keychron K2 Pro Wireless Mechanical Keyboard',
        'QMK/VIA wireless custom mechanical keyboard with hot-swappable tactile switches, RGB backlighting, and Mac/Windows layout support.',
        9499.00,
        'Electronics',
        'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80',
        30,
        4.6,
        TRUE
    ),
    (
        'Samsung 27-inch 4K UHD IPS Smart Monitor (M7)',
        'Stream OTT entertainment, work PC-less with Microsoft 365, USB-C 65W charging, HDR10, and built-in IoT hub with remote control.',
        27999.00,
        'Electronics',
        'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=80',
        12,
        4.5,
        TRUE
    ),
    (
        'Premium Heavyweight Cotton Oversized Hoodie',
        'Crafted from 450 GSM organic French terry cotton. Drop shoulder aesthetic, pre-shrunk fabric, and ribbed hems for all-day comfort.',
        2499.00,
        'Fashion',
        'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80',
        50,
        4.6,
        TRUE
    ),
    (
        'Levi''s Men''s 511 Slim Fit Stretch Denim Jeans',
        'Classic modern slim fit with room to move. Made with Water<Less technology and premium stretch denim for durable flexibility.',
        3199.00,
        'Fashion',
        'https://images.unsplash.com/photo-1542272604-780c96856592?w=600&auto=format&fit=crop&q=80',
        35,
        4.4,
        TRUE
    ),
    (
        'Nike Air Max 270 React Running Shoes',
        'Iconic Max Air heel unit provides responsive cushioning. Breathable mesh upper with lightweight seamless overlays.',
        10495.00,
        'Fashion',
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
        22,
        4.7,
        TRUE
    ),
    (
        'Full Grain Handcrafted Italian Leather Messenger Bag',
        'Vegetable-tanned calfskin leather with brass hardware. Padded 15.6-inch laptop compartment and adjustable shoulder strap.',
        6499.00,
        'Accessories',
        'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
        15,
        4.8,
        TRUE
    ),
    (
        'Ray-Ban Classic Polarized Aviator Sunglasses',
        'Timeless gold metal frame with polarized green classic G-15 crystal lenses offering 100% UV protection and high clarity.',
        7890.00,
        'Accessories',
        'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&auto=format&fit=crop&q=80',
        28,
        4.6,
        TRUE
    ),
    (
        'Nespresso Vertuo Pop Espresso Coffee Machine',
        'Centrifusion technology brews 5 cup sizes with velvety crema at the touch of a single button. Compact, vibrant modern design.',
        14999.00,
        'Home',
        'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=600&auto=format&fit=crop&q=80',
        14,
        4.7,
        TRUE
    ),
    (
        'Ergonomic High-Back Mesh Executive Desk Chair',
        'Adaptive lumbar support, 3D adjustable armrests, breathable dual-layer mesh, and 135-degree recline with tilt tension lock.',
        12499.00,
        'Home',
        'https://images.unsplash.com/photo-1580481077195-c22ae242634e?w=600&auto=format&fit=crop&q=80',
        20,
        4.5,
        TRUE
    ),
    (
        'Minimalist Matte Black Ceramic Pour-Over Kettle & Mug Set',
        'Gooseneck temperature-control kettle with double-walled insulated matching ceramic mugs. Barista-grade precision pour.',
        3299.00,
        'Home',
        'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
        30,
        4.8,
        TRUE
    ),
    (
        'Fossil Men''s Minimalist Chronograph Watch (Smoke Stainless Steel)',
        '44mm stainless steel case with quartz chronograph movement, sub-dials, water resistant up to 50m, and interchangeable bracelet.',
        9995.00,
        'Accessories',
        'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&auto=format&fit=crop&q=80',
        16,
        4.7,
        TRUE
    ),
    (
        'Anker 737 Power Bank (PowerCore 24K, 140W)',
        'Ultra-powerful two-way fast charging with smart digital display, GaNPrime technology, and charges 3 devices simultaneously.',
        11999.00,
        'Electronics',
        'https://images.unsplash.com/photo-1609592426861-46487e4c9c1c?w=600&auto=format&fit=crop&q=80',
        25,
        4.9,
        TRUE
    )
ON CONFLICT DO NOTHING;

-- 2. Insert Coupons (including SAVE10, FLAT100, SMART20, and test cases)
INSERT INTO coupons (code, discount_type, discount_value, minimum_order_value, maximum_discount, expiry_date, is_active, usage_limit, usage_count)
VALUES
    (
        'SAVE10',
        'PERCENTAGE',
        10.00,
        500.00,
        250.00,
        NOW() + INTERVAL '90 days',
        TRUE,
        1000,
        14
    ),
    (
        'FLAT100',
        'FIXED',
        100.00,
        999.00,
        NULL,
        NOW() + INTERVAL '90 days',
        TRUE,
        500,
        42
    ),
    (
        'SMART20',
        'PERCENTAGE',
        20.00,
        1999.00,
        1000.00,
        NOW() + INTERVAL '60 days',
        TRUE,
        250,
        78
    ),
    (
        'FESTIVE500',
        'FIXED',
        500.00,
        4999.00,
        NULL,
        NOW() + INTERVAL '45 days',
        TRUE,
        100,
        9
    ),
    (
        'WELCOME50',
        'FIXED',
        50.00,
        299.00,
        NULL,
        NOW() + INTERVAL '120 days',
        TRUE,
        2000,
        132
    ),
    (
        'EXPIRED10',
        'PERCENTAGE',
        10.00,
        200.00,
        100.00,
        NOW() - INTERVAL '10 days',
        TRUE,
        100,
        100
    ),
    (
        'INACTIVE25',
        'PERCENTAGE',
        25.00,
        1000.00,
        500.00,
        NOW() + INTERVAL '30 days',
        FALSE,
        50,
        0
    )
ON CONFLICT (code) DO NOTHING;
