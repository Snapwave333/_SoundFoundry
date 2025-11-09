"""Initial migration

Revision ID: 001
Revises: 
Create Date: 2025-01-27 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('hashed_password', sa.String(), nullable=True),
        sa.Column('plan', sa.Enum('FREE', 'PRO', 'ENTERPRISE', name='plantype'), nullable=False),
        sa.Column('credits', sa.Integer(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('is_verified', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # Create files table (needed before tracks due to foreign key)
    op.create_table(
        'files',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('kind', sa.Enum('REFERENCE', 'GENERATED', 'STEM', name='filekind'), nullable=False),
        sa.Column('url', sa.String(), nullable=False),
        sa.Column('sha256', sa.String(), nullable=True),
        sa.Column('duration_s', sa.Float(), nullable=True),
        sa.Column('bpm', sa.Integer(), nullable=True),
        sa.Column('key', sa.String(), nullable=True),
        sa.Column('energy', sa.Float(), nullable=True),
        sa.Column('loudness', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_files_id'), 'files', ['id'], unique=False)

    # Create tracks table
    op.create_table(
        'tracks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(), nullable=True),
        sa.Column('prompt', sa.Text(), nullable=False),
        sa.Column('lyrics', sa.Text(), nullable=True),
        sa.Column('has_vocals', sa.Boolean(), nullable=False),
        sa.Column('duration_s', sa.Integer(), nullable=False),
        sa.Column('bpm', sa.Integer(), nullable=True),
        sa.Column('key', sa.String(), nullable=True),
        sa.Column('style_strength', sa.Float(), nullable=False),
        sa.Column('provider', sa.String(), nullable=False),
        sa.Column('seed', sa.Integer(), nullable=True),
        sa.Column('status', sa.Enum('QUEUED', 'RENDERING', 'MASTERING', 'COMPLETE', 'FAILED', name='trackstatus'), nullable=False),
        sa.Column('public', sa.Boolean(), nullable=False),
        sa.Column('preview_url', sa.String(), nullable=True),
        sa.Column('file_url', sa.String(), nullable=True),
        sa.Column('stems_zip_url', sa.String(), nullable=True),
        sa.Column('reference_file_id', sa.Integer(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['reference_file_id'], ['files.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_tracks_id'), 'tracks', ['id'], unique=False)

    # Create jobs table
    op.create_table(
        'jobs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('track_id', sa.Integer(), nullable=False),
        sa.Column('provider_job_id', sa.String(), nullable=True),
        sa.Column('status', sa.Enum('QUEUED', 'PROCESSING', 'COMPLETE', 'FAILED', 'CANCELLED', name='jobstatus'), nullable=False),
        sa.Column('progress', sa.Float(), nullable=False),
        sa.Column('error', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['track_id'], ['tracks.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_jobs_id'), 'jobs', ['id'], unique=False)

    # Create credit_ledger table
    op.create_table(
        'credit_ledger',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('delta', sa.Integer(), nullable=False),
        sa.Column('reason', sa.String(), nullable=False),
        sa.Column('job_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_credit_ledger_id'), 'credit_ledger', ['id'], unique=False)


def downgrade() -> None:
    op.drop_table('credit_ledger')
    op.drop_table('jobs')
    op.drop_table('tracks')
    op.drop_table('files')
    op.drop_table('users')
    op.execute('DROP TYPE IF EXISTS jobstatus')
    op.execute('DROP TYPE IF EXISTS trackstatus')
    op.execute('DROP TYPE IF EXISTS filekind')
    op.execute('DROP TYPE IF EXISTS plantype')

