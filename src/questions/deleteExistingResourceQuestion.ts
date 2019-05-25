export const deleteExistingResourceQuestion = (name: string) => ({
    type: 'confirm',
    name: 'deleteExistingResource',
    message: `The ${name} resource is about to be deleted. Continue?`,
    default: true
});
