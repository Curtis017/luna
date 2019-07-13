import { ConfirmQuestion } from "inquirer";

export const deleteStackQuestion = (stack: string): ConfirmQuestion<any> => ({
    type: 'confirm',
    name: 'deleteStack',
    message: `${stack}\nContinue?`,
    default: false
});
