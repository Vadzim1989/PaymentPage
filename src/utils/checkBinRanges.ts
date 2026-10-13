import { card } from "@/utils/creditcard";

export function isPanInRange(pan, binRanges) {
  if (!pan || !binRanges) {
    return false;
  }

  const normalizedRanges = binRanges.replace(/\s/g, '');

  return normalizedRanges.split(",").some((binRange) => {
    const [startBinRange, endBinRange] = binRange.split("-");
    const panPart = parseInt(
      card.parse(pan).substring(0, startBinRange.length)
    );

    return panPart >= +startBinRange && panPart <= +endBinRange;
  });
}
