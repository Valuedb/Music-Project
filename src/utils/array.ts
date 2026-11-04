/**
 * یک آیتم رو از fromIndex به toIndex منتقل می‌کنه و آرایه‌ی جدید برمی‌گردونه.
 * اگه اندیس‌ها نامعتبر یا برابر باشن، همون آرایه‌ی ورودی برمی‌گرده.
 */
export const moveItem = <T>(items: T[], fromIndex: number, toIndex: number): T[] => {
  const inRange = (i: number) => Number.isInteger(i) && i >= 0 && i < items.length;
  if (fromIndex === toIndex || !inRange(fromIndex) || !inRange(toIndex)) return items;

  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
};
