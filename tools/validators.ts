import type { FAQEntry, LaunchMetaobjectSeed } from "../types.js";

function expectObject(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }

  return value as Record<string, unknown>;
}

export function readString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }

  return value;
}

export function readOptionalString(value: unknown, label: string): string | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  return readString(value, label);
}

export function readStringArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array of strings`);
  }

  return value.map((entry, index) => readString(entry, `${label}[${index}]`));
}

export function readFaqArray(value: unknown, label: string): FAQEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((entry, index) => {
    const record = expectObject(entry, `${label}[${index}]`);
    return {
      q: readString(record.q, `${label}[${index}].q`),
      a: readString(record.a, `${label}[${index}].a`),
    };
  });
}

export function readMetaobject(value: unknown): LaunchMetaobjectSeed {
  const record = expectObject(value, "metaobject");

  const fieldsValue = record.fields;
  if (!Array.isArray(fieldsValue)) {
    throw new Error("metaobject.fields must be an array");
  }

  return {
    type: readString(record.type, "metaobject.type"),
    handle: readString(record.handle, "metaobject.handle"),
    fields: fieldsValue.map((field, index) => {
      const fieldRecord = expectObject(field, `metaobject.fields[${index}]`);
      return {
        key: readString(fieldRecord.key, `metaobject.fields[${index}].key`),
        value: readString(fieldRecord.value, `metaobject.fields[${index}].value`),
      };
    }),
  };
}

export function readRecord(value: unknown, label: string): Record<string, unknown> {
  return expectObject(value, label);
}
