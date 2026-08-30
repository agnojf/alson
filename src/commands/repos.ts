import { AlsonError } from '../errors.js';
import {
  addRepositoryParent,
  removeRepositoryParent,
  repositoryParents
} from '../repositories/config.js';

export async function runRepos(action: string | undefined, input: string | undefined): Promise<void> {
  switch (action) {
    case 'add': {
      if (!input) {
        throw new AlsonError('Usage', 'repos add requires a parent folder. Run alson --help for usage');
      }
      const result = await addRepositoryParent(input);
      console.log(`${result.added ? 'added' : 'already configured'} repository parent ${result.path}`);
      return;
    }
    case 'remove': {
      if (!input) {
        throw new AlsonError('Usage', 'repos remove requires a parent folder. Run alson --help for usage');
      }
      const result = await removeRepositoryParent(input);
      console.log(`${result.removed ? 'removed' : 'not configured'} repository parent ${result.path}`);
      return;
    }
    case 'list': {
      const parents = await repositoryParents();
      if (parents.length === 0) {
        console.log('no repository parent folders configured');
        return;
      }
      for (const parent of parents) {
        console.log(parent);
      }
      return;
    }
    default:
      throw new AlsonError('Usage', 'repos requires add, remove, or list. Run alson --help for usage');
  }
}
