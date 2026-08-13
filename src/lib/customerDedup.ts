export const CUSTOMER_NAME_PREFIXES = [
  'bu', 'bpk', 'pak', 'ibu', 'mbak', 'mas', 'kak', 'si', 'om', 'tante', 'bang', 'nona',
  'sdr', 'saudara', 'nyonya', 'ny', 'kk'
] as const;

export function normalizePhone(value?: string | null): string {
  if (!value) return '';

  const digits = value.toString().replace(/\D/g, '');
  if (!digits) return '';

  return digits;
}

export function normalizeCustomerName(name?: string | null): string {
  if (!name) return '';

  const withAccents = name
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  const withoutPrefix = withAccents.replace(new RegExp(`^(${CUSTOMER_NAME_PREFIXES.join('|')})\\s+`, 'i'), '');

  return withoutPrefix
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function phonesMatch(left?: string | null, right?: string | null): boolean {
  const leftPhone = normalizePhone(left);
  const rightPhone = normalizePhone(right);

  if (!leftPhone || !rightPhone) return false;
  if (leftPhone === rightPhone) return true;

  const variations = [
    leftPhone,
    leftPhone.replace(/^0/, '62'),
    rightPhone,
    rightPhone.replace(/^0/, '62')
  ];

  return variations[0] === variations[2] || variations[0] === variations[3] || variations[1] === variations[2] || variations[1] === variations[3];
}

export function findSimilarCustomerName(leftName?: string | null, rightName?: string | null): boolean {
  const left = normalizeCustomerName(leftName);
  const right = normalizeCustomerName(rightName);

  if (!left || !right) return false;
  if (left === right) return true;

  if (left.length < 3 || right.length < 3) return false;

  const leftTokens = left.split(/\s+/);
  const rightTokens = right.split(/\s+/);

  const overlap = leftTokens.filter(token => rightTokens.includes(token));
  const isSubstringMatch = left.includes(right) || right.includes(left);

  return overlap.length > 0 || isSubstringMatch;
}

export function resolveCustomerMatch(
  customers: Array<{ id?: string; name?: string | null; phone?: string | null }>,
  payload: { customerName?: string | null; customerPhone?: string | null }
) {
  if (!Array.isArray(customers) || customers.length === 0) return undefined;

  const inputPhone = normalizePhone(payload.customerPhone);
  const inputName = normalizeCustomerName(payload.customerName);

  if (inputPhone) {
    const byPhone = customers.find(customer => phonesMatch(customer.phone, inputPhone));
    if (byPhone) return byPhone;
  }

  if (inputName) {
    const byExactName = customers.find(customer => normalizeCustomerName(customer.name) === inputName);
    if (byExactName) return byExactName;

    const bySimilarName = customers.find(customer => findSimilarCustomerName(customer.name, inputName));
    if (bySimilarName) return bySimilarName;
  }

  return undefined;
}
