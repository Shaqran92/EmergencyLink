/**
 * @file referral.controller.js
 * @description Controller handlers for hospital referrals.
 */

const referralService = require('../services/referral.service');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');

const create = asyncHandler(async (req, res) => {
  const referral = await referralService.create(req.body, req.user);
  return sendSuccess(res, referral, {}, 201);
});

const list = asyncHandler(async (req, res) => {
  const referrals = await referralService.list(req.user, req.query);
  return sendSuccess(res, referrals);
});

const respond = asyncHandler(async (req, res) => {
  const decision = req.body.decision || req.body.requestStatus;
  const note = req.body.note !== undefined ? req.body.note : req.body.responseNote;
  const referral = await referralService.respond(req.params.id, decision, note, req.user);
  return sendSuccess(res, referral);
});

const clarify = asyncHandler(async (req, res) => {
  const { note } = req.body;
  const referral = await referralService.clarify(req.params.id, note, req.user);
  return sendSuccess(res, referral);
});

const prepare = asyncHandler(async (req, res) => {
  const result = await referralService.prepare(req.params.id, req.body, req.user);
  return sendSuccess(res, result);
});

const transfer = asyncHandler(async (req, res) => {
  const result = await referralService.transfer(req.body, req.user);
  return sendSuccess(res, result, {}, 201);
});

module.exports = {
  create,
  list,
  respond,
  clarify,
  prepare,
  transfer
};

