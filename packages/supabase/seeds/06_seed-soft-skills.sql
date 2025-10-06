-- =========================================================
-- Soft Skills Seed Data
-- Comprehensive soft skills taxonomy for construction industry
-- Moved from migration 047_seed_soft_skills.sql
-- =========================================================

begin;

-- =========================
-- Reliability Category
-- =========================
insert into public.soft_skills (category, name, description, order_index) values
  ('reliability', 'Deadline management', 'Consistently meets project timelines and schedules', 1),
  ('reliability', 'Task delegation', 'Effectively distributes work among team members', 2),
  ('reliability', 'Prioritization', 'Manages multiple responsibilities efficiently', 3),
  ('reliability', 'Planning & scheduling', 'Organizes work effectively and plans ahead', 4),
  ('reliability', 'Focus & attention', 'Maintains concentration on tasks', 5),
  ('reliability', 'Multitasking', 'Handles multiple tasks simultaneously', 6),
  ('reliability', 'Attendance', 'Shows up consistently and on time', 7),
  ('reliability', 'Follow-through', 'Completes commitments and follows up', 8),
  ('reliability', 'Time management', 'Manages time effectively to meet deadlines', 9),
  ('reliability', 'Consistency', 'Delivers reliable and predictable results', 10)
on conflict (category, name) do nothing;

-- =========================
-- Collaboration Category
-- =========================
insert into public.soft_skills (category, name, description, order_index) values
  ('collaboration', 'Teamwork', 'Works effectively with others toward common goals', 1),
  ('collaboration', 'Communication', 'Communicates clearly in verbal and written forms', 2),
  ('collaboration', 'Conflict resolution', 'Handles disagreements professionally', 3),
  ('collaboration', 'Adaptability', 'Adjusts to changing conditions and requirements', 4),
  ('collaboration', 'Open-minded', 'Receptive to feedback and new ideas', 5),
  ('collaboration', 'Active listening', 'Understands and responds to others effectively', 6),
  ('collaboration', 'Cooperation', 'Works well with diverse team members', 7),
  ('collaboration', 'Respect', 'Shows respect for colleagues and clients', 8),
  ('collaboration', 'Flexibility', 'Adapts approach based on situation', 9)
on conflict (category, name) do nothing;

-- =========================
-- Professionalism Category
-- =========================
insert into public.soft_skills (category, name, description, order_index) values
  ('professionalism', 'Work ethic', 'Demonstrates dedication and strong effort', 1),
  ('professionalism', 'Safety awareness', 'Follows safety protocols and procedures', 2),
  ('professionalism', 'Problem-solving', 'Finds solutions independently and creatively', 3),
  ('professionalism', 'Initiative', 'Takes action proactively without being asked', 4),
  ('professionalism', 'Accountability', 'Takes responsibility for actions and outcomes', 5),
  ('professionalism', 'Professionalism', 'Maintains professional demeanor and appearance', 6),
  ('professionalism', 'Leadership', 'Guides and motivates team members', 7),
  ('professionalism', 'Integrity', 'Acts with honesty and ethical principles', 8),
  ('professionalism', 'Positive attitude', 'Maintains optimistic and constructive outlook', 9)
on conflict (category, name) do nothing;

-- =========================
-- Technical/Job Skills Category
-- =========================
insert into public.soft_skills (category, name, description, order_index) values
  ('technical', 'Craftsmanship', 'Produces high-quality work with attention to detail', 1),
  ('technical', 'Tool proficiency', 'Uses equipment properly and safely', 2),
  ('technical', 'Technical knowledge', 'Demonstrates understanding of trade', 3),
  ('technical', 'Attention to detail', 'Ensures precision and accuracy in work', 4),
  ('technical', 'Quality control', 'Maintains high standards in all work', 5),
  ('technical', 'Innovation', 'Finds creative solutions to technical challenges', 6),
  ('technical', 'Continuous learning', 'Seeks to improve skills and knowledge', 7)
on conflict (category, name) do nothing;

commit;
