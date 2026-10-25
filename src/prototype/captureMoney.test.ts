import { describe, expect, it } from 'vitest';
import { extractMoneyExpenses, parseRupiahText } from './captureMoney';

describe('rupiah in real-world chat formats (local prototype patterns)', () => {
  it.each(['20rb', '20 ribu', '20k', '20.000', 'Rp20.000', 'Rp 20.000,00', '20000'])('reads %s as twenty thousand, never twenty', input => expect(parseRupiahText(input)).toBe(20000));
  it('accepts explicit comma fractions with a multiplier and explicit free shipping', () => {
    expect(parseRupiahText('12,5rb')).toBe(12500);
    expect(parseRupiahText('1,5 juta')).toBe(1500000);
    expect(parseRupiahText('gratis')).toBe(0);
  });
  it.each(['20,000', '20.5rb', '-20000', '20-25rb', 'belum tahu', 'Rp', '99999999999999999999'])('does not guess ambiguous input %s', input => expect(parseRupiahText(input)).toBeNull());
  it('reproduces and fixes the verified 20rb + 5rb cost bug', () => {
    expect(extractMoneyExpenses('Bu Ani pesan 2 reguler. Ongkir 20rb, infaq 5rb.').expenses.map(row => row.amount)).toEqual([20000, 5000]);
    expect(extractMoneyExpenses('Ongkir Rp20.000, infaq 5.000.').expenses.map(row => row.amount)).toEqual([20000, 5000]);
  });
  it('requires manual review for unknown values, ranges, repeated charges and payer ambiguity', () => {
    expect(extractMoneyExpenses('Ongkir 20-25rb').expenses).toHaveLength(0);
    expect(extractMoneyExpenses('Ongkir belum tahu').issues).toHaveLength(1);
    expect(extractMoneyExpenses('Ongkir belum tahu').unresolved).toEqual(['ongkir']);
    expect(extractMoneyExpenses('Ongkir 20rb, ongkir 25rb').issues.length).toBeGreaterThan(0);
    expect(extractMoneyExpenses('Ongkir 20rb dibayar pembeli').issues.length).toBeGreaterThan(0);
  });
});
