import { deleteSkill } from '../installer/install.js';

export interface DeleteArgs {
  skill: string;
  force: boolean;
}

export async function runDelete(args: DeleteArgs): Promise<void> {
  const dir = await deleteSkill(args.skill, { force: args.force });
  console.log(`removed ${dir}`);
}
