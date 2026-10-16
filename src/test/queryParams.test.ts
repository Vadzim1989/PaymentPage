import { describe, expect, it } from 'vitest';
import { getQueryParams } from '@/utils/queryParams';

describe('getQueryParams', () => {
  it('decodes query values and keeps the last value for duplicate keys', () => {
    expect(getQueryParams('?back_url_s=https%3A%2F%2Fshop.test%2Fdone&mode=fast&mode=safe')).toEqual({
      back_url_s: 'https://shop.test/done',
      mode: 'safe',
    });
  });

  it('returns an empty object when there are no query parameters', () => {
    expect(getQueryParams('')).toEqual({});
  });
});
