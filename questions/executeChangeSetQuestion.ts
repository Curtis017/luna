import { ConfirmQuestion } from "inquirer";

export const executeChangeSetQuestion = (changeSet: string): ConfirmQuestion<any> => ({
    type: 'confirm',
    name: 'executeChangeSet',
    message: `${changeSet}\nContinue?`,
    default: false
});
