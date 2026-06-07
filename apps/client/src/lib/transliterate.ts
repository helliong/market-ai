// Transliterates a Russian string to a Latin slug
export function transliterateSlug(text: string): string {
  const cyrillicToLatinMap: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh",
    з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
    п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c",
    ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu",
    я: "ya",
  };

  const normalized = text.toLowerCase().trim();
  
  let result = "";
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];
    if (cyrillicToLatinMap[char] !== undefined) {
      result += cyrillicToLatinMap[char];
    } else {
      result += char;
    }
  }

  // Replace spaces and special characters with hyphens
  return result
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
