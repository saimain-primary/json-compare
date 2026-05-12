export const starterSource = `{
  "name": "blame-the-api",
  "version": "1.0.0",
  "features": ["paste", "format", "compare"],
  "enabled": true
}`;

export const starterTarget = `{
  "name": "blame-the-api",
  "version": "1.1.0",
  "features": ["paste", "format", "compare", "export"],
  "enabled": true
}`;

export const defaultCompareOptions = {
  key: true,
  valueType: true,
  value: true,
};

export const themeStorageKey = "blame-the-api:theme";

export const maxDifferences = 500;
export const maxRenderedLineNumbers = 3000;
export const maxPreviewLength = 500;
export const maxLiveCompareChars = 800000;
export const maxLineHighlightChars = 250000;
export const maxTreeDepth = 12;
export const maxVisibleTreeChildren = 200;
