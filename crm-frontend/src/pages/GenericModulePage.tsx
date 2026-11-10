import React from 'react';
import { SlidersHorizontal, Plus } from 'lucide-react';

export const GenericModulePage: React.FC<{ title: string; description: string }> = ({ title, description }) => {
  return (
    <div className="module-empty">
      <div className="module-icon">
        <SlidersHorizontal size={26} />
      </div>
      <p className="eyebrow">Connected CRM Module</p>
      <h1>{title}</h1>
      <p>{description}</p>
      <button className="btn btn-primary" onClick={() => alert(`${title} API module operational.`)}>
        <Plus size={17} /> Create new record
      </button>
    </div>
  );
};

