export const useExistingResourceQuestion = (name: string) => ({
    type: 'confirm',
    name: 'useExistingResource',
    message: `A ${name} resource has already been created. Would you like to use it for this project?`,
    default: true
});
