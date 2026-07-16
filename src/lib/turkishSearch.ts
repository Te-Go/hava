// src/lib/turkishSearch.ts - Elite Turkish locale-aware normalization engine
export function normalizeTurkish(str: string): string {
  return str
    .toLocaleLowerCase('tr-TR') // Handles İ->i, I->ı with flawless accuracy
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .trim();
}

export function turkishFuzzyMatch(query: string, target: string): boolean {
  return normalizeTurkish(target).includes(normalizeTurkish(query));
}
