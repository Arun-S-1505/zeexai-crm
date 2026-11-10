import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { Lead } from '../models/Lead';
import { ScheduleEvent } from '../models/ScheduleEvent';
import { BrochureDownload } from '../models/BrochureDownload';
import { Campaign } from '../models/Campaign';
import { DirectMail } from '../models/DirectMail';
import { Quotation } from '../models/Quotation';
import { Acknowledgement } from '../models/Acknowledgement';
import { Conversation } from '../models/Conversation';
import { AuditLog } from '../models/AuditLog';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';
const MONGODB_DATABASE = process.env.MONGODB_DATABASE || 'zeexai_crm';

const seed = async () => {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI not provided in .env');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB Atlas at:', MONGODB_URI.substring(0, 30) + '...');
    await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DATABASE, serverSelectionTimeoutMS: 15000 });
    console.log(`✅ Connected to MongoDB Atlas — database: ${MONGODB_DATABASE}`);

    // Seed default users for all 3 roles
    const demoUsers = [
      {
        name: 'Z-CRM Superadmin',
        email: 'superadmin@zeexai.com',
        password: 'Admin@123',
        role: 'SUPERADMIN',
      },
      {
        name: 'Z-CRM Admin',
        email: 'admin@zeexai.com',
        password: 'Admin@123',
        role: 'ADMIN',
      },
      {
        name: 'Intern Analyst',
        email: 'intern@zeexai.com',
        password: 'Intern@123',
        role: 'INTERN',
      },
    ];

    for (const u of demoUsers) {
      let existing = await User.findOne({ email: u.email });
      if (!existing) {
        const newUser = new User({
          name: u.name,
          email: u.email,
          password: u.password,
          role: u.role,
          isActive: true,
        });
        await newUser.save();
        console.log(`✅ Created demo user [${u.role}]: ${u.email} / ${u.password}`);
      } else {
        // Assign plain text password so userSchema.pre('save') hashes it exactly once
        existing.name = u.name;
        existing.password = u.password;
        existing.role = u.role as any;
        existing.isActive = true;
        await existing.save();
        console.log(`🔄 Updated demo user [${u.role}]: ${u.email} / ${u.password}`);
      }
    }

    // Seed initial Leads if empty
    const count = await Lead.countDocuments();
    if (count === 0) {
      const initialLeads = [
        {
          leadId: 'LD-1048',
          firstName: 'Aarav',
          lastName: 'Mehta',
          company: 'Vertex Manufacturing',
          email: 'aarav.mehta@vertexmfg.com',
          phone: '+91 98765 43210',
          interestedProduct: 'Z-Factory',
          source: 'Website enquiry',
          status: 'New',
          priority: 'High',
          requirements: 'Real-time CCTV anomaly detection for manufacturing shop floor',
        },
        {
          leadId: 'LD-1047',
          firstName: 'Sofia',
          lastName: 'Rodriguez',
          company: 'Northstar Logistics',
          email: 'sofia.r@northstar.logistics',
          phone: '+91 98765 43211',
          interestedProduct: 'Z-Tracs',
          source: 'Brochure download',
          status: 'Qualified',
          priority: 'Medium',
          requirements: 'Fleet and facility tracking with perimeter monitoring',
        },
        {
          leadId: 'LD-1046',
          firstName: 'Daniel',
          lastName: 'Chen',
          company: 'Harbor Infrastructure',
          email: 'dchen@harborinfra.org',
          phone: '+91 98765 43212',
          interestedProduct: 'Z-Drone',
          source: 'Marketing campaign',
          status: 'Demo Scheduled',
          priority: 'High',
          requirements: 'Automated drone patrol for shipping port security',
        },
        {
          leadId: 'LD-1045',
          firstName: 'Maya',
          lastName: 'Patel',
          company: 'UrbanCart Retail',
          email: 'maya@urbancart.in',
          phone: '+91 98765 43213',
          interestedProduct: 'Z-Market',
          source: 'Referral',
          status: 'Contacted',
          priority: 'Medium',
          requirements: 'Customer footfall tracking and loss prevention',
        },
        {
          leadId: 'LD-1044',
          firstName: 'Ethan',
          lastName: 'Williams',
          company: 'Apex Industrial',
          email: 'ewilliams@apexindustrial.com',
          phone: '+91 98765 43214',
          interestedProduct: 'Z-Factory',
          source: 'Direct outreach',
          status: 'Proposal Sent',
          priority: 'Urgent',
          requirements: 'Hazardous area violation alerts',
        },
        {
          leadId: 'LD-1043',
          firstName: 'Nisha',
          lastName: 'Menon',
          company: 'BluePeak Ports',
          email: 'nisha@bluepeakports.com',
          phone: '+91 98765 43215',
          interestedProduct: 'Z-Tracs',
          source: 'Website enquiry',
          status: 'Negotiation',
          priority: 'High',
          requirements: 'Container tracking and intrusion alerts',
        },
        {
          leadId: 'LD-1042',
          firstName: 'Lucas',
          lastName: 'Martin',
          company: 'Orion Systems',
          email: 'lmartin@orionsys.com',
          phone: '+91 98765 43216',
          interestedProduct: 'Z-Consultancy',
          source: 'Marketing campaign',
          status: 'New',
          priority: 'Low',
          requirements: 'Security architecture audit for multi-tenant facilities',
        },
        {
          leadId: 'LD-1041',
          firstName: 'Ishita',
          lastName: 'Rao',
          company: 'BuildWell Group',
          email: 'ishita@buildwell.co.in',
          phone: '+91 98765 43217',
          interestedProduct: 'Z-Factory',
          source: 'Brochure download',
          status: 'Won',
          priority: 'Medium',
          requirements: 'Worker safety PPE detection on 12 active construction sites',
        },
      ];

      for (const leadData of initialLeads) {
        const l = new Lead(leadData);
        await l.save();
      }
      console.log('✅ Seeded 8 initial leads');
    }

    // Seed Schedule Events if empty
    const eventCount = await ScheduleEvent.countDocuments();
    if (eventCount === 0) {
      const today = new Date();
      const events = [
        {
          title: 'Z-Factory discovery call',
          company: 'Vertex Manufacturing',
          type: 'Discovery call',
          date: today,
          time: '09:30 AM',
          color: 'purple',
        },
        {
          title: 'Product demonstration',
          company: 'Northstar Logistics',
          type: 'Demo · Z-Tracs',
          date: today,
          time: '11:00 AM',
          color: 'blue',
        },
        {
          title: 'Proposal review',
          company: 'Apex Industrial',
          type: 'Follow-up',
          date: today,
          time: '02:30 PM',
          color: 'green',
        },
      ];
      await ScheduleEvent.insertMany(events);
      console.log('✅ Seeded 3 schedule events');
    }

    // Seed Brochure Downloads if empty
    const brochureCount = await BrochureDownload.countDocuments();
    if (brochureCount === 0) {
      const demoBrochures = [
        {
          downloadId: 'BD-1001',
          name: 'Vikram Singhania',
          email: 'vikram.s@titanforge.in',
          company: 'Titan Forge Ltd',
          phone: '+91 98220 11223',
          brochureType: 'Z-Factory Technical Whitepaper',
          status: 'New',
          source: 'Website Download',
          notes: 'Interested in worker PPE anomaly detection with edge camera streams.',
          isRepeat: false,
          downloadCount: 1,
          downloadedAt: new Date(Date.now() - 2 * 3600 * 1000),
        },
        {
          downloadId: 'BD-1002',
          name: 'Sarah Jenkins',
          email: 'sjenkins@globalfreight.com',
          company: 'Global Freight Dynamics',
          phone: '+1 415 555 0192',
          brochureType: 'Z-Tracs Fleet Monitoring Brief',
          status: 'Contacted',
          source: 'Product Landing Page',
          notes: 'Followed up via introductory email. Requested commercial quote for 40 vehicles.',
          isRepeat: true,
          downloadCount: 3,
          downloadedAt: new Date(Date.now() - 24 * 3600 * 1000),
        },
        {
          downloadId: 'BD-1003',
          name: 'Kavita Nair',
          email: 'kavita.nair@zenithenergy.co',
          company: 'Zenith Clean Energy',
          phone: '+91 99401 88291',
          brochureType: 'Z-Drone Autonomous Security Specs',
          status: 'Qualified',
          source: 'Campaign Outreach',
          notes: 'Budget verified. Scheduling on-site perimeter survey next week.',
          isRepeat: false,
          downloadCount: 1,
          downloadedAt: new Date(Date.now() - 48 * 3600 * 1000),
        },
        {
          downloadId: 'BD-1004',
          name: 'Chen Wei',
          email: 'chen.wei@shanghaisemi.cn',
          company: 'Sino Semiconductor',
          phone: '+86 21 6888 1234',
          brochureType: 'Z-Factory Overview',
          status: 'Converted',
          source: 'Website Download',
          notes: 'Successfully converted to active Lead LD-1048.',
          isRepeat: true,
          downloadCount: 2,
          downloadedAt: new Date(Date.now() - 72 * 3600 * 1000),
        },
      ];
      await BrochureDownload.insertMany(demoBrochures);
      console.log('✅ Seeded 4 brochure download records');
    }

    // Seed Campaigns if empty
    const campaignCount = await Campaign.countDocuments();
    if (campaignCount === 0) {
      const demoCampaigns = [
        {
          campaignId: 'CMP-101',
          name: 'Q4 Industrial AI Vision Launch',
          type: 'Paid Advertising',
          channel: 'LinkedIn Sponsored Content & Google Search',
          targetAudience: 'Chief Technology Officers & Plant Managers in Automotive & Metals',
          objective: 'Generate 50 enterprise leads for Z-Factory visual inspection system',
          status: 'Active',
          startDate: new Date('2026-10-01'),
          endDate: new Date('2026-12-31'),
          budget: 15000,
          actualSpend: 8450,
          leadsGenerated: 42,
          conversions: 8,
          revenueGenerated: 125000,
          trackingCode: 'CMP-IND-AI-2026',
          description: 'High-intent B2B search campaign targeting plant safety automation keywords.',
        },
        {
          campaignId: 'CMP-102',
          name: 'Global Logistics Security Webinar',
          type: 'Email Marketing',
          channel: 'Targeted Supply Chain Newsletter & Outbound Direct Mail',
          targetAudience: 'Fleet Operations VPs & Security Directors in North America',
          objective: 'Demonstrate real-time cargo tamper detection with Z-Tracs',
          status: 'Active',
          startDate: new Date('2026-10-15'),
          endDate: new Date('2026-11-30'),
          budget: 6500,
          actualSpend: 4200,
          leadsGenerated: 31,
          conversions: 5,
          revenueGenerated: 68000,
          trackingCode: 'CMP-LOG-WEBINAR-26',
          description: 'Educational webinar series showing perimeter CCTV and sensor integration.',
        },
        {
          campaignId: 'CMP-103',
          name: 'Autonomous Port Patrol Drone Showcase',
          type: 'Event Campaign',
          channel: 'Maritime Security Expo 2026 & Direct Outreach',
          targetAudience: 'Port Authorities, Harbor Master Offices & Customs Terminals',
          objective: 'On-site live demo bookings for Z-Drone night vision surveillance',
          status: 'Paused',
          startDate: new Date('2026-09-01'),
          endDate: new Date('2026-10-31'),
          budget: 20000,
          actualSpend: 19800,
          leadsGenerated: 28,
          conversions: 4,
          revenueGenerated: 190000,
          trackingCode: 'CMP-PORT-PATROL-EXPO',
          description: 'Live field trial demonstration program conducted at international shipping ports.',
        },
      ];
      await Campaign.insertMany(demoCampaigns);
      console.log('✅ Seeded 3 marketing campaigns');
    }

    // Seed Direct Mail if empty
    const mailCount = await DirectMail.countDocuments();
    if (mailCount === 0) {
      const demoMail = [
        {
          mailId: 'DM-1001',
          recipientName: 'Aarav Mehta',
          companyName: 'Vertex Manufacturing',
          addressLine1: 'Plot 42, Industrial Area Phase II',
          addressLine2: 'Sector 62',
          city: 'Noida',
          state: 'Uttar Pradesh',
          postalCode: '201309',
          country: 'India',
          mailType: 'Product Catalogue',
          status: 'Dispatched',
          scheduledDate: new Date(Date.now() - 3 * 24 * 3600 * 1000),
          dispatchDate: new Date(Date.now() - 2 * 24 * 3600 * 1000),
          trackingNumber: 'IND-POST-99218204',
          postalCarrier: 'India Post Speed Post',
          notes: 'Dispatched 2026 industrial vision catalogue with edge camera sample brackets.',
        },
        {
          mailId: 'DM-1002',
          recipientName: 'Sofia Rodriguez',
          companyName: 'Northstar Logistics',
          addressLine1: '74 Harbor View Boulevard',
          addressLine2: 'Suite 400',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400001',
          country: 'India',
          mailType: 'Brochure',
          status: 'Delivered',
          scheduledDate: new Date(Date.now() - 5 * 24 * 3600 * 1000),
          dispatchDate: new Date(Date.now() - 4 * 24 * 3600 * 1000),
          deliveryDate: new Date(Date.now() - 1 * 24 * 3600 * 1000),
          trackingNumber: 'BLUEDART-883192',
          postalCarrier: 'Blue Dart Express',
          notes: 'Delivered and signed at reception desk.',
        },
        {
          mailId: 'DM-1003',
          recipientName: 'Ethan Williams',
          companyName: 'Apex Industrial',
          addressLine1: 'Gate 4, Heavy Engineering Zone',
          addressLine2: 'Near Outer Ring Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560066',
          country: 'India',
          mailType: 'Quotation',
          status: 'Ready for Dispatch',
          scheduledDate: new Date(),
          trackingNumber: '',
          postalCarrier: 'Professional Couriers',
          notes: 'Printed commercial proposal QT-2026-001 in hard-cover folder.',
        },
      ];
      await DirectMail.insertMany(demoMail);
      console.log('✅ Seeded 3 direct mail records');
    }

    // Drop obsolete index if present
    try {
      const qColl = mongoose.connection.collection('quotations');
      const idxs = await qColl.indexes();
      for (const idx of idxs) {
        if (idx.name === 'quotationId_1') {
          await qColl.dropIndex('quotationId_1');
          console.log('✅ Dropped obsolete index quotationId_1');
        }
      }
    } catch (_) {}

    // Seed Quotations if empty
    const quoteCount = await Quotation.countDocuments();
    if (quoteCount === 0) {
      const demoQuotations = [
        {
          quotationNumber: 'QT-2026-001',
          title: 'Z-Factory CCTV Anomaly Detection Pilot System',
          customerName: 'Aarav Mehta',
          company: 'Vertex Manufacturing',
          email: 'aarav.mehta@vertexmfg.com',
          phone: '+91 98765 43210',
          billingAddress: 'Plot 42, Industrial Area Phase II, Noida, UP 201309',
          shippingAddress: 'Plot 42, Industrial Area Phase II, Noida, UP 201309',
          validUntil: new Date(Date.now() + 25 * 24 * 3600 * 1000),
          currency: 'INR',
          lineItems: [
            {
              name: 'Z-Factory Edge AI Appliance (Model ZF-400)',
              description: 'Industrial quad-GPU neural inference edge gateway with 16 CCTV IP stream decoding',
              quantity: 2,
              unit: 'Units',
              unitPrice: 245000,
              discount: 5,
              taxRate: 18,
              lineTotal: 549290,
            },
            {
              name: 'Worker PPE & Hazardous Zone Detection Firmware License',
              description: 'Real-time helmet, vest, and machinery intrusion alert models (1 Year Annual SLA)',
              quantity: 16,
              unit: 'Channels',
              unitPrice: 15000,
              discount: 10,
              taxRate: 18,
              lineTotal: 254880,
            },
            {
              name: 'On-Site Calibration, Network Tuning & Deployment',
              description: 'Field engineer installation and camera lens angle calibration',
              quantity: 1,
              unit: 'Project',
              unitPrice: 85000,
              discount: 0,
              taxRate: 18,
              lineTotal: 100300,
            },
          ],
          subtotal: 815000,
          discountTotal: 48500,
          taxTotal: 137970,
          grandTotal: 904470,
          paymentTerms: '50% advance against PO confirmation, 50% upon pilot commissioning.',
          deliveryTerms: 'Dispatch within 14 business days from hardware allocation.',
          status: 'Approved',
          notes: 'Client reviewed pilot scope during demo call. Ready for sign-off.',
        },
        {
          quotationNumber: 'QT-2026-002',
          title: 'Z-Tracs Fleet Perimeter Tracking & Security Integration',
          customerName: 'Sofia Rodriguez',
          company: 'Northstar Logistics',
          email: 'sofia.r@northstar.logistics',
          phone: '+91 98765 43211',
          billingAddress: '74 Harbor View Blvd, Mumbai, MH 400001',
          shippingAddress: 'Container Freight Station #3, JNPT Port, Navi Mumbai',
          validUntil: new Date(Date.now() + 15 * 24 * 3600 * 1000),
          currency: 'INR',
          lineItems: [
            {
              name: 'Z-Tracs Telematics & Tamper Telemetry Gateway',
              description: 'LTE-M / Satellite failover container tracking tracker with geofencing',
              quantity: 25,
              unit: 'Units',
              unitPrice: 32000,
              discount: 10,
              taxRate: 18,
              lineTotal: 849600,
            },
            {
              name: 'Perimeter Intrusion Optical Sensors',
              description: 'Active infrared beam perimeter sensors for gate yards',
              quantity: 8,
              unit: 'Sets',
              unitPrice: 18500,
              discount: 0,
              taxRate: 18,
              lineTotal: 174640,
            },
          ],
          subtotal: 948000,
          discountTotal: 80000,
          taxTotal: 156240,
          grandTotal: 1024240,
          paymentTerms: '100% Letter of Credit / 30-day net payment.',
          deliveryTerms: 'Phased rollout across 3 logistics hubs.',
          status: 'Pending Approval',
          notes: 'Awaiting commercial director sign-off on bulk unit discount.',
        },
      ];
      await Quotation.insertMany(demoQuotations);
      console.log('✅ Seeded 2 quotation records');
    }

    // Seed Acknowledgements if empty
    const ackCount = await Acknowledgement.countDocuments();
    if (ackCount === 0) {
      const demoAcks = [
        {
          acknowledgementId: 'ACK-1001',
          referenceNumber: 'REF-QT-2026-001',
          contactName: 'Aarav Mehta',
          company: 'Vertex Manufacturing',
          email: 'aarav.mehta@vertexmfg.com',
          phone: '+91 98765 43210',
          type: 'Quotation Received',
          subject: 'Formal Commercial Quotation Receipt — Z-Factory Pilot',
          content:
            'Dear Aarav Mehta,\n\nWe acknowledge receipt and submission of quotation QT-2026-001 for Vertex Manufacturing. Our engineering and delivery team has registered your requirements for the industrial anomaly detection pilot.\n\nWarm regards,\nZEE X AI Commercial Team',
          status: 'Acknowledged',
          sentDate: new Date(Date.now() - 3 * 24 * 3600 * 1000),
          responseDate: new Date(Date.now() - 2 * 24 * 3600 * 1000),
          notes: 'Client confirmed receipt via formal acknowledgement portal.',
        },
        {
          acknowledgementId: 'ACK-1002',
          referenceNumber: 'REF-NDA-NORTHSTAR',
          contactName: 'Sofia Rodriguez',
          company: 'Northstar Logistics',
          email: 'sofia.r@northstar.logistics',
          phone: '+91 98765 43211',
          type: 'Document Received',
          subject: 'Confidentiality Agreement & Site Specification Receipt',
          content:
            'Dear Sofia Rodriguez,\n\nThis constitutes formal acknowledgement of the signed Mutual Non-Disclosure Agreement and yard security diagrams received under reference REF-NDA-NORTHSTAR.\n\nSincerely,\nZEE X AI Legal & Compliance',
          status: 'Sent',
          sentDate: new Date(Date.now() - 1 * 24 * 3600 * 1000),
          notes: 'Transmitted via encrypted document courier.',
        },
        {
          acknowledgementId: 'ACK-1003',
          referenceNumber: 'REF-ENQ-9941',
          contactName: 'Daniel Chen',
          company: 'Harbor Infrastructure',
          email: 'dchen@harborinfra.org',
          phone: '+91 98765 43212',
          type: 'Enquiry Received',
          subject: 'Enterprise Security Patrol Inquiry Acknowledgement',
          content:
            'Dear Daniel Chen,\n\nThank you for reaching out to ZEE X AI. We have safely logged your enterprise enquiry (Ref: REF-ENQ-9941). Our systems engineering team is reviewing your requirements and will follow up within one business day.\n\nBest regards,\nZEE X AI Operations Team',
          status: 'Pending Approval',
          notes: 'Awaiting sales lead assignment before releasing formal acknowledgement.',
        },
      ];
      await Acknowledgement.insertMany(demoAcks);
      console.log('✅ Seeded 3 acknowledgement records');
    }

    // Seed Conversations if empty
    const convCount = await Conversation.countDocuments();
    if (convCount === 0) {
      const demoConversations = [
        {
          conversationId: 'CONV-1001',
          contactName: 'Aarav Mehta',
          contactEmail: 'aarav.mehta@vertexmfg.com',
          contactPhone: '+91 98765 43210',
          company: 'Vertex Manufacturing',
          channel: 'Website enquiry',
          status: 'Open',
          lastMessage: 'Can you provide the hardware dimensions for the ZF-400 rack mount unit?',
          lastMessageAt: new Date(Date.now() - 30 * 60 * 1000),
          unreadCount: 1,
          messages: [
            {
              sender: 'customer',
              senderName: 'Aarav Mehta',
              content: 'Hello, we are evaluating Z-Factory for anomaly detection on our steel rolling mill.',
              timestamp: new Date(Date.now() - 4 * 3600 * 1000),
              status: 'delivered',
              isInternalNote: false,
            },
            {
              sender: 'agent',
              senderName: 'Z-CRM Admin',
              content: 'Hi Aarav, wonderful to connect! Our ZF-400 appliance connects directly to existing RTSP camera streams without requiring network recabling.',
              timestamp: new Date(Date.now() - 2 * 3600 * 1000),
              status: 'sent',
              isInternalNote: false,
            },
            {
              sender: 'system',
              senderName: 'Z-CRM (Internal Note)',
              content: 'Pilot quotation QT-2026-001 has been dispatched to client. High deal probability.',
              timestamp: new Date(Date.now() - 1 * 3600 * 1000),
              status: 'sent',
              isInternalNote: true,
            },
            {
              sender: 'customer',
              senderName: 'Aarav Mehta',
              content: 'Can you provide the hardware dimensions for the ZF-400 rack mount unit?',
              timestamp: new Date(Date.now() - 30 * 60 * 1000),
              status: 'delivered',
              isInternalNote: false,
            },
          ],
        },
        {
          conversationId: 'CONV-1002',
          contactName: 'Sofia Rodriguez',
          contactEmail: 'sofia.r@northstar.logistics',
          contactPhone: '+91 98765 43211',
          company: 'Northstar Logistics',
          channel: 'Email',
          status: 'Pending',
          lastMessage: 'Technical architecture call confirmed for tomorrow 11:00 AM.',
          lastMessageAt: new Date(Date.now() - 5 * 3600 * 1000),
          unreadCount: 0,
          messages: [
            {
              sender: 'customer',
              senderName: 'Sofia Rodriguez',
              content: 'We need perimeter monitoring with tamper alerts for 40 logistics fleet trucks.',
              timestamp: new Date(Date.now() - 24 * 3600 * 1000),
              status: 'delivered',
              isInternalNote: false,
            },
            {
              sender: 'agent',
              senderName: 'Z-CRM Admin',
              content: 'Technical architecture call confirmed for tomorrow 11:00 AM.',
              timestamp: new Date(Date.now() - 5 * 3600 * 1000),
              status: 'sent',
              isInternalNote: false,
            },
          ],
        },
        {
          conversationId: 'CONV-1003',
          contactName: 'Daniel Chen',
          contactEmail: 'dchen@harborinfra.org',
          contactPhone: '+91 98765 43212',
          company: 'Harbor Infrastructure',
          channel: 'Direct',
          status: 'Resolved',
          lastMessage: 'Thank you for transmitting the formal acknowledgement receipt.',
          lastMessageAt: new Date(Date.now() - 48 * 3600 * 1000),
          unreadCount: 0,
          messages: [
            {
              sender: 'customer',
              senderName: 'Daniel Chen',
              content: 'Looking for autonomous patrol drones for harbor night surveillance.',
              timestamp: new Date(Date.now() - 72 * 3600 * 1000),
              status: 'delivered',
              isInternalNote: false,
            },
            {
              sender: 'agent',
              senderName: 'Intern Analyst',
              content: 'Solution brief and technical specification sheet transmitted via secure courier.',
              timestamp: new Date(Date.now() - 50 * 3600 * 1000),
              status: 'sent',
              isInternalNote: false,
            },
            {
              sender: 'customer',
              senderName: 'Daniel Chen',
              content: 'Thank you for transmitting the formal acknowledgement receipt.',
              timestamp: new Date(Date.now() - 48 * 3600 * 1000),
              status: 'delivered',
              isInternalNote: false,
            },
          ],
        },
      ];
      await Conversation.insertMany(demoConversations);
      console.log('✅ Seeded 3 conversation records');
    }

    // Seed Audit Logs if empty
    const auditCount = await AuditLog.countDocuments();
    if (auditCount === 0) {
      const demoLogs = [
        {
          userName: 'Z-CRM Superadmin',
          userEmail: 'superadmin@zeexai.com',
          action: 'SYSTEM_BOOTSTRAP',
          module: 'System',
          recordRef: 'SYS-INIT',
          details: 'Initialized Z-CRM production node and security policies',
          timestamp: new Date(Date.now() - 72 * 3600 * 1000),
        },
        {
          userName: 'Z-CRM Admin',
          userEmail: 'admin@zeexai.com',
          action: 'CREATE_QUOTATION',
          module: 'Quotations',
          recordRef: 'QT-2026-001',
          details: 'Generated formal commercial proposal for Vertex Manufacturing (₹9,04,470)',
          timestamp: new Date(Date.now() - 24 * 3600 * 1000),
        },
        {
          userName: 'Z-CRM Admin',
          userEmail: 'admin@zeexai.com',
          action: 'DISPATCH_DIRECT_MAIL',
          module: 'Direct Mail',
          recordRef: 'DM-1001',
          details: 'Dispatched product catalogue to Dr. Vikram Sarabhai via Blue Dart',
          timestamp: new Date(Date.now() - 12 * 3600 * 1000),
        },
        {
          userName: 'Z-CRM Admin',
          userEmail: 'admin@zeexai.com',
          action: 'ROUND_ROBIN_ASSIGNMENT',
          module: 'Lead Assignment',
          recordRef: 'BATCH-RR-01',
          details: 'Evenly balanced unassigned pipeline leads across 3 active team members',
          timestamp: new Date(Date.now() - 4 * 3600 * 1000),
        },
      ];
      await AuditLog.insertMany(demoLogs);
      console.log('✅ Seeded 4 audit log records');
    }

    console.log('\n🎉 Seeding successfully completed!');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Seeding error:', error.message);
    process.exit(1);
  }
};

seed();
