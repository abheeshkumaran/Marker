export function serializePayment(p) {
    return {
        id: String(p._id),
        date: p.date,
        duePayment: p.duePayment,
        transferTo: p.transferTo,
        noOfPendings: p.noOfPendings,
        paidCount: p.paidCount,
        status: p.status,
    };
}

// Moves a UTC date by `months`, landing on `dueDay` (or the month's last day if it is shorter).
export function addMonths(date, months, dueDay = date.getUTCDate()) {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + months;
    const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    return new Date(Date.UTC(year, month, Math.min(dueDay, lastDay)));
}
