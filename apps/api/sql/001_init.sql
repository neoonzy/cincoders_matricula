-- Sem modelo de semestres anteriores: apenas uma oferta corrente, conforme o edital.
CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE,
  required_hours INTEGER NOT NULL CHECK (required_hours >= 0),
  profile_hours INTEGER NOT NULL CHECK (profile_hours >= 0),
  free_hours INTEGER NOT NULL CHECK (free_hours >= 0)
);
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, course_id TEXT NOT NULL REFERENCES courses(id)
);
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK (role IN ('SECRETARIA','ALUNO')),
  student_id TEXT UNIQUE REFERENCES students(id),
  CHECK ((role='ALUNO' AND student_id IS NOT NULL) OR (role='SECRETARIA' AND student_id IS NULL))
);
CREATE TABLE IF NOT EXISTS subjects (
  id TEXT PRIMARY KEY, code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL, hours INTEGER NOT NULL CHECK (hours BETWEEN 15 AND 120 AND hours % 15 = 0)
);
CREATE TABLE IF NOT EXISTS curricula (
  course_id TEXT NOT NULL REFERENCES courses(id), subject_id TEXT NOT NULL REFERENCES subjects(id),
  kind TEXT NOT NULL CHECK (kind IN ('OBRIGATORIA','PERFIL')),
  PRIMARY KEY (course_id,subject_id)
);
CREATE TABLE IF NOT EXISTS professors (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS sections (
  id TEXT PRIMARY KEY, subject_id TEXT NOT NULL REFERENCES subjects(id),
  professor_id TEXT NOT NULL REFERENCES professors(id), seats INTEGER NOT NULL CHECK(seats>=1)
);
CREATE TABLE IF NOT EXISTS enrollments (
  id TEXT PRIMARY KEY, student_id TEXT NOT NULL REFERENCES students(id), section_id TEXT NOT NULL REFERENCES sections(id),
  status TEXT NOT NULL CHECK (status IN ('ATIVA','CANCELADA')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), canceled_at TIMESTAMPTZ,
  UNIQUE(student_id,section_id)
);
CREATE INDEX IF NOT EXISTS enrollments_section_active ON enrollments(section_id) WHERE status='ATIVA';
CREATE TABLE IF NOT EXISTS history (
  id TEXT PRIMARY KEY, student_id TEXT NOT NULL REFERENCES students(id),
  subject_id TEXT NOT NULL REFERENCES subjects(id), status TEXT NOT NULL CHECK(status IN ('APROVADO','REPROVADO'))
);
CREATE INDEX IF NOT EXISTS history_student_idx ON history(student_id,status);
CREATE TABLE IF NOT EXISTS prerequisites (
  subject_id TEXT NOT NULL REFERENCES subjects(id), required_subject_id TEXT NOT NULL REFERENCES subjects(id),
  PRIMARY KEY(subject_id, required_subject_id), CHECK(subject_id<>required_subject_id)
);
CREATE TABLE IF NOT EXISTS plan_items (
  id TEXT PRIMARY KEY, student_id TEXT NOT NULL REFERENCES students(id), section_id TEXT NOT NULL REFERENCES sections(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(student_id,section_id)
);
CREATE INDEX IF NOT EXISTS plan_student_idx ON plan_items(student_id);
