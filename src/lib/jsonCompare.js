import {
  maxDifferences,
  maxLineHighlightChars,
  maxPreviewLength,
  maxRenderedLineNumbers,
} from "./constants";

export function getLineNumbers(value) {
  let lineCount = 1;

  for (let index = 0; index < value.length; index += 1) {
    if (value[index] === "\n") lineCount += 1;
    if (lineCount >= maxRenderedLineNumbers) break;
  }

  return Array.from({ length: lineCount }, (_, index) => index + 1);
}

export function tokenizePath(path) {
  return [...path.matchAll(/\.([^.[\]]+)|\[(\d+)\]/g)].map(
    (match) => match[1] ?? Number(match[2]),
  );
}

function escapeJsonKey(key) {
  return key.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}

export function findLineForPath(json, path) {
  if (path === "$") return 1;

  const lines = json.split("\n");
  const segments = tokenizePath(path);
  const nearestKey = [...segments].reverse().find((segment) => {
    return typeof segment === "string";
  });

  if (nearestKey) {
    const keyNeedle = `"${escapeJsonKey(nearestKey)}"`;
    const keyLineIndex = lines.findIndex((line) => line.includes(keyNeedle));

    if (keyLineIndex !== -1) return keyLineIndex + 1;
  }

  const lastSegment = segments.at(-1);
  const parentKey = [...segments]
    .slice(0, -1)
    .reverse()
    .find((segment) => typeof segment === "string");

  if (typeof lastSegment === "number" && parentKey) {
    const parentNeedle = `"${escapeJsonKey(parentKey)}"`;
    const parentLineIndex = lines.findIndex((line) =>
      line.includes(parentNeedle),
    );

    if (parentLineIndex === -1) return null;
    if (lines[parentLineIndex].includes("]")) return parentLineIndex + 1;

    let itemIndex = -1;

    for (let index = parentLineIndex + 1; index < lines.length; index += 1) {
      const trimmedLine = lines[index].trim();

      if (trimmedLine.startsWith("]")) return parentLineIndex + 1;
      if (!trimmedLine || trimmedLine === "[") continue;

      itemIndex += 1;
      if (itemIndex === lastSegment) return index + 1;
    }
  }

  return null;
}

export function getLineDifferenceMap(json, differences) {
  const lineMap = new Map();

  if (json.length > maxLineHighlightChars) return lineMap;

  differences.forEach((difference) => {
    const line = findLineForPath(json, difference.path);
    if (!line) return;
    lineMap.set(line, [...(lineMap.get(line) ?? []), difference]);
  });

  return lineMap;
}

export function parseJson(value) {
  if (!value.trim()) {
    return { data: null, error: null, empty: true };
  }

  try {
    return { data: JSON.parse(value), error: null, empty: false };
  } catch (error) {
    return { data: null, error: error.message, empty: false };
  }
}

export function valueType(value) {
  if (Array.isArray(value)) return "array";
  if (value === null) return "null";
  return typeof value;
}

export function formatValue(value) {
  if (value === undefined) return "missing";

  const type = valueType(value);

  if (type === "array") return `[array:${value.length}]`;
  if (type === "object") return `{object:${Object.keys(value ?? {}).length}}`;

  const formattedValue =
    typeof value === "string" ? `"${value}"` : JSON.stringify(value);

  if (formattedValue.length <= maxPreviewLength) return formattedValue;
  return `${formattedValue.slice(0, maxPreviewLength)}...`;
}

export function compareJson(source, target, options, path = "$", differences = []) {
  if (
    differences.length >= maxDifferences ||
    path.length > 2000 ||
    Object.is(source, target)
  ) {
    return differences;
  }

  const sourceType = valueType(source);
  const targetType = valueType(target);

  if (sourceType !== targetType) {
    if (options.valueType) {
      differences.push({
        type: "type",
        path,
        source: `${sourceType}: ${formatValue(source)}`,
        target: `${targetType}: ${formatValue(target)}`,
      });
    }

    return differences;
  }

  if (sourceType !== "object" && sourceType !== "array") {
    if (options.value) {
      differences.push({
        type: "value",
        path,
        source: formatValue(source),
        target: formatValue(target),
      });
    }

    return differences;
  }

  const keys = new Set([
    ...Object.keys(source ?? {}),
    ...Object.keys(target ?? {}),
  ]);

  for (const key of keys) {
    if (differences.length >= maxDifferences) break;

    const nextPath = Array.isArray(source)
      ? `${path}[${key}]`
      : `${path}.${key}`;
    const sourceHasKey = Object.prototype.hasOwnProperty.call(source, key);
    const targetHasKey = Object.prototype.hasOwnProperty.call(target, key);

    if (!sourceHasKey) {
      if (options.key) {
        differences.push({
          type: "added",
          path: nextPath,
          source: "missing",
          target: formatValue(target[key]),
        });
      }
      continue;
    }

    if (!targetHasKey) {
      if (options.key) {
        differences.push({
          type: "removed",
          path: nextPath,
          source: formatValue(source[key]),
          target: "missing",
        });
      }
      continue;
    }

    compareJson(source[key], target[key], options, nextPath, differences);
  }

  return differences;
}

export function keyFromPath(path) {
  if (path === "$") return "$";
  const bracketMatch = path.match(/\[(\d+)\]$/);
  if (bracketMatch) return `[${bracketMatch[1]}]`;
  return path.split(".").at(-1);
}

export function isContainerValue(value) {
  const type = valueType(value);
  return type === "object" || type === "array";
}

export function getChildPath(parentPath, key, parentIsArray) {
  return parentIsArray ? `${parentPath}[${key}]` : `${parentPath}.${key}`;
}

export function getDescendantDifferenceCount(path, differences) {
  if (path === "$") return differences.length;

  return differences.filter((difference) => {
    return (
      difference.path === path ||
      difference.path.startsWith(`${path}.`) ||
      difference.path.startsWith(`${path}[`)
    );
  }).length;
}

export function containerLabel(value) {
  const type = valueType(value);
  const size = type === "array" ? value.length : Object.keys(value ?? {}).length;
  return type === "array" ? `Array(${size})` : `Object(${size})`;
}
