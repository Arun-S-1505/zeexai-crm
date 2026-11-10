import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import { Conversation } from '../models/Conversation';
import { Lead } from '../models/Lead';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';

const router = Router();
router.use(authenticate);

// GET /api/messages/conversations — List conversations with filters & search
router.get('/conversations', async (req: Request, res: Response): Promise<void> => {
  try {
    const search = (req.query.search as string) || '';
    const channel = (req.query.channel as string) || '';
    const status = (req.query.status as string) || '';
    const assignedTo = (req.query.assignedTo as string) || '';

    const filter: any = {};

    if (channel && channel !== 'All') {
      filter.channel = channel;
    }
    if (status && status !== 'All') {
      filter.status = status;
    }
    if (assignedTo && assignedTo !== 'All') {
      filter.assignedTo = assignedTo;
    }

    if (search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { conversationId: regex },
        { contactName: regex },
        { contactEmail: regex },
        { company: regex },
        { lastMessage: regex },
      ];
    }

    const conversations = await Conversation.find(filter)
      .populate('assignedTo', 'name email role')
      .populate('relatedLead', 'leadId firstName lastName company status priority')
      .sort({ lastMessageAt: -1 })
      .lean();

    // Summary counts
    const all = await Conversation.find({}, { status: 1, unreadCount: 1 }).lean();
    const metrics = {
      total: all.length,
      open: all.filter((c) => c.status === 'Open').length,
      unread: all.reduce((sum, c) => sum + (c.unreadCount || 0), 0),
      resolved: all.filter((c) => c.status === 'Resolved').length,
    };

    res.json({
      success: true,
      data: conversations,
      metrics,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// GET /api/messages/conversations/:id — Get conversation details & full thread
router.get('/conversations/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const conv = await Conversation.findById(req.params.id)
      .populate('assignedTo', 'name email role')
      .populate('relatedLead')
      .populate('messages.senderId', 'name email role');

    if (!conv) {
      res.status(404).json({ success: false, message: 'Conversation not found' });
      return;
    }

    // Auto clear unread count on open
    if (conv.unreadCount > 0) {
      conv.unreadCount = 0;
      await conv.save();
    }

    res.json({ success: true, data: conv });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// POST /api/messages/conversations — Create conversation
router.post(
  '/conversations',
  [
    body('contactName').trim().notEmpty().withMessage('Contact name is required'),
    body('contactEmail').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('initialMessage').trim().notEmpty().withMessage('Initial message is required'),
    validateRequest,
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        contactName,
        contactEmail,
        contactPhone,
        company,
        channel,
        initialMessage,
        relatedLead,
        assignedTo,
      } = req.body;

      const userId = (req as any).user?.userId || (req as any).user?._id;
      const userName = (req as any).user?.name || 'CRM Team';

      const conv = new Conversation({
        contactName,
        contactEmail,
        contactPhone: contactPhone || '',
        company: company || '',
        channel: channel || 'Website enquiry',
        status: 'Open',
        assignedTo: assignedTo || userId || null,
        relatedLead: relatedLead || null,
        lastMessage: initialMessage,
        lastMessageAt: new Date(),
        unreadCount: 0,
        messages: [
          {
            sender: 'agent',
            senderName: userName,
            senderId: userId || null,
            content: initialMessage,
            timestamp: new Date(),
            status: 'sent',
            isInternalNote: false,
          },
        ],
      });

      await conv.save();

      const populated = await Conversation.findById(conv._id)
        .populate('assignedTo', 'name email role')
        .populate('relatedLead');

      res.status(201).json({ success: true, data: populated });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to create conversation' });
    }
  }
);

// POST /api/messages/conversations/:id/reply — Send reply in conversation
router.post(
  '/conversations/:id/reply',
  [body('content').trim().notEmpty().withMessage('Reply content is required'), validateRequest],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const conv = await Conversation.findById(req.params.id);
      if (!conv) {
        res.status(404).json({ success: false, message: 'Conversation not found' });
        return;
      }

      const userId = (req as any).user?.userId || (req as any).user?._id;
      const userName = (req as any).user?.name || 'ZEE X AI Agent';
      const { content } = req.body;

      conv.messages.push({
        sender: 'agent',
        senderName: userName,
        senderId: userId || null,
        content,
        timestamp: new Date(),
        status: 'sent',
        isInternalNote: false,
      });

      conv.lastMessage = content;
      conv.lastMessageAt = new Date();
      conv.status = 'Pending'; // Awaiting customer response

      await conv.save();

      const updated = await Conversation.findById(conv._id)
        .populate('assignedTo', 'name email role')
        .populate('relatedLead');

      res.json({ success: true, data: updated, message: 'Reply sent' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to send reply' });
    }
  }
);

// POST /api/messages/conversations/:id/note — Add internal note (never sent to customer)
router.post(
  '/conversations/:id/note',
  [body('note').trim().notEmpty().withMessage('Note text is required'), validateRequest],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const conv = await Conversation.findById(req.params.id);
      if (!conv) {
        res.status(404).json({ success: false, message: 'Conversation not found' });
        return;
      }

      const userId = (req as any).user?.userId || (req as any).user?._id;
      const userName = (req as any).user?.name || 'Staff Member';
      const { note } = req.body;

      conv.messages.push({
        sender: 'system',
        senderName: `${userName} (Internal Note)`,
        senderId: userId || null,
        content: note,
        timestamp: new Date(),
        status: 'sent',
        isInternalNote: true,
      });

      await conv.save();

      const updated = await Conversation.findById(conv._id)
        .populate('assignedTo', 'name email role')
        .populate('relatedLead');

      res.json({ success: true, data: updated, message: 'Internal note added' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to add note' });
    }
  }
);

// PATCH /api/messages/conversations/:id/status — Update conversation status
router.patch('/conversations/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    const conv = await Conversation.findById(req.params.id);
    if (!conv) {
      res.status(404).json({ success: false, message: 'Conversation not found' });
      return;
    }

    conv.status = status;
    await conv.save();

    res.json({ success: true, data: conv, message: `Status updated to ${status}` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update status' });
  }
});

// PATCH /api/messages/conversations/:id/assign — Assign conversation to user
router.patch('/conversations/:id/assign', async (req: Request, res: Response): Promise<void> => {
  try {
    const { assignedTo } = req.body;
    const conv = await Conversation.findById(req.params.id);
    if (!conv) {
      res.status(404).json({ success: false, message: 'Conversation not found' });
      return;
    }

    conv.assignedTo = assignedTo;
    await conv.save();

    const updated = await Conversation.findById(conv._id).populate('assignedTo', 'name email role');
    res.json({ success: true, data: updated, message: 'Conversation assigned' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to assign conversation' });
  }
});

// POST /api/messages/conversations/:id/convert-lead — Convert conversation to a new Lead
router.post('/conversations/:id/convert-lead', async (req: Request, res: Response): Promise<void> => {
  try {
    const conv = await Conversation.findById(req.params.id);
    if (!conv) {
      res.status(404).json({ success: false, message: 'Conversation not found' });
      return;
    }

    if (conv.relatedLead) {
      res.status(400).json({ success: false, message: 'Conversation is already linked to a lead' });
      return;
    }

    const nameParts = conv.contactName.trim().split(' ');
    const firstName = nameParts[0] || 'Inquiry';
    const lastName = nameParts.slice(1).join(' ') || 'Contact';

    const newLead = new Lead({
      firstName,
      lastName,
      company: conv.company || `${firstName}'s Enterprise`,
      email: conv.contactEmail,
      phone: conv.contactPhone || undefined,
      interestedProduct: req.body.interestedProduct || 'Z-Factory',
      source: conv.channel === 'Website enquiry' ? 'Website enquiry' : 'Contact form',
      status: 'New',
      priority: 'Medium',
      requirements: conv.lastMessage || 'Inquiry received through messages portal',
      assignedTo: conv.assignedTo || null,
    });

    await newLead.save();

    conv.relatedLead = newLead._id;
    await conv.save();

    const populated = await Conversation.findById(conv._id)
      .populate('relatedLead')
      .populate('assignedTo', 'name email role');

    res.status(201).json({
      success: true,
      data: populated,
      leadId: newLead.leadId,
      message: `Lead ${newLead.leadId} created and linked to conversation`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to convert to lead' });
  }
});

export default router;
