PRAGMA foreign_keys=ON;

-- Seed discovered routes for regular user (normalized)
INSERT INTO routes (user_level, route, status)
VALUES
  ('regular','/dashboard','discovered'),
  ('regular','/dashboard/profile/general','discovered'),
  ('regular','/dashboard/profile/employment','discovered'),
  ('regular','/dashboard/profile/skills','discovered'),
  ('regular','/dashboard/profile/certifications','discovered'),
  ('regular','/dashboard/profile/education','discovered'),
  ('regular','/dashboard/profile/experience','discovered'),
  ('regular','/dashboard/workers','discovered'),
  ('regular','/dashboard/employers','discovered'),
  ('regular','/dashboard/jobs','discovered'),
  ('regular','/dashboard/map','discovered'),
  ('regular','/dashboard/users/:id','discovered')
ON CONFLICT(user_level, route) DO UPDATE SET
  status=COALESCE(
    CASE WHEN routes.status IN ('audited','test_queued','test_in_progress','tested') THEN routes.status ELSE excluded.status END,
    routes.status
  );

-- Known bug for jobs discovery 500
INSERT INTO bugs (bug_sig, bug_id, route, user_level, severity)
VALUES ('regular|/dashboard/jobs|http_500|list_view', 'BUG-0005', '/dashboard/jobs', 'regular', 'high')
ON CONFLICT(bug_sig) DO UPDATE SET bug_id=excluded.bug_id, severity=excluded.severity;
