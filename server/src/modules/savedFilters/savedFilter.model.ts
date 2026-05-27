import mongoose, { Document, Schema } from 'mongoose';

export interface ISavedFilterFilters {
  status: string[];
  assignee: string[];
  reporter: string[];
  type: string[];
  priority: string[];
  labels: string[];
  storyPoints: string[];
  sprint?: string[];
  milestone?: string[];
  fixVersion?: string[];
  affectsVersions?: string[];
  hasStoryPoints?: boolean;
  hasEstimate?: boolean;
  hasParent?: boolean;
  hasDueDate?: boolean;
  dueDatePreset?: string;
  hasStartDate?: boolean;
  unassigned?: boolean;
}

export interface ISavedFilter extends Document {
  user: mongoose.Types.ObjectId;
  project: mongoose.Types.ObjectId;
  name: string;
  filters: ISavedFilterFilters;
  quickFilter: 'all' | 'my' | 'open';
  jql?: string;
  viewMode?: 'list' | 'table' | 'kanban';
  createdAt: Date;
  updatedAt: Date;
}

const savedFilterFiltersSchema = new Schema<ISavedFilterFilters>(
  {
    status: { type: [String], default: [] },
    assignee: { type: [String], default: [] },
    reporter: { type: [String], default: [] },
    type: { type: [String], default: [] },
    priority: { type: [String], default: [] },
    labels: { type: [String], default: [] },
    storyPoints: { type: [String], default: [] },
    sprint: { type: [String], default: undefined },
    milestone: { type: [String], default: undefined },
    fixVersion: { type: [String], default: undefined },
    affectsVersions: { type: [String], default: undefined },
    hasStoryPoints: { type: Boolean, default: undefined },
    hasEstimate: { type: Boolean, default: undefined },
    hasParent: { type: Boolean, default: undefined },
    hasDueDate: { type: Boolean, default: undefined },
    dueDatePreset: { type: String, default: undefined },
    hasStartDate: { type: Boolean, default: undefined },
    unassigned: { type: Boolean, default: undefined },
  },
  { _id: false }
);

const savedFilterSchema = new Schema<ISavedFilter>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    name: { type: String, required: true },
    filters: { type: savedFilterFiltersSchema, required: true },
    quickFilter: { type: String, enum: ['all', 'my', 'open'], required: true, default: 'all' },
    jql: { type: String, default: undefined },
    viewMode: { type: String, enum: ['list', 'table', 'kanban'], default: undefined },
  },
  { timestamps: true }
);

savedFilterSchema.index({ user: 1, project: 1 });

export const SavedFilter = mongoose.model<ISavedFilter>('SavedFilter', savedFilterSchema);
