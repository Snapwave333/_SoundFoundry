"""Style seed system

Revision ID: 003
Revises: 002
Create Date: 2025-01-27 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add style columns to users table
    op.add_column('users', sa.Column('user_style_seed', sa.BigInteger(), nullable=True))
    op.add_column('users', sa.Column('style_unlocks', postgresql.JSONB(astext_type=sa.Text()), server_default='[]', nullable=False))
    
    # Create series table
    op.create_table(
        'series',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('user_id', sa.BigInteger(), nullable=False),
        sa.Column('title', sa.Text(), nullable=False),
        sa.Column('slug', sa.Text(), nullable=False),
        sa.Column('palette', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('geometry', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('slug')
    )
    op.create_index('ix_series_user_id', 'series', ['user_id'])
    op.create_index('ix_series_slug', 'series', ['slug'])
    op.create_foreign_key(
        'fk_series_user_id',
        'series', 'users',
        ['user_id'], ['id'],
        ondelete='CASCADE'
    )
    
    # Add style columns to tracks table
    op.add_column('tracks', sa.Column('series_id', sa.BigInteger(), nullable=True))
    op.add_column('tracks', sa.Column('visual_version', sa.Integer(), server_default='1', nullable=False))
    op.add_column('tracks', sa.Column('cover_url', sa.String(), nullable=True))
    
    op.create_index('ix_tracks_series_id', 'tracks', ['series_id'])
    op.create_foreign_key(
        'fk_tracks_series_id',
        'tracks', 'series',
        ['series_id'], ['id'],
        ondelete='SET NULL'
    )


def downgrade() -> None:
    # Remove foreign key and index from tracks
    op.drop_constraint('fk_tracks_series_id', 'tracks', type_='foreignkey')
    op.drop_index('ix_tracks_series_id', 'tracks')
    op.drop_column('tracks', 'cover_url')
    op.drop_column('tracks', 'visual_version')
    op.drop_column('tracks', 'series_id')
    
    # Drop series table
    op.drop_constraint('fk_series_user_id', 'series', type_='foreignkey')
    op.drop_index('ix_series_slug', 'series')
    op.drop_index('ix_series_user_id', 'series')
    op.drop_table('series')
    
    # Remove style columns from users
    op.drop_column('users', 'style_unlocks')
    op.drop_column('users', 'user_style_seed')

