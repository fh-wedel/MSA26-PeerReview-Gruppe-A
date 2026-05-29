CREATE TABLE submission_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_by_type VARCHAR(50) NOT NULL CHECK (created_by_type IN ('AUTHOR', 'REVIEWER', 'EXAM_OFFICE')),
    created_by_id VARCHAR(255) NOT NULL,
    submission_start TIMESTAMP WITH TIME ZONE NOT NULL,
    submission_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    review_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    review_process VARCHAR(100) NOT NULL,
    matching_rule VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    configuration_id UUID NOT NULL REFERENCES submission_configurations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    abstract_text TEXT,
    file_s3_key VARCHAR(512),
    additional_files_s3_keys JSONB DEFAULT '[]'::jsonb,
    submitted_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'GRADED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE submission_authors (
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    author_id VARCHAR(255) NOT NULL,
    PRIMARY KEY (submission_id, author_id)
);

CREATE TABLE grading_criteria_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    configuration_id UUID UNIQUE NOT NULL REFERENCES submission_configurations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    visible_to_authors BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE grading_criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES grading_criteria_forms(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    criterion_type VARCHAR(50) NOT NULL CHECK (criterion_type IN ('SCORE', 'TEXT', 'BOOLEAN')),
    max_points INT,
    weight DOUBLE PRECISION DEFAULT 1.0,
    sort_order INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_submissions_config ON submissions(configuration_id);
CREATE INDEX idx_submission_authors_user ON submission_authors(author_id);
