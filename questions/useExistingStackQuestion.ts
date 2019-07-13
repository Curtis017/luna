import { ConfirmQuestion } from "inquirer";

export const useExistingStackQuestion = (changeSet: string): ConfirmQuestion<any> => ({
    type: 'confirm',
    name: 'useExistingStack',
    message: `${changeSet}\nContinue?`,
    default: false
});
