/**
 * @file referral.schema.js
 * @description Zod validation schemas for referral requests, responses, and coordinator clarification.
 */

const { z } = require('zod');

const createReferralSchema = z.object({
  caseId: z.string({ required_error: 'caseId is required' }).min(1, 'caseId cannot be empty'),
  hospitalId: z.string({ required_error: 'hospitalId is required' }).min(1, 'hospitalId cannot be empty')
});

const respondReferralSchema = z.object({
  decision: z.enum(['accepted', 'rejected', 'clarification_requested']).optional(),
  requestStatus: z.enum(['accepted', 'rejected', 'clarification_requested']).optional(),
  note: z.string().max(500, 'Note must not exceed 500 characters').optional().nullable(),
  responseNote: z.string().max(500, 'Response note must not exceed 500 characters').optional().nullable()
}).refine(data => data.decision || data.requestStatus, {
  message: 'decision or requestStatus is required and must be accepted, rejected, or clarification_requested'
});

const clarifyReferralSchema = z.object({
  note: z.string({ required_error: 'note is required' }).min(1, 'note cannot be empty').max(500, 'Note must not exceed 500 characters')
});

module.exports = {
  createReferralSchema,
  respondReferralSchema,
  clarifyReferralSchema
};
