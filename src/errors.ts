export type ErrorCode =
  | 'CatalogMissing'
  | 'UnknownSkill'
  | 'InvalidPackage'
  | 'Unmanaged'
  | 'ModifiedInstall'
  | 'NotInstalled'
  | 'UnsafePath'
  | 'StateCorrupt'
  | 'UnknownCommand'
  | 'Rollback'
  | 'NoRepository'
  | 'Usage';

export class AlsonError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'AlsonError';
  }
}
