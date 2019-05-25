export const executeChangeSetQuestion = (changeSet: string) => ({
    type: 'confirm',
    name: 'executeChangeSet',
    message: `${changeSet}\nContinue?`,
    default: false
});
