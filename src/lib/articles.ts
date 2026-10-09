/** หมวดบทความ — ต้องตรงกับ ARTICLE_CATEGORIES ใน content.config.ts */
export type ArticleCategory = 'worship' | 'days' | 'pang' | 'shrine';

export const ARTICLE_CATEGORY_LABEL: Record<ArticleCategory, string> = {
  worship: 'ไหว้อย่างไร',
  pang: 'ปางและความหมาย',
  days: 'วันสำคัญ',
  shrine: 'เกี่ยวกับตำหนัก',
};

export const ARTICLE_CATEGORY_LABEL_ZH: Record<ArticleCategory, string> = {
  worship: '如何參拜',
  pang: '法相與意涵',
  days: '節日',
  shrine: '關於本堂',
};
