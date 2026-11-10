import { Request, Response, NextFunction } from 'express';

export const integrationAuth = (req: Request, res: Response, next: NextFunction): void => {
  const key = req.headers['x-integration-key'];
  const expectedKey = process.env.INTEGRATION_API_KEY;

  if (!expectedKey) {
    res.status(500).json({ success: false, message: 'Integration key not configured on server' });
    return;
  }

  if (!key || key !== expectedKey) {
    res.status(401).json({ success: false, message: 'Invalid or missing integration key' });
    return;
  }

  next();
};

