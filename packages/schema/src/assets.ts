export type AssetKind = 'image' | 'audio' | 'document' | 'other';

export type AssetRef = {
  id: string;
  kind: AssetKind;
  packagePath: string;
  label?: string;
  mimeType?: string;
};
