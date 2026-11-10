export interface User {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  role: 'SUPERADMIN' | 'ADMIN' | 'INTERN' | 'SALES_REP';
  lastLogin?: string;
}

export interface Lead {
  _id: string;
  leadId: string;
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  phone?: string;
  interestedProduct: 'Z-Factory' | 'Z-Tracs' | 'Z-Market' | 'Z-Drone' | 'Z-Consultancy';
  source: string;
  status: 'New' | 'Contacted' | 'Qualified' | 'Demo Scheduled' | 'Proposal Sent' | 'Negotiation' | 'Won' | 'Lost';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  requirements?: string;
  assignedTo?: any;
  notes?: string;
  isDuplicate?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BrochureDownloadItem {
  _id: string;
  downloadId: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  brochureType: string;
  status: 'New' | 'Contacted' | 'Qualified' | 'Converted' | 'Archived';
  source: string;
  relatedLead?: Lead;
  notes?: string;
  isRepeat: boolean;
  downloadCount: number;
  downloadedAt: string;
  createdAt: string;
}

export interface ScheduleAppointmentItem {
  _id: string;
  appointmentId: string;
  title: string;
  contactName?: string;
  company?: string;
  type:
    | 'Product Demo'
    | 'Discovery Call'
    | 'Follow-up'
    | 'Sales Meeting'
    | 'Technical Discussion'
    | 'Internal Meeting'
    | 'Other';
  date: string;
  startTime: string;
  endTime?: string;
  status: 'Scheduled' | 'Confirmed' | 'Completed' | 'Cancelled' | 'Rescheduled' | 'No Show';
  relatedLead?: Lead;
  assignedTo?: User;
  locationOrLink?: string;
  description?: string;
  reminder?: string;
  notes?: string;
  outcome?: string;
  color: 'purple' | 'blue' | 'green' | 'amber' | 'red';
  createdAt: string;
}

export interface CampaignItem {
  _id: string;
  campaignId: string;
  name: string;
  type:
    | 'Email Marketing'
    | 'Social Media'
    | 'Paid Advertising'
    | 'Direct Marketing'
    | 'Website Campaign'
    | 'Event Campaign'
    | 'Other';
  channel: string;
  targetAudience?: string;
  objective?: string;
  status: 'Draft' | 'Scheduled' | 'Active' | 'Paused' | 'Completed' | 'Cancelled';
  startDate?: string;
  endDate?: string;
  budget: number;
  actualSpend: number;
  leadsGenerated: number;
  conversions: number;
  revenueGenerated: number;
  trackingCode: string;
  owner?: User;
  createdBy?: User;
  description?: string;
  notes?: string;
  createdAt: string;
  metrics?: {
    conversionRate: number;
    costPerLead: number;
    roi: number;
  };
}

export interface DashboardStats {
  totalLeads: { value: number; change: string };
  newLeads: { value: number; change: string };
  qualifiedLeads: { value: number; change: string };
  pendingFollowUps: { value: number; change: string };
}

export interface ScheduleItem {
  _id: string;
  title: string;
  company?: string;
  type: string;
  date: string;
  time?: string;
  color: 'purple' | 'blue' | 'green' | 'amber' | 'red';
  notes?: string;
}

export interface ActivityItem {
  id: string;
  icon: 'lead' | 'mail' | 'check';
  text: string;
  bold: string;
  time: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface DirectMailItem {
  _id: string;
  mailId: string;
  recipientName: string;
  companyName?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  mailType: string;
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Ready for Dispatch' | 'Dispatched' | 'Delivered' | 'Returned' | 'Cancelled';
  relatedLead?: Lead;
  relatedCampaign?: { _id: string; campaignId: string; name: string };
  scheduledDate?: string;
  dispatchDate?: string;
  deliveryDate?: string;
  trackingNumber?: string;
  postalCarrier?: string;
  assignedTo?: User;
  notes?: string;
  statusHistory?: Array<{
    status: string;
    changedAt: string;
    changedBy?: User;
    note?: string;
  }>;
  createdAt: string;
}

export interface QuotationLineItem {
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
  taxRate: number;
  lineTotal: number;
}

export interface QuotationItem {
  _id: string;
  quotationNumber: string;
  title: string;
  customerName: string;
  company: string;
  email: string;
  phone?: string;
  billingAddress?: string;
  shippingAddress?: string;
  relatedLead?: Lead;
  issueDate: string;
  validUntil: string;
  assignedTo?: User;
  currency: string;
  lineItems: QuotationLineItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  paymentTerms?: string;
  deliveryTerms?: string;
  notes?: string;
  termsAndConditions?: string;
  status:
    | 'Draft'
    | 'Pending Approval'
    | 'Approved'
    | 'Sent'
    | 'Viewed'
    | 'Accepted'
    | 'Rejected'
    | 'Expired'
    | 'Cancelled';
  statusHistory?: Array<{
    status: string;
    changedAt: string;
    changedBy?: User;
    note?: string;
  }>;
  createdAt: string;
}

export interface TeamWorkloadItem {
  userId: string;
  name: string;
  email: string;
  role: string;
  totalAssigned: number;
  openLeads: number;
  convertedLeads: number;
  overdueFollowUps: number;
}

export interface LeadAssignmentHistoryItem {
  _id: string;
  lead: string;
  leadId: string;
  previousAssignee?: User;
  newAssignee?: User;
  assignedBy?: User;
  assignedAt: string;
  reason?: string;
  priority?: string;
  notes?: string;
  method: string;
}

export interface AcknowledgementItem {
  _id: string;
  acknowledgementId: string;
  referenceNumber: string;
  contactName: string;
  company: string;
  email: string;
  phone?: string;
  relatedLead?: Lead;
  relatedQuotation?: QuotationItem;
  type: string;
  subject: string;
  content: string;
  status:
    | 'Draft'
    | 'Pending Approval'
    | 'Approved'
    | 'Sent'
    | 'Acknowledged'
    | 'Rejected'
    | 'Expired';
  sentDate?: string;
  responseDate?: string;
  assignedTo?: User;
  notes?: string;
  history?: Array<{
    status: string;
    changedAt: string;
    changedBy?: User;
    note?: string;
  }>;
  createdAt: string;
}

export interface ConversationMessage {
  _id?: string;
  sender: 'customer' | 'agent' | 'system';
  senderName: string;
  senderId?: User;
  content: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'failed';
  isInternalNote: boolean;
}

export interface ConversationItem {
  _id: string;
  conversationId: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  company?: string;
  channel: 'Email' | 'Website enquiry' | 'WhatsApp' | 'Direct';
  status: 'Open' | 'Pending' | 'Resolved' | 'Archived';
  assignedTo?: User;
  relatedLead?: Lead;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  messages: ConversationMessage[];
  notes?: string;
  createdAt: string;
}

export interface AuditLogItem {
  _id: string;
  userName: string;
  userEmail: string;
  action: string;
  module: string;
  recordRef?: string;
  details?: string;
  ipAddress?: string;
  timestamp: string;
}

export interface GeneralSettingsData {
  organizationName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  website: string;
  defaultCurrency: string;
  timeZone: string;
  dateFormat: string;
}
