export const deleteStackQuestion = (stack: string) => ({
    type: 'confirm',
    name: 'deleteStack',
    message: `${stack}\nContinue?`,
    default: false
});
