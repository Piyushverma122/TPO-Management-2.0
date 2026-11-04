import React from 'react';
import { Avatar } from './Avatar';
import { CompanyLogo } from './CompanyLogo';

/** Avatar + name + a muted second line, for table cells that describe a person. */
export const PersonCell: React.FC<{ name?: string | null; sub?: string | null; avatar?: string | null }> = ({ name, sub, avatar }) => (
  <div className="flex items-center gap-3 min-w-0">
    <Avatar name={name || 'Unknown'} src={avatar || undefined} size="sm" />
    <div className="min-w-0">
      <div className="font-medium text-foreground truncate">{name || '-'}</div>
      {sub && <div className="text-xs text-muted-foreground truncate">{sub}</div>}
    </div>
  </div>
);

/** Company logo + name + role line, for table cells that describe a company/drive. */
export const CompanyCell: React.FC<{ name?: string | null; sub?: string | null; logo?: string | null }> = ({ name, sub, logo }) => (
  <div className="flex items-center gap-3 min-w-0">
    <CompanyLogo src={logo} name={name || 'Company'} size="sm" />
    <div className="min-w-0">
      <div className="font-medium text-foreground truncate">{name || '-'}</div>
      {sub && <div className="text-xs text-muted-foreground truncate">{sub}</div>}
    </div>
  </div>
);
