export function ev(data, error = null) {
    if (data !== null && error === null) {
        return [data, null];
    }
    if (data === null && error !== null) {
        return [null, { ...error, success: false }];
    }
    return [
        null,
        {
            status: 500,
            success: false,
            message: 'Unexpected state: both data and error are provided.',
        },
    ];
}
export function getElectionStatus(args) {
    const now = Date.now();
    if (args.startDate.getTime() >= now)
        return 'inactive';
    if (args.endDate.getTime() <= now)
        return 'ended';
    return 'active';
}
//# sourceMappingURL=util.js.map