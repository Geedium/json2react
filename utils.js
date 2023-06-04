import fs from "fs";

export function* traverse(o, path = []) {
  for (const key in o) {
    if (o.hasOwnProperty(key)) {
      const itemPath = path.concat(key);
      const value = o[key];

      yield [key, value, itemPath, o];

      if (typeof value === "object" && value !== null) {
        yield* traverse(value, itemPath);
      }
    }
  }
}

export function readJson(filepath) {
  const rawData = fs.readFileSync(filepath);
  return JSON.parse(rawData);
}
