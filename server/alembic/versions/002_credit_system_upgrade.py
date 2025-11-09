"""Credit system upgrade

Revision ID: 002
Revises: 001
Create Date: 2025-01-27 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add new columns to users table
    op.add_column('users', sa.Column('ppp_band', sa.Text(), server_default='HIGH', nullable=False))
    op.add_column('users', sa.Column('solidarity_opt_in', sa.Boolean(), server_default='false', nullable=False))
    op.add_column('users', sa.Column('trial_expires_at', sa.DateTime(timezone=True), nullable=True))
    
    # Update default credits to 400 for new users
    op.alter_column('users', 'credits', server_default='400')
    
    # Update credit_ledger table
    op.add_column('credit_ledger', sa.Column('track_id', sa.Integer(), nullable=True))
    op.add_column('credit_ledger', sa.Column('meta', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.alter_column('credit_ledger', 'reason', type_=sa.Text(), existing_type=sa.String())
    
    # Add foreign key for track_id
    op.create_foreign_key(
        'fk_credit_ledger_track_id',
        'credit_ledger', 'tracks',
        ['track_id'], ['id'],
        ondelete='SET NULL'
    )
    
    # Create index on track_id for faster lookups
    op.create_index('ix_credit_ledger_track_id', 'credit_ledger', ['track_id'])


def downgrade() -> None:
    # Remove index
    op.drop_index('ix_credit_ledger_track_id', 'credit_ledger')
    
    # Remove foreign key
    op.drop_constraint('fk_credit_ledger_track_id', 'credit_ledger', type_='foreignkey')
    
    # Revert credit_ledger changes
    op.alter_column('credit_ledger', 'reason', type_=sa.String(), existing_type=sa.Text())
    op.drop_column('credit_ledger', 'meta')
    op.drop_column('credit_ledger', 'track_id')
    
    # Revert users table changes
    op.alter_column('users', 'credits', server_default='0')
    op.drop_column('users', 'trial_expires_at')
    op.drop_column('users', 'solidarity_opt_in')
    op.drop_column('users', 'ppp_band')

