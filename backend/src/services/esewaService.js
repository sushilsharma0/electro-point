import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { paisaToNprString, nprStringToPaisa } from '../utils/money.js';
import { ApiError } from '../utils/ApiError.js';

export function esewaFormUrl() {
  return env.ESEWA_ENV === 'production'
    ? 'https://epay.esewa.com.np/api/epay/main/v2/form'
    : 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';
}

export function esewaStatusUrl() {
  return env.ESEWA_ENV === 'production'
    ? 'https://epay.esewa.com.np/api/epay/transaction/status/'
    : 'https://uat.esewa.com.np/api/epay/transaction/status/';
}

export function signedMessage({ totalAmount, transactionUuid, productCode }) {
  return `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
}

export function signEsewaPayload({ totalAmount, transactionUuid, productCode, secret = env.ESEWA_SECRET }) {
  const message = signedMessage({ totalAmount, transactionUuid, productCode });
  return crypto.createHmac('sha256', secret).update(message).digest('base64');
}

export function verifyEsewaSignature(payload, secret = env.ESEWA_SECRET) {
  const fields = String(payload.signed_field_names || 'total_amount,transaction_uuid,product_code')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const message = fields.map((field) => `${field}=${payload[field]}`).join(',');
  const expected = crypto.createHmac('sha256', secret).update(message).digest('base64');
  const given = String(payload.signature || '');
  if (!given || expected.length !== given.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(given));
}

export function decodeEsewaData(dataParam) {
  if (!dataParam) throw ApiError.badRequest('Missing eSewa data');
  try {
    const json = Buffer.from(String(dataParam), 'base64').toString('utf8');
    return JSON.parse(json);
  } catch {
    throw ApiError.badRequest('Invalid eSewa data');
  }
}

export function buildEsewaFormFields({ amountPaisa, transactionUuid, successUrl, failureUrl }) {
  const totalAmount = paisaToNprString(amountPaisa);
  const productCode = env.ESEWA_PRODUCT_CODE;
  const signature = signEsewaPayload({
    totalAmount,
    transactionUuid,
    productCode,
  });
  return {
    amount: totalAmount,
    tax_amount: '0',
    total_amount: totalAmount,
    transaction_uuid: transactionUuid,
    product_code: productCode,
    product_service_charge: '0',
    product_delivery_charge: '0',
    success_url: successUrl,
    failure_url: failureUrl,
    signed_field_names: 'total_amount,transaction_uuid,product_code',
    signature,
  };
}

export async function fetchEsewaStatus({ productCode, totalAmount, transactionUuid }) {
  const url = new URL(esewaStatusUrl());
  url.searchParams.set('product_code', productCode);
  url.searchParams.set('total_amount', totalAmount);
  url.searchParams.set('transaction_uuid', transactionUuid);
  const res = await fetch(url, { method: 'GET' });
  if (!res.ok) {
    throw ApiError.unprocessable('Unable to verify eSewa payment');
  }
  return res.json();
}

export function esewaStatusIsComplete(status) {
  const s = String(status || '').toUpperCase();
  return s === 'COMPLETE' || s === 'COMPLETED';
}

export function esewaAmountMatches(statusPayload, orderPaisa) {
  const amount = statusPayload.total_amount ?? statusPayload.amount;
  return nprStringToPaisa(String(amount)) === Number(orderPaisa);
}
