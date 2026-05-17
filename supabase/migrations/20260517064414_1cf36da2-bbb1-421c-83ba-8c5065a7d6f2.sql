
-- Create demo auth users (idempotent)
DO $$
DECLARE
  u RECORD;
BEGIN
  FOR u IN
    SELECT * FROM (VALUES
      ('11111111-1111-1111-1111-111111111101'::uuid, 'aarav.donor@demo.foodconnect.app'),
      ('11111111-1111-1111-1111-111111111102'::uuid, 'priya.donor@demo.foodconnect.app'),
      ('11111111-1111-1111-1111-111111111103'::uuid, 'rohan.donor@demo.foodconnect.app'),
      ('22222222-2222-2222-2222-222222222201'::uuid, 'meera.ngo@demo.foodconnect.app'),
      ('22222222-2222-2222-2222-222222222202'::uuid, 'karthik.ngo@demo.foodconnect.app'),
      ('22222222-2222-2222-2222-222222222203'::uuid, 'saanvi.ngo@demo.foodconnect.app'),
      ('22222222-2222-2222-2222-222222222204'::uuid, 'imran.ngo@demo.foodconnect.app'),
      ('33333333-3333-3333-3333-333333333301'::uuid, 'ananya.vol@demo.foodconnect.app'),
      ('33333333-3333-3333-3333-333333333302'::uuid, 'vikram.vol@demo.foodconnect.app'),
      ('33333333-3333-3333-3333-333333333303'::uuid, 'neha.vol@demo.foodconnect.app'),
      ('33333333-3333-3333-3333-333333333304'::uuid, 'aditya.vol@demo.foodconnect.app')
    ) AS t(id, email)
  LOOP
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = u.id) THEN
      INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password,
        email_confirmed_at, created_at, updated_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, is_sso_user
      ) VALUES (
        u.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
        u.email, crypt('demo-password-123', gen_salt('bf')),
        now(), now(), now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{}'::jsonb, false, false
      );
      INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
      VALUES (gen_random_uuid(), u.id, jsonb_build_object('sub', u.id::text, 'email', u.email), 'email', u.id::text, now(), now(), now());
    END IF;
  END LOOP;
END $$;

-- Upsert profiles
INSERT INTO public.profiles (id, name, org_name, avatar_url, is_verified, bio, address, phone) VALUES
  ('11111111-1111-1111-1111-111111111101', 'Aarav Sharma', NULL, 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200&h=200&fit=crop', true, 'Cafe owner donating daily surplus', 'MG Road, Bengaluru', '+91 90000 11101'),
  ('11111111-1111-1111-1111-111111111102', 'Priya Nair', NULL, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop', true, 'Home baker', 'Indiranagar, Bengaluru', '+91 90000 11102'),
  ('11111111-1111-1111-1111-111111111103', 'Rohan Verma', NULL, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop', true, 'Restaurant manager', 'Koramangala, Bengaluru', '+91 90000 11103'),
  ('22222222-2222-2222-2222-222222222201', 'Meera Iyer', 'Helping Hands Foundation', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop', true, 'Serving 200+ meals daily', 'Jayanagar, Bengaluru', '+91 90000 22201'),
  ('22222222-2222-2222-2222-222222222202', 'Karthik Rao', 'Annapurna Trust', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop', true, 'Food rescue & redistribution', 'Whitefield, Bengaluru', '+91 90000 22202'),
  ('22222222-2222-2222-2222-222222222203', 'Saanvi Patel', 'Books for Bharat', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop', true, 'Libraries for rural schools', 'HSR Layout, Bengaluru', '+91 90000 22203'),
  ('22222222-2222-2222-2222-222222222204', 'Imran Khan', 'Care & Cure Society', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop', true, 'Free clinics across slums', 'BTM Layout, Bengaluru', '+91 90000 22204'),
  ('33333333-3333-3333-3333-333333333301', 'Ananya Reddy', NULL, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop', true, 'Weekend rescue rider', 'JP Nagar, Bengaluru', '+91 90000 33301'),
  ('33333333-3333-3333-3333-333333333302', 'Vikram Singh', NULL, 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200&h=200&fit=crop', true, 'College student, evenings free', 'Marathahalli, Bengaluru', '+91 90000 33302'),
  ('33333333-3333-3333-3333-333333333303', 'Neha Gupta', NULL, 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=200&h=200&fit=crop', true, 'Has a small van for bulk pickups', 'Hebbal, Bengaluru', '+91 90000 33303'),
  ('33333333-3333-3333-3333-333333333304', 'Aditya Menon', NULL, 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=200&h=200&fit=crop', true, 'Daily commuter, cycle pickups', 'Banashankari, Bengaluru', '+91 90000 33304')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, org_name = EXCLUDED.org_name, avatar_url = EXCLUDED.avatar_url,
  is_verified = EXCLUDED.is_verified, bio = EXCLUDED.bio, address = EXCLUDED.address, phone = EXCLUDED.phone;

-- Roles
INSERT INTO public.user_roles (user_id, role) VALUES
  ('11111111-1111-1111-1111-111111111101', 'donor'),
  ('11111111-1111-1111-1111-111111111102', 'donor'),
  ('11111111-1111-1111-1111-111111111103', 'donor'),
  ('22222222-2222-2222-2222-222222222201', 'ngo'),
  ('22222222-2222-2222-2222-222222222202', 'ngo'),
  ('22222222-2222-2222-2222-222222222203', 'ngo'),
  ('22222222-2222-2222-2222-222222222204', 'ngo'),
  ('33333333-3333-3333-3333-333333333301', 'volunteer'),
  ('33333333-3333-3333-3333-333333333302', 'volunteer'),
  ('33333333-3333-3333-3333-333333333303', 'volunteer'),
  ('33333333-3333-3333-3333-333333333304', 'volunteer')
ON CONFLICT (user_id, role) DO NOTHING;

-- Donations
INSERT INTO public.donations (id, donor_id, title, category, description, quantity, pickup_address, status, images, expiry_date, created_at) VALUES
  ('aaaaaaa1-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111101', 'Fresh sandwiches & pastries', 'food', 'End-of-day cafe surplus, vegetarian.', '40 servings', 'MG Road, Bengaluru', 'available', ARRAY['https://images.unsplash.com/photo-1481070555726-e2fe8357725c?w=600'], now() + interval '6 hours', now() - interval '20 minutes'),
  ('aaaaaaa1-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111102', 'Home-baked bread loaves', 'food', 'Fresh today, sourdough & multigrain.', '15 loaves', 'Indiranagar, Bengaluru', 'available', ARRAY['https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600'], now() + interval '1 day', now() - interval '1 hour'),
  ('aaaaaaa1-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111103', 'Cooked rice & curry trays', 'food', 'Hot meals from restaurant lunch service.', '60 servings', 'Koramangala, Bengaluru', 'available', ARRAY['https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600'], now() + interval '4 hours', now() - interval '2 hours'),
  ('aaaaaaa1-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111101', 'Winter jackets', 'clothes', 'Lightly used adult jackets, washed.', '25 pieces', 'MG Road, Bengaluru', 'available', ARRAY['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600'], NULL, now() - interval '3 hours'),
  ('aaaaaaa1-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111102', 'School textbooks (grade 6-8)', 'books', 'NCERT set, good condition.', '3 boxes', 'Indiranagar, Bengaluru', 'claimed', ARRAY['https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600'], NULL, now() - interval '1 day'),
  ('aaaaaaa1-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111103', 'Unopened paracetamol & ORS', 'medicines', 'OTC, sealed, expiry 2027.', '50 strips', 'Koramangala, Bengaluru', 'in_transit', ARRAY['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600'], now() + interval '300 days', now() - interval '2 days'),
  ('aaaaaaa1-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111101', 'Children''s storybooks', 'books', 'Picture books, English & Kannada.', '40 books', 'MG Road, Bengaluru', 'completed', ARRAY['https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600'], NULL, now() - interval '5 days'),
  ('aaaaaaa1-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111102', 'Kids'' clothes bundle', 'clothes', 'Ages 4-10, sorted & folded.', '60 pieces', 'Indiranagar, Bengaluru', 'available', ARRAY['https://images.unsplash.com/photo-1519689680058-324335c77eba?w=600'], NULL, now() - interval '5 hours')
ON CONFLICT (id) DO NOTHING;

-- Claims
INSERT INTO public.claims (id, donation_id, ngo_id, volunteer_id, status, claimed_at, completed_at) VALUES
  ('bbbbbbb1-0000-0000-0000-000000000001', 'aaaaaaa1-0000-0000-0000-000000000005', '22222222-2222-2222-2222-222222222203', NULL, 'claimed', now() - interval '20 hours', NULL),
  ('bbbbbbb1-0000-0000-0000-000000000002', 'aaaaaaa1-0000-0000-0000-000000000006', '22222222-2222-2222-2222-222222222204', '33333333-3333-3333-3333-333333333301', 'in_transit', now() - interval '1 day', NULL),
  ('bbbbbbb1-0000-0000-0000-000000000003', 'aaaaaaa1-0000-0000-0000-000000000007', '22222222-2222-2222-2222-222222222203', '33333333-3333-3333-3333-333333333302', 'completed', now() - interval '4 days', now() - interval '3 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.impact_logs (donation_id, category, quantity, donor_id, ngo_id, volunteer_id)
VALUES ('aaaaaaa1-0000-0000-0000-000000000007', 'books', '40 books',
        '11111111-1111-1111-1111-111111111101',
        '22222222-2222-2222-2222-222222222203',
        '33333333-3333-3333-3333-333333333302');
