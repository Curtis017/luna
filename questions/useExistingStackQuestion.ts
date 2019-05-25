export const useExistingStackQuestion = (changeSet: string) => ({
    type: 'confirm',
    name: 'useExistingStack',
    message: `${changeSet}\nContinue?`,
    default: false
});
