import { describe, expect, it } from 'vitest';
import { splitGuideColumns } from '@/pages/guides/GuidesNewsBoard';

describe('splitGuideColumns', () => {
  it('puts six stories in two columns of three', () => {
    expect(splitGuideColumns([1, 2, 3, 4, 5, 6])).toEqual([
      [1, 2, 3],
      [4, 5, 6],
    ]);
  });

  it('wraps extra stories into the next left/right pair', () => {
    expect(splitGuideColumns([1, 2, 3, 4, 5, 6, 7])).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
    expect(splitGuideColumns([1, 2, 3, 4, 5, 6, 7, 8])).toEqual([
      [1, 2, 3],
      [4, 5, 6],
      [7, 8],
    ]);
    expect(splitGuideColumns([1, 2, 3, 4, 5, 6, 7, 8, 9])).toEqual([
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ]);
  });
});
